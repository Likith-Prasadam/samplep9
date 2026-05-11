import { gql } from '@apollo/client';
export const DELETE_CAMERA_MUTATION = gql`
  mutation SoftDeleteCam($input: DeleteCamInput!) {
    deleteCam(input: $input)
  }
`;

export const GET_CAMERA_BY_NAME = gql`
  query GetCameras($input_json: CamsInput!) {
    cams {
      fetch_data_by_filters_cams(input_json: $input_json) {
        metadata
        cams {
          cam_hash
          cam_name
          cam_latitude
          cam_longitude
          cam_status
          cam_placement_zone
          cam_placement_subzone
          cam_placement_zone_slot
          cam_ip
          cam_type
          cam_resolution
          cam_address1
          cam_city
          cam_zipcode
          created_at
          updated_at
          hls_url
          hls_expiry
          cam_model_requestparams
          cohort_id
          user_id
          id
          is_deleted
          cam_cloud_stream_id
          cam_tags
        }
      }
    }
  }
`;

export const GET_CAMERAS_QUERY = gql`
  query GetCameras($input_json: CamsInput!) {
    cams {
      fetch_data_by_filters_cams(input_json: $input_json) {
        metadata
        cams {
          cam_hash
          cam_name
          cam_latitude
          cam_longitude
          cam_status
          cam_placement_zone
          cam_placement_subzone
          cam_placement_zone_slot
          cam_ip
          cam_type
          cam_resolution
          cam_address1
          cam_city
          cam_zipcode
          created_at
          updated_at
          hls_url
          hls_expiry
          cam_model_requestparams
          cohort_id
          user_id
          id
          is_deleted
          cam_cloud_stream_id
          cam_tags
        }
      }
    }
  }
`;

export const CREATE_CAMERA_MUTATION = gql`
  mutation CreateCamera($input: CamsCreateInput!) {
    createCam(input: $input) {
      camAddress1
      camCity
      camCloudStreamId
      camFpsSourceRate
      camHash
      camIp
      camLatitude
      camLongitude
      camName
      camPlacementSubzone
      camPlacementZone
      camPlacementZoneSlot
      camResolution
      camThumbnailPath
      camType
      camTags
      camZipcode
    }
  }
`;

export const UPDATE_CAM_MUTATION = gql`
  mutation UpdateCam($input: CamsUpdateInput!) {
    updateCam(input: $input) {
      camAddress1
      camCity
      camCloudStreamId
      camFpsSourceRate
      camHash
      camIp
      camLatitude
      camLongitude
      camName
      camPlacementSubzone
      camPlacementZone
      camPlacementZoneSlot
      camResolution
      camThumbnailPath
      camType
      camTags
      camZipcode
    }
  }
`;

export const GET_CAM_FILTER_VALUES = gql`
  query GetCamFilterValues($cohortHash: String!) {
    getCamFilterValues(cohortHash: $cohortHash) {
      camResolutions
      camTypes
      camTags
      camCities
      camZipcodes
      camPlacementZones
    }
  }
`;

export interface CamFilterValues {
  camResolutions: string[];
  camTypes: string[];
  camTags: string[];
  camCities: string[];
  camZipcodes: string[];
  camPlacementZones: string[];
}

export interface GetCamFilterValuesResponse {
  getCamFilterValues: CamFilterValues;
}

export interface GetCamFilterValuesVariables {
  cohortHash: string;
}
