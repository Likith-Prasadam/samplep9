import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCams,
  fetchCamByHash,
  selectCams,
  selectSelectedCam,
  selectLoading,
  selectCameraLoading,
  selectCamerasError,
} from '@/store/slices/camera-slice';
import type { AppDispatch, RootState } from '@/store';

/**
 * Example: Fetch and display cameras list
 */
export function CameraListExample() {
  const dispatch = useDispatch<AppDispatch>();
  const cameras = useSelector((state: RootState) => selectCams(state));
  const loading = useSelector((state: RootState) => selectLoading(state));
  const error = useSelector((state: RootState) => selectCamerasError(state));

  useEffect(() => {
    // Fetch cameras on component mount
    dispatch(fetchCams({ page: 1, itemsPerPage: 10 }));
  }, [dispatch]);

  if (loading) return <div>Loading cameras...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Cameras ({cameras.length})</h2>
      {cameras.map((cam) => (
        <div key={cam.camHash}>
          <h3>{cam.camName}</h3>
          <p>Status: {cam.camStatus}</p>
          <p>Type: {cam.camType}</p>
          <p>Resolution: {cam.camResolution}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Fetch single camera by hash
 */
export function CameraDetailExample({ camHash }: { camHash: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const camera = useSelector((state: RootState) => selectSelectedCam(state));
  const loading = useSelector((state: RootState) => selectCameraLoading(state));

  useEffect(() => {
    if (camHash) {
      dispatch(fetchCamByHash(camHash));
    }
  }, [camHash, dispatch]);

  if (loading) return <div>Loading camera details...</div>;
  if (!camera) return <div>Camera not found</div>;

  return (
    <div>
      <h2>{camera.camName}</h2>
      <p>Hash: {camera.camHash}</p>
      <p>Status: {camera.camStatus}</p>
      <p>IP: {camera.camIp}</p>
      <p>Type: {camera.camType}</p>
      <p>Resolution: {camera.camResolution}</p>
      <p>Zone: {camera.camPlacementZone}</p>
      <p>
        Location: {camera.camAddress1}, {camera.camCity} {camera.camZipcode}
      </p>
      <p>
        Coordinates: {camera.camLatitude}, {camera.camLongitude}
      </p>
      {camera.hlsUrl && <p>HLS URL: {camera.hlsUrl}</p>}
    </div>
  );
}
