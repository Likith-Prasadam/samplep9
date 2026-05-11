import type {
  CameraFormData,
  FormErrors,
  ExistingCamera,
} from '../features/cameras/camera-add/types/types';

export const validateLatitude = (value: string): string | null => {
  if (!value.trim()) return 'Latitude is required';
  const num = Number(value);
  if (isNaN(num) || num < -90 || num > 90) {
    return 'Enter valid latitude (-90 to 90)';
  }
  return null;
};

export const validateLongitude = (value: string): string | null => {
  if (!value.trim()) return 'Longitude is required';
  const num = Number(value);
  if (isNaN(num) || num < -180 || num > 180) {
    return 'Enter valid longitude (-180 to 180)';
  }
  return null;
};

export const validateIP = (value: string): string | null => {
  if (!value.trim()) return 'IP address is required';

  const trimmedValue = value.trim();

  // IPv4 pattern: 0-255.0-255.0-255.0-255
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 pattern (simplified, covers most common cases)
  // Matches full IPv6 and compressed IPv6 addresses
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::1|::)$/;

  if (ipv4Regex.test(trimmedValue) || ipv6Regex.test(trimmedValue)) {
    return null;
  }

  return 'Enter a valid IP address ';
};

export const validateZipcode = (value: string): string | null => {
  if (!value.trim()) return null;
  return /^\d{5,6}$/.test(value.trim())
    ? null
    : 'Enter valid zipcode (5-6 digits)';
};

export const validateForm = (
  formData: CameraFormData,
  existingCameras: ExistingCamera[],
  currentCameraId?: number
): FormErrors => {
  const errors: FormErrors = {};

  // Validate camera name
  if (!formData.cam_name.trim()) {
    errors.cam_name = 'Camera name is required';
  } else {
    const duplicateName = existingCameras.find(
      (cam) =>
        cam.cam_name.toLowerCase() === formData.cam_name.toLowerCase() &&
        (!currentCameraId || cam.cam_id !== currentCameraId)
    );
    if (duplicateName) {
      errors.cam_name = 'Camera name already exists';
    }
  }

  const latError = validateLatitude(formData.cam_latitude);
  if (latError) errors.cam_latitude = latError;

  const lngError = validateLongitude(formData.cam_longitude);
  if (lngError) errors.cam_longitude = lngError;

  if (!formData.cam_placement_zone.trim()) {
    errors.cam_placement_zone = 'Placement zone is required';
  }

  // Validate cloud stream ID
  if (!formData.cam_cloud_stream_id.trim()) {
    errors.cam_cloud_stream_id = 'Cloud stream ID is required';
  } else {
    const duplicateStreamId = existingCameras.find(
      (cam) =>
        cam.cam_cloud_stream_id.toLowerCase() ===
          formData.cam_cloud_stream_id.toLowerCase() &&
        (!currentCameraId || cam.cam_id !== currentCameraId)
    );
    if (duplicateStreamId) {
      errors.cam_cloud_stream_id = 'Cloud stream ID already exists';
    }
  }

  // Validate IP address
  const ipError = validateIP(formData.cam_ip);
  if (ipError) {
    errors.cam_ip = ipError;
  } else if (formData.cam_ip.trim()) {
    const duplicateIp = existingCameras.find(
      (cam) =>
        cam.cam_ip &&
        cam.cam_ip.toLowerCase() === formData.cam_ip.toLowerCase() &&
        (!currentCameraId || cam.cam_id !== currentCameraId)
    );
    if (duplicateIp) {
      errors.cam_ip = 'IP address already exists';
    }
  }

  // Validate camera type (now required)
  if (!formData.cam_type || !formData.cam_type.trim()) {
    errors.cam_type = 'Camera type is required';
  }

  // Validate resolution (now required)
  if (!formData.cam_resolution || !formData.cam_resolution.trim()) {
    errors.cam_resolution = 'Resolution is required';
  }

  const zipcodeError = validateZipcode(formData.cam_zipcode);
  if (zipcodeError) errors.cam_zipcode = zipcodeError;

  return errors;
};
