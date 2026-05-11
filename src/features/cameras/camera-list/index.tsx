import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { CameraTable } from '@/features/cameras/camera-list/components/camera-table';
import { CameraPrimaryButtons } from './components/camera-primary-buttons';
import { CameraProvider } from '@/providers/cameras-provider';
import {
  fetchCams,
  selectCams,
  selectLoading,
  selectCurrentPage,
  selectTotalCount,
} from '@/store/slices/camera-slice';
import type { AppDispatch, RootState } from '@/store';
import { usePermissions } from '@/hooks/use-permissions';

import type { Camera } from './types/cameras';
import type { PaginationState, Updater } from '@tanstack/react-table';

const EXCLUDED_CAMERA = 'Test-Demo Camera';

const CamerasContent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const cohortFromQuery = searchParams.get('cohort')?.trim();
  const cohortHash = cohortFromQuery || undefined;
  const cohortQueryString = cohortFromQuery
    ? `?cohort=${encodeURIComponent(cohortFromQuery)}`
    : '';

  const cameras = useSelector((state: RootState) => selectCams(state));
  const loading = useSelector((state: RootState) => selectLoading(state));
  const currentPage = useSelector((state: RootState) =>
    selectCurrentPage(state)
  );
  const totalCount = useSelector((state: RootState) => selectTotalCount(state));

  const perms = usePermissions();
  const canManage = cohortFromQuery
    ? perms.canManageCameras(cohortFromQuery)
    : perms.isRootAdmin;
  const canCreate = cohortFromQuery
    ? perms.canCreateCamera(cohortFromQuery)
    : false;

  useEffect(() => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Initial fetch
    dispatch(fetchCams({ cohortHash, page: 1, itemsPerPage: 10 }));
  }, [navigate, dispatch, cohortHash]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Sync pagination with Redux state
  useEffect(() => {
    if (currentPage > 0) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: currentPage - 1,
      }));
    }
  }, [currentPage]);

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const newPagination =
      typeof updater === 'function' ? updater(pagination) : updater;
    setPagination(newPagination);

    // Fetch cameras with new pagination
    dispatch(
      fetchCams({
        cohortHash,
        page: newPagination.pageIndex + 1,
        itemsPerPage: newPagination.pageSize,
      })
    );
  };

  const rawCameras = useMemo(() => {
    if (!Array.isArray(cameras)) return [];

    // Map GraphQL response fields to component-expected fields
    // Since the API doesn't return an 'id' field, we use camHash as the unique identifier
    return cameras
      .map((c) => {
        const mapped: Record<string, unknown> = {
          // New camelCase fields from GraphQL
          camId: c.camHash, // Use camHash as the ID since there's no numeric ID from API
          camHash: c.camHash,
          camName: c.camName,
          camStatus: c.camStatus,
          camResolution: c.camResolution,
          camType: c.camType,
          camPlacementZone: c.camPlacementZone,
          camCloudStreamId: c.camCloudStreamId,
          camZipcode: c.camZipcode,
          camPlacementZoneSlot: c.camPlacementZoneSlot,
          camLongitude: c.camLongitude,
          camLatitude: c.camLatitude,
          camIp: c.camIp,
          camCity: c.camCity,
          camAddress1: c.camAddress1,
          camPlacementSubzone: c.camPlacementSubzone,
          hlsExpiry: c.hlsExpiry,
          hlsUrl: c.hlsUrl,
          createdAt: c.createdAt,
          userRoleCohortHash: c.userRoleCohortHash,
          camFpsSourceRate: c.camFpsSourceRate,
          camThumbnailPath: c.camThumbnailPath,
          camTags: c.camTags,

          id: c.camHash,
          cam_id: c.camHash,
          cam_name: c.camName,
          cam_status: c.camStatus,
          cam_resolution: c.camResolution,
          cam_type: c.camType,
          cam_placement_zone: c.camPlacementZone,
          cam_cloud_stream_id: c.camCloudStreamId,
          cam_zipcode: c.camZipcode,
          cam_placement_zone_slot: c.camPlacementZoneSlot,
          cam_longitude: parseFloat(c.camLongitude || '0'),
          cam_latitude: parseFloat(c.camLatitude || '0'),
          cam_ip: c.camIp,
          cam_city: c.camCity,
          cam_address1: c.camAddress1,
          cam_placement_subzone: c.camPlacementSubzone,
          hls_expiry: c.hlsExpiry,
          hls_url: c.hlsUrl,
          cam_hash: c.camHash,
          cam_thumbnail_path: c.camThumbnailPath,
          user_role_cohort_hash: c.userRoleCohortHash,
          cam_tags: c.camTags,
        };
        return mapped;
      })
      .filter((c) => c && c.cam_name !== EXCLUDED_CAMERA);
  }, [cameras]);

  const handleAddCamera = () => {
    navigate(`/cameras/add${cohortQueryString}`);
  };

  const handleDeleteCamera = (camera: Camera) => {
    // TODO: Implement delete logic
    console.log('Delete camera:', camera);
  };

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25 scroll-smooth">
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Live</h2>
            <p className="text-muted-foreground">
              AI-Powered Live Stream Analysis and Chat
            </p>
          </div>
          <CameraPrimaryButtons onAdd={handleAddCamera} canManage={canCreate} />
        </div>

        <div className="h-full flex flex-col overflow-hidden">
          <CameraTable
            cameras={rawCameras}
            searchTerm=""
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            loading={loading}
            error={undefined}
            onDeleteCamera={handleDeleteCamera}
            totalCount={totalCount}
            canManage={canManage}
          />
        </div>
      </Main>
    </div>
  );
};
const CameraListPage = () => {
  return (
    <CameraProvider>
      <CamerasContent />
    </CameraProvider>
  );
};

export default CameraListPage;
