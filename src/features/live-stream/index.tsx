import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Settings2, Camera } from 'lucide-react';
import { logger } from '@/utils/logger';
import LiveStream from './components/live-video-player';
import CameraSelect from './components/live-camera-select';
import TabButtons from './components/live-tab-buttons';
import type { Camera as CameraType } from '@/features/cameras/camera-list/types/cameras';
import { Header } from '@/components/layouts/header';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { SearchField } from '@/components/search';
import { Main } from '@/components/layouts/main';
import ChatInterface from './components/live-chat';
import NotificationsPanel from './components/live-notifications-panel';
import LiveSearchPanel from './components/live-search-panel';
// import VideoClips from './components/live-video-clips'; // Disabled - Video Clips feature commented out for future use
import LiveConfiguration from './components/live-configuration';
import FullTimelineView from '@/features/live-stream/components/full-timeline-view';
import LiveDynamicInsightsDashboard from './components/live-dynamic-insights-dashboard';
import {
  fetchCams,
  fetchCamByHash,
  selectCams,
  selectSelectedCam,
  selectLoading,
  selectCameraLoading,
} from '@/store/slices/camera-slice';
import type { AppDispatch, RootState } from '@/store';
import type { ActiveTab } from './components/live-tab-buttons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getCameraId = (camera: CameraType): number => {
  const idValue = camera.id ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof idValue === 'number' ? idValue : Number(idValue as any);
};

const constructHlsUrl = (camera: CameraType): string => {
  if (camera.hls_url) {
    if (camera.hls_expiry && new Date(camera.hls_expiry) < new Date()) {
      logger.warn('HLS URL expired—will trigger refetch');
      // Return the expired URL temporarily while refetch is triggered
      // This prevents blank screen and allows proper error handling in video player
      return camera.hls_url;
    }
    return camera.hls_url;
  }
  return '';
};

const getCameraCohortHash = (camera: CameraType | null | undefined): string => {
  if (!camera) {
    return '';
  }

  return camera.user_role_cohort_hash || camera.userRoleCohortHash || '';
};

const LiveStreamPage: React.FC = () => {
  const { cameraName } = useParams<{ cameraName: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  useMemo(
    () => (cameraName ? decodeURIComponent(cameraName) : 'Unknown'),
    [cameraName]
  );

  const allCameras = useSelector((state: RootState) => selectCams(state));
  const selectedCam = useSelector((state: RootState) =>
    selectSelectedCam(state)
  );
  const allCamerasLoading = useSelector((state: RootState) =>
    selectLoading(state)
  );
  const cameraLoading = useSelector((state: RootState) =>
    selectCameraLoading(state)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [isRefetchingExpiry, setIsRefetchingExpiry] = useState(false);
  const [modelHash, setModelHash] = useState<string>('');
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const refetchInProgressRef = useRef(false);
  const expiryCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    logger.debug('[LiveStreamPage] Model hash changed:', modelHash);
  }, [modelHash]);

  const locationState = useMemo(
    () =>
      (location.state as
        | { camera?: CameraType; cohortHash?: string }
        | undefined) ?? undefined,
    [location.state]
  );

  const cameraFromState: CameraType | null = useMemo(
    () => locationState?.camera || null,
    [locationState]
  );

  const routeCohortHash = searchParams.get('cohort')?.trim() || '';
  const selectedCohortHash =
    routeCohortHash ||
    locationState?.cohortHash ||
    getCameraCohortHash(cameraFromState);

  const authCohortHash = useSelector(
    (state: RootState) => state.auth.currentRoleCohortHash
  );

  const handleBackToLiveCameras = () => {
    const target = selectedCohortHash
      ? `/live?cohort=${encodeURIComponent(selectedCohortHash)}`
      : '/live';
    navigate(target);
  };

  useEffect(() => {
    if (allCameras.length > 0) {
      logger.debug('Cameras already loaded, skipping fetch');
      return;
    }

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');

    if (!token) {
      return;
    }

    logger.debug('Fetching all cameras for dropdown...');
    dispatch(
      fetchCams({
        cohortHash: selectedCohortHash || authCohortHash || undefined,
        page: 1,
        itemsPerPage: 1000,
      })
    );
  }, [dispatch, selectedCohortHash, authCohortHash, allCameras.length]);

  useEffect(() => {
    if (cameraFromState?.cam_hash) {
      // Check if HLS URL is expired before using it
      const needsRefetch =
        cameraFromState.hls_expiry &&
        new Date(cameraFromState.hls_expiry) < new Date();

      if (needsRefetch) {
        logger.warn(
          'Camera from state has expired HLS URL, fetching fresh data...'
        );
      }

      // Always fetch to ensure we have the latest HLS URL
      dispatch(
        fetchCamByHash({
          camHash: cameraFromState.cam_hash,
          cohortHash: selectedCohortHash,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFromState?.cam_hash, dispatch, selectedCohortHash]);

  // Handle hard refresh: fetch camera by name from URL when navigation state is lost
  useEffect(() => {
    // Skip if we already have camera from navigation state
    if (cameraFromState) return;

    // Skip if no camera name in URL
    if (!cameraName) return;

    // Skip if cameras haven't loaded yet
    if (allCameras.length === 0) return;

    const decodedCameraName = decodeURIComponent(cameraName);
    const norm = (s: string) => s.trim().toLowerCase();
    const target = norm(decodedCameraName);

    const foundCamera = allCameras.find((cam) => {
      const name = cam.camName?.trim();
      return name && norm(name) === target;
    });

    if (
      foundCamera?.camHash &&
      (!selectedCam || selectedCam.camHash !== foundCamera.camHash)
    ) {
      logger.debug(
        'Hard refresh detected - fetching camera by hash:',
        foundCamera.camHash
      );
      dispatch(
        fetchCamByHash({
          camHash: foundCamera.camHash,
          cohortHash: selectedCohortHash,
        })
      );
    }
  }, [
    cameraFromState,
    cameraName,
    allCameras,
    selectedCam,
    dispatch,
    selectedCohortHash,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedAllCameras = useMemo<any[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return allCameras.map((cam: any) => ({
      id: cam.camId,
      cam_hash: cam.camHash,
      cam_name: cam.camName,
      cam_latitude: parseFloat(cam.camLatitude || '0'),
      cam_longitude: parseFloat(cam.camLongitude || '0'),
      cam_status: cam.camStatus,
      cam_placement_zone: cam.camPlacementZone,
      cam_placement_subzone: cam.camPlacementSubzone,
      cam_placement_zone_slot: cam.camPlacementZoneSlot,
      cam_ip: cam.camIp,
      cam_type: cam.camType,
      cam_resolution: cam.camResolution,
      cam_address1: cam.camAddress1,
      cam_city: cam.camCity,
      cam_zipcode: cam.camZipcode,
      created_at: cam.createdAt,
      updated_at: cam.updatedAt || new Date().toISOString(),
      hls_url: cam.hlsUrl,
      hls_expiry: cam.hlsExpiry,
      cam_model_requestparams: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cohort_id: (cam as any).userRoleCohortId || cam.userRoleCohortHash || '',
      userRoleCohortHash: cam.userRoleCohortHash || '',
      user_role_cohort_hash: cam.userRoleCohortHash || '',
      user_id: '',
      is_deleted: false,
      cam_cloud_stream_id: cam.camCloudStreamId,
    }));
  }, [allCameras]);

  const mappedSelectedCam = useMemo<CameraType | null>(() => {
    if (!selectedCam) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cam = selectedCam as any;
    return {
      id: cam.camId,
      cam_hash: cam.camHash,
      cam_name: cam.camName,
      cam_latitude: parseFloat(cam.camLatitude || '0'),
      cam_longitude: parseFloat(cam.camLongitude || '0'),
      cam_status: cam.camStatus,
      cam_placement_zone: cam.camPlacementZone,
      cam_placement_subzone: cam.camPlacementSubzone,
      cam_placement_zone_slot: cam.camPlacementZoneSlot,
      cam_ip: cam.camIp,
      cam_type: cam.camType,
      cam_resolution: cam.camResolution,
      cam_address1: cam.camAddress1,
      cam_city: cam.camCity,
      cam_zipcode: cam.camZipcode,
      created_at: cam.createdAt,
      updated_at: cam.updatedAt || new Date().toISOString(),
      hls_url: cam.hlsUrl,
      hls_expiry: cam.hlsExpiry,
      cam_model_requestparams: '',
      cohort_id: cam.userRoleCohortId || cam.userRoleCohortHash || '',
      userRoleCohortHash: cam.userRoleCohortHash || '',
      user_role_cohort_hash: cam.userRoleCohortHash || '',
      user_id: '',
      is_deleted: false,
      cam_cloud_stream_id: cam.camCloudStreamId,
    };
  }, [selectedCam]);

  const camera = useMemo<CameraType | null>(() => {
    return cameraFromState || mappedSelectedCam || null;
  }, [cameraFromState, mappedSelectedCam]);

  const cameraId = camera?.id;
  const camId = camera ? getCameraId(camera) : 0;

  const [stableHlsUrl, setStableHlsUrl] = useState('');

  const hlsUrl = useMemo(() => {
    if (!camera) return '';
    return constructHlsUrl(camera);
  }, [camera]);

  useEffect(() => {
    if (!hlsUrl) {
      setStableHlsUrl('');
      return;
    }

    const getBaseUrl = (url: string) => url.split('?')[0];
    const newBaseUrl = getBaseUrl(hlsUrl);
    const currentBaseUrl = stableHlsUrl ? getBaseUrl(stableHlsUrl) : '';

    if (!stableHlsUrl || newBaseUrl !== currentBaseUrl) {
      logger.debug('Updating stable HLS URL:', newBaseUrl);
      setStableHlsUrl(hlsUrl);
    } else {
      logger.debug(
        'HLS URL query params changed but keeping stable URL to prevent reload'
      );
    }
  }, [hlsUrl, camId, stableHlsUrl]);
  const effectiveHasStream = !!stableHlsUrl;

  useEffect(() => {
    if (expiryCheckTimeoutRef.current) {
      clearTimeout(expiryCheckTimeoutRef.current);
    }

    if (camera && camera.hls_url && camera.hls_expiry) {
      const expiryTime = new Date(camera.hls_expiry).getTime();
      const currentTime = new Date().getTime();

      if (
        expiryTime < currentTime &&
        !refetchInProgressRef.current &&
        !isRefetchingExpiry
      ) {
        logger.warn('HLS URL expired, triggering immediate refetch...');

        // Immediate refetch if expired (no timeout delay)
        if (!refetchInProgressRef.current && camera?.cam_hash) {
          refetchInProgressRef.current = true;
          setIsRefetchingExpiry(true);

          dispatch(
            fetchCamByHash({
              camHash: camera.cam_hash,
              cohortHash: getCameraCohortHash(camera) || selectedCohortHash,
            })
          )
            .then(() => {
              logger.log('Camera refetched successfully after expiry');
            })
            .catch((error) => {
              logger.error('Error refetching camera:', error);
            })
            .finally(() => {
              refetchInProgressRef.current = false;
              setIsRefetchingExpiry(false);
            });
        }
      } else if (expiryTime > currentTime) {
        // Schedule refetch for when URL will expire
        const timeUntilExpiry = expiryTime - currentTime;
        logger.debug(
          `HLS URL will expire in ${Math.round(timeUntilExpiry / 1000)}s, scheduling refetch...`
        );

        expiryCheckTimeoutRef.current = setTimeout(() => {
          if (!refetchInProgressRef.current && camera?.cam_hash) {
            refetchInProgressRef.current = true;
            setIsRefetchingExpiry(true);

            dispatch(
              fetchCamByHash({
                camHash: camera.cam_hash,
                cohortHash: getCameraCohortHash(camera) || selectedCohortHash,
              })
            )
              .then(() => {
                logger.log('Camera refetched successfully on scheduled expiry');
              })
              .catch((error) => {
                logger.error('Error refetching camera:', error);
              })
              .finally(() => {
                refetchInProgressRef.current = false;
                setIsRefetchingExpiry(false);
              });
          }
        }, timeUntilExpiry + 500); // Refetch 500ms after expiry
      }
    }

    return () => {
      if (expiryCheckTimeoutRef.current) {
        clearTimeout(expiryCheckTimeoutRef.current);
      }
    };
  }, [camera, dispatch, isRefetchingExpiry, selectedCohortHash]);

  useEffect(() => {
    logger.debug('LiveStreamPage render:', {
      cameraId,
      cameraName: camera?.cam_name,
      effectiveHasStream,
      activeTab,
      hlsUrl: stableHlsUrl ? stableHlsUrl.substring(0, 50) + '...' : 'none',
    });
  }, [cameraId, camera?.cam_name, effectiveHasStream, activeTab, stableHlsUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl">
      {/* Header */}
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-x-hidden pl-10 pr-10 pt-0',
          activeTab === 'timeline'
            ? 'overflow-y-auto spectra-scrollbar'
            : 'overflow-hidden'
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            activeTab === 'timeline' ? '' : 'min-h-0 flex-1'
          )}
        >
          <div className="mb-2 h-0 shrink-0" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 h-8 w-fit shrink-0 -ms-2 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleBackToLiveCameras}
          >
            <ArrowLeft className="me-1 h-4 w-4" />
            Back to live cameras
          </Button>

          <div
            className={cn(
              'flex gap-4 motion-safe:transition-[gap,width] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.33,1,0.68,1)]',
              activeTab === 'timeline'
                ? 'flex-col'
                : 'min-h-0 flex-1 flex-row flex-wrap lg:flex-nowrap'
            )}
          >
            {/* Camera + tabs + one persistent LiveStream (layout only changes with tab) */}
            <div
              className={cn(
                'flex flex-col gap-4 motion-safe:transition-[width,flex-basis] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.33,1,0.68,1)]',
                activeTab === 'timeline'
                  ? 'w-full shrink-0 basis-auto'
                  : 'w-full shrink-0 basis-full sm:basis-[40%] sm:min-w-[min(100%,320px)] lg:w-2/5 lg:basis-[40%]'
              )}
            >
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex-1">
                  <CameraSelect
                    camera={camera}
                    allCameras={mappedAllCameras}
                    allCamerasLoading={allCamerasLoading}
                    navigate={navigate}
                    routeCameraName={
                      cameraName ? decodeURIComponent(cameraName) : undefined
                    }
                  />
                </div>
                <TabButtons
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  cameraHash={camera?.cam_hash ?? ''}
                />
              </div>

              <div
                className={cn(
                  'flex w-full shrink-0 overflow-hidden rounded-lg bg-black motion-safe:transition-[height,padding,border-color,background-color] motion-safe:duration-500 motion-safe:ease-out',
                  activeTab === 'timeline'
                    ? 'h-[380px] items-center justify-center border-2 border-border bg-muted/30 px-3 py-3 sm:px-4 sm:py-4'
                    : 'aspect-video max-h-[min(70vh,520px)] min-h-[220px]'
                )}
              >
                {cameraLoading ? (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-900 to-slate-800">
                    <div className="space-y-6 p-8 text-center">
                      <div className="relative">
                        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
                        <Settings2 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-pulse text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-white">
                          Loading Camera
                        </p>
                        <p className="text-sm text-slate-400">
                          Fetching live stream details...
                        </p>
                        <div className="flex justify-center space-x-1 pt-2">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-2 w-2 animate-pulse rounded-full bg-blue-400"
                              style={{
                                animationDelay: `${i * 0.2}s`,
                                animationDuration: '1s',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : effectiveHasStream && camera ? (
                  <div
                    className={cn(
                      'h-full w-full overflow-hidden',
                      activeTab === 'timeline' &&
                        'max-h-full max-w-6xl rounded-lg border border-border/50 bg-black shadow-xl'
                    )}
                  >
                    <LiveStream
                      key={`stream-${camId}`}
                      hlsUrl={stableHlsUrl}
                      camId={camId}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-slate-700 bg-linear-to-br from-slate-900 to-slate-800">
                    <div className="space-y-4 p-8 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-600">
                        <Camera className="h-8 w-8 text-slate-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-slate-400">
                          No Live Stream Available
                        </p>
                        <p className="text-sm text-slate-500">
                          Select a camera with an active stream
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col rounded-xl motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
                activeTab === 'timeline'
                  ? 'w-full border-2 border-border shadow-sm'
                  : 'w-full min-h-0 overflow-hidden lg:flex-1',
                activeTab === 'notifications' &&
                  'border border-gray-300 dark:border-gray-800'
              )}
            >
              {activeTab === 'timeline' ? (
                <FullTimelineView camHash={camera?.cam_hash ?? ''} />
              ) : (
                <>
                  {activeTab === 'chat' && (
                    <ChatInterface
                      camHash={camera?.cam_hash || ''}
                      key={`chat-${camId}`}
                      onOpenConfiguration={() => setIsConfigDialogOpen(true)}
                    />
                  )}
                  {activeTab === 'notifications' && (
                    <NotificationsPanel
                      cameraId={camera?.cam_hash || ''}
                      camera={camera || undefined}
                      key={`notif-${camId}`}
                    />
                  )}
                  {activeTab === 'search' && (
                    <LiveSearchPanel
                      key={`search-${camId}`}
                      camHash={camera?.cam_hash || ''}
                    />
                  )}
                </>
              )}
            </div>
            {activeTab === 'configuration' && (
              <LiveDynamicInsightsDashboard sourceHash={camera?.cam_hash ?? ''} />
            )}
          </div>
        </div>

        <Dialog
          open={isConfigDialogOpen}
          onOpenChange={(open) => setIsConfigDialogOpen(open)}
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                Live Configuration
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Configure processing pipelines for this live camera.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {camera ? (
                <LiveConfiguration
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  camera={camera as any}
                  onModelHashChange={setModelHash}
                  key={`config-dialog-${camId}`}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  Select a camera to configure its processing pipelines.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </Main>
    </div>
  );
};

export default LiveStreamPage;
