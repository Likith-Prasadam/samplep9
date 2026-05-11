export interface Camera {
  cam_longitude?: number;
  cam_latitude?: number;
  camLongitude?: string;
  camLatitude?: string;
  id?: number | string;
  cam_name?: string;
  camName?: string;
  cam_status?: 'active' | 'inactive' | '1' | '0';
  camStatus?: string;
  hls_url?: string;
  hls_expiry?: string;
  hlsUrl?: string;
  cam_id?: number | string;
  camId?: number;
  cam_hash?: string;
  camHash?: string;
  cam_placement_zone?: string;
  camPlacementZone?: string;
  cam_placement_subzone?: string;
  camPlacementSubzone?: string;
  cam_placement_zone_slot?: string;
  camPlacementZoneSlot?: string;
  cam_cloud_stream_id?: string;
  camCloudStreamId?: string;
  cam_ip?: string;
  camIp?: string;
  cam_type?: string;
  camType?: string;
  cam_resolution?: string;
  camResolution?: string;
  cam_address1?: string;
  camAddress1?: string;
  cam_city?: string;
  camCity?: string;
  cam_zipcode?: string;
  camZipcode?: string;
  cam_thumbnail_path?: string;
  camThumbnailPath?: string;
  userRoleCohortHash?: string;
  user_role_cohort_hash?: string;
  cam_tags?: string[];
  camTags?: string[];
}

export interface CamsInput {
  items_per_page: number;
  page_number: number;
}

export interface SnackbarState {
  message: string;
  isOpen: boolean;
  variant?: 'success' | 'error';
}
