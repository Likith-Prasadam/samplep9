export interface Camera {
  id?: number;
  cam_name: string;
  cam_cloud_stream_id?: string;
  cam_placement_zone?: string;
  cam_ip?: string;
  cam_status?: string;
  cam_latitude?: number;
  cam_longitude?: number;
  hls_url?: string;
  hls_expiry?: string;
  cam_type?: string;
  cam_resolution?: string;
  cam_address1?: string;
  cam_city?: string;
  cam_zipcode?: string;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  cam_hash?: string;
  cam_placement_subzone?: string;
  cam_placement_zone_slot?: string;
  cam_model_requestparams?: string;
  cohort_id?: number;
  user_id?: number;
  cam_tags?: string[];
}

export interface CameraQueryData {
  cams?: {
    fetch_data_by_filters_cams?: {
      metadata?: Record<string, unknown>;
      cams?: Camera[];
    };
  };
}

export interface CameraQueryVars {
  input_json: { cam_name: string };
}

export interface CameraFormData {
  cam_hash?: string;
  cam_name?: string;
  cam_latitude?: string;
  cam_longitude?: string;
  cam_placement_zone?: string;
  cam_placement_subzone?: string;
  cam_placement_zone_slot?: string;
  cam_cloud_stream_id?: string;
  cam_ip?: string;
  cam_type?: string;
  cam_resolution?: string;
  cam_address1?: string;
  cam_city?: string;
  cam_zipcode?: string;
}

export interface EditCameraFormData extends CameraFormData {
  id: number;
}
