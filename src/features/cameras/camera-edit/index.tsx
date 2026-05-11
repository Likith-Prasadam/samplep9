import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Separator } from '@/components/ui/separator';

import { cameraFormSchema, type CameraFormValues } from '../camera-add/schema';
import {
  INITIAL_FORM_DATA,
  type ExistingCamera,
} from '../camera-add/types/types';
import { Step0General } from '../camera-add/components/steps/step-0-general';
import { Step1Location } from '../camera-add/components/steps/step-1-location';

import {
  UPDATE_CAM_MUTATION,
  GET_CAMERAS_QUERY,
} from '@/graphql/cameras_mutation';
import { useCameras } from '@/providers/cameras-provider';
import { getActiveCohortHash } from '@/utils/cohort-utils';
import { fetchCams } from '@/store/slices/camera-slice';
import type { AppDispatch } from '@/store';

const parseTags = (raw?: string | null): string[] =>
  (raw || '')
    .split(',')
    .map((tag) => tag.trim().slice(0, 15))
    .filter(Boolean)
    .slice(0, 10);

type EditCameraLocationState = {
  camera?: {
    cam_hash?: string;
    camHash?: string;
  };
  cohortHash?: string;
  source?: 'live-landing';
};

const EditCameraPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setOpen } = useCameras();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [existingCameras, setExistingCameras] = useState<ExistingCamera[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const locationState = location.state as EditCameraLocationState | undefined;
  const cohortFromQuery = searchParams.get('cohort') || '';
  const cohortHash =
    cohortFromQuery || locationState?.cohortHash || getActiveCohortHash() || '';
  const isFromLiveLanding = locationState?.source === 'live-landing';
  const normalizedCohortHash = cohortHash.trim();
  const camerasPath = normalizedCohortHash
    ? `/cameras?cohort=${encodeURIComponent(normalizedCohortHash)}`
    : '/cameras';
  const livePath = normalizedCohortHash
    ? `/live?cohort=${encodeURIComponent(normalizedCohortHash)}`
    : '/live';
  const returnPath = isFromLiveLanding ? livePath : camerasPath;

  const methods = useForm<CameraFormValues>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: INITIAL_FORM_DATA,
    mode: 'onChange',
  });

  const [updateCamera] = useMutation(UPDATE_CAM_MUTATION, {
    onCompleted: async (data) => {
      if (data?.updateCam) {
        await dispatch(
          fetchCams({
            cohortHash: normalizedCohortHash || undefined,
            page: 1,
            itemsPerPage: 1000,
          })
        );
        toast.success('Camera updated successfully');
        setOpen(null);
        navigate(returnPath);
      } else {
        const errorMsg = 'No data returned from server';
        toast.error(errorMsg);
        setGeneralError(errorMsg);
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('GraphQL Error:', error);
      let errorMessage = 'Failed to update camera';
      if (error.networkError) {
        errorMessage = `Network error: ${error.networkError?.message}`;
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors.map((e) => e.message).join(', ');
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setGeneralError(errorMessage);
      setIsLoading(false);
    },
  });

  const { data: camerasData } = useQuery(GET_CAMERAS_QUERY, {
    variables: {
      input_json: {
        items_per_page: 1000,
        page_number: 1,
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    const camerasResult = camerasData?.cams?.fetch_data_by_filters_cams;
    if (camerasResult?.cams && Array.isArray(camerasResult.cams)) {
      setExistingCameras(camerasResult.cams);
    }
  }, [camerasData]);

  useEffect(() => {
    const loadedCamera = location.state?.camera;
    if (loadedCamera) {
      methods.reset({
        ...INITIAL_FORM_DATA,
        cam_id: loadedCamera.id || loadedCamera.cam_id || 0,
        cam_name: loadedCamera.cam_name || '',
        cam_latitude: loadedCamera.cam_latitude?.toString() || '',
        cam_longitude: loadedCamera.cam_longitude?.toString() || '',
        cam_placement_zone: loadedCamera.cam_placement_zone || '',
        cam_placement_subzone: loadedCamera.cam_placement_subzone || '',
        cam_placement_zone_slot: loadedCamera.cam_placement_zone_slot || '',
        cam_cloud_stream_id: loadedCamera.cam_cloud_stream_id || '',
        cam_ip: loadedCamera.cam_ip || '',
        cam_type: loadedCamera.cam_type || '',
        cam_resolution: loadedCamera.cam_resolution || '',
        cam_address1: loadedCamera.cam_address1 || '',
        cam_city: loadedCamera.cam_city || '',
        cam_zipcode: loadedCamera.cam_zipcode || '',
        cam_hash: loadedCamera.cam_hash || loadedCamera.camHash || '',
        cam_fps_source_rate: loadedCamera.camFpsSourceRate || '30',
        cam_thumbnail_path: loadedCamera.camThumbnailPath || '',
        cam_status: loadedCamera.cam_status || 'active',
        cam_tags: Array.isArray(
          (loadedCamera as { cam_tags?: unknown }).cam_tags
        )
          ? ((loadedCamera as { cam_tags?: string[] }).cam_tags || []).join(
              ', '
            )
          : Array.isArray((loadedCamera as { camTags?: unknown }).camTags)
            ? ((loadedCamera as { camTags?: string[] }).camTags || []).join(
                ', '
              )
            : (loadedCamera as { cam_tags?: string }).cam_tags ||
              (loadedCamera as { camTags?: string }).camTags ||
              '',
      });
      setIsInitialLoading(false);
    } else {
      navigate(returnPath, { replace: true });
    }
  }, [location.state?.camera, navigate, methods, returnPath]);

  const onSubmit = async (formData: CameraFormValues) => {
    // Custom duplicate name validation
    const duplicate = existingCameras.find(
      (cam) =>
        cam.cam_name.toLowerCase() === formData.cam_name.toLowerCase() &&
        cam.cam_id !== formData.cam_id
    );
    if (duplicate) {
      methods.setError('cam_name', {
        message: 'A camera with this name already exists',
      });
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      const normalizedCamHash = formData.cam_hash?.trim() || '';

      if (!normalizedCamHash) {
        throw new Error('Camera hash is required for update');
      }

      const input = {
        // include cohortHash (backend expects camelCase)
        ...(normalizedCohortHash ? { cohortHash: normalizedCohortHash } : {}),
        camHash: normalizedCamHash,
        camAddress1: formData.cam_address1?.trim() || '',
        camCity: formData.cam_city?.trim() || '',
        camCloudStreamId: formData.cam_cloud_stream_id.trim(),
        camIp: formData.cam_ip?.trim() || '',
        camLatitude: formData.cam_latitude.trim(),
        camLongitude: formData.cam_longitude.trim(),
        camName: formData.cam_name.trim(),
        camPlacementSubzone: formData.cam_placement_subzone?.trim() || '',
        camPlacementZone: formData.cam_placement_zone?.trim() || '',
        camPlacementZoneSlot: formData.cam_placement_zone_slot?.trim() || '',
        camResolution: formData.cam_resolution || '',
        camFpsSourceRate: formData.cam_fps_source_rate,
        camThumbnailPath: formData.cam_thumbnail_path?.trim() || '',
        camStatus: formData.cam_status,
        camType: formData.cam_type || '',
        camZipcode: formData.cam_zipcode?.trim() || '',
        camTags: parseTags(formData.cam_tags),
        processConfigs: {
          orgProcessHash: '',
          processConfig: JSON.stringify({}),
          isEnabled: true,
        },
      };

      // Log payload for debugging server input issues
      console.log('update camera payload', { input });

      if (!normalizedCohortHash) {
        toast.error('Cohort is required to update a camera');
        setIsLoading(false);
        return;
      }

      await updateCamera({
        variables: { input },
      });
    } catch (error: unknown) {
      console.error('Submit Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update camera';
      setGeneralError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(null);
    navigate(returnPath);
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading camera details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl h-full">
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
        fixed
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl w-full mx-auto h-full min-h-0 flex flex-col text-left">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="self-start mb-6 flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cameras
          </Button>

          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Edit Camera
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Update the details for this camera.
            </p>
          </div>

          <Separator className="mb-6" />

          <div className="spectra-scrollbar flex-1 min-h-0 overflow-y-auto pb-6">
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit)}
                className="space-y-6 max-w-4xl w-full mx-auto"
              >
                {generalError && (
                  <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {generalError}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <Step0General />
                  <Step1Location />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    {isLoading ? 'Updating...' : 'Update Camera'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      </Main>
    </div>
  );
};

export default EditCameraPage;
