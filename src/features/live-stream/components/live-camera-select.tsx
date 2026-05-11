import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CameraSelectProps {
  camera: Camera | null;
  allCameras: Camera[];
  allCamerasLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
  /** Camera name from URL (hard refresh) so the trigger shows a label before Redux selectedCam hydrates */
  routeCameraName?: string;
}

const isCameraActive = (camera: Camera): boolean => {
  if (!camera.hls_url) {
    return false;
  }
  if (camera.hls_expiry && new Date(camera.hls_expiry) < new Date()) {
    return false;
  }
  return true;
};

const CameraSelect: React.FC<CameraSelectProps> = ({
  camera,
  allCameras,
  allCamerasLoading,
  navigate,
  routeCameraName,
}) => {
  const location = useLocation();
  const cameraDetailBasePath = location.pathname.startsWith('/live')
    ? '/live'
    : '/cameras';

  const selectValue = useMemo(() => {
    if (camera?.cam_name?.trim()) {
      return camera.cam_name;
    }
    if (!routeCameraName?.trim() || allCameras.length === 0) {
      return '';
    }
    const target = routeCameraName.trim().toLowerCase();
    const match = allCameras.find(
      (cam) => cam.cam_name?.trim().toLowerCase() === target
    );
    return match?.cam_name?.trim() || '';
  }, [camera?.cam_name, routeCameraName, allCameras]);

  return (
    <div className="bg-muted rounded-lg p-2">
      <Select
        value={selectValue}
        onValueChange={(selectedCameraName: string) => {
          const currentCameraName = camera?.cam_name;

          if (!selectedCameraName || selectedCameraName === currentCameraName) {
            return;
          }

          const selectedCamera = allCameras.find(
            (cam) => cam.cam_name === selectedCameraName
          );
          if (selectedCamera) {
            const routeCohortHash =
              new URLSearchParams(location.search).get('cohort') || '';
            const cohortHash =
              routeCohortHash ||
              selectedCamera.user_role_cohort_hash ||
              selectedCamera.userRoleCohortHash ||
              '';
            const nextUrl = cohortHash
              ? `${cameraDetailBasePath}/${encodeURIComponent(selectedCameraName)}?cohort=${encodeURIComponent(cohortHash)}`
              : `${cameraDetailBasePath}/${encodeURIComponent(selectedCameraName)}`;

            navigate(nextUrl, {
              replace: true,
              state: { camera: selectedCamera, cohortHash },
            });
          }
        }}
        disabled={allCamerasLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              allCamerasLoading
                ? 'Loading cameras...'
                : allCameras.length === 0
                  ? 'No cameras available'
                  : 'Select a camera'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {allCameras.length === 0
            ? null
            : allCameras
                .filter((cam) => cam.cam_name && cam.cam_name.trim() !== '')
                .map((cam) => {
                  const active = isCameraActive(cam);
                  // Use a unique, reliable key: prefer camHash, then cam_id
                  const uniqueKey = cam.cam_hash || `cam-${cam.id}`;
                  return (
                    <SelectItem key={uniqueKey} value={cam.cam_name!}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            active ? 'bg-green-500' : 'bg-destructive'
                          }`}
                        ></span>
                        <span>{cam.cam_name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CameraSelect;
