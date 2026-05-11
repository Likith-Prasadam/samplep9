export interface CameraFormData {
  cam_hash: string;
  cam_id?: number;
  cam_name: string;
  cam_latitude: string;
  cam_longitude: string;
  cam_placement_zone: string;
  cam_placement_subzone: string;
  cam_placement_zone_slot: string;
  cam_cloud_stream_id: string;
  cam_ip: string;
  cam_type: string;
  cam_resolution: string;
  cam_address1: string;
  cam_city: string;
  cam_zipcode: string;
  cam_fps_source_rate: string;
  cam_thumbnail_path: string;
  cam_status: string;
  cam_tags?: string;
}

export interface ExistingCamera {
  cam_id?: number;
  cam_name: string;
  cam_cloud_stream_id: string;
  cam_ip?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export const CAMERA_TYPES = [
  { value: 'dome', label: 'Dome Camera' },
  { value: 'bullet', label: 'Bullet Camera' },
  { value: 'ptz', label: 'PTZ Camera' },
  { value: 'ip', label: 'IP Camera' },
  { value: 'wireless', label: 'Wireless Camera' },
  { value: 'thermal', label: 'Thermal Camera' },
  { value: 'other', label: 'Other' },
] as const;

export const CAMERA_RESOLUTIONS = [
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '1440p', label: '1440p (2K)' },
  { value: '2160p', label: '2160p (4K)' },
  { value: 'other', label: 'Other' },
] as const;

export const INITIAL_FORM_DATA: CameraFormData = {
  cam_hash: '',
  cam_name: '',
  cam_latitude: '',
  cam_longitude: '',
  cam_placement_zone: '',
  cam_placement_subzone: '',
  cam_placement_zone_slot: '',
  cam_cloud_stream_id: '',
  cam_ip: '',
  cam_type: '',
  cam_resolution: '',
  cam_address1: '',
  cam_city: '',
  cam_zipcode: '',
  cam_fps_source_rate: '30',
  cam_thumbnail_path: '',
  cam_status: 'active',
  cam_tags: '',
};
