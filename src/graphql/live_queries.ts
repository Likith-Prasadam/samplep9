import { gql } from '@apollo/client';

export const GET_LIVE_CAM_VIDEOS = gql`
  query MyQuery($camId: Int!, $itemsPerPage: Int!, $pageNumber: Int!) {
    live_cam_videos {
      fetch_all_live_cam_video_urls(
        cam_id: $camId
        items_per_page: $itemsPerPage
        page_number: $pageNumber
      ) {
        metadata
        live_cam_videos {
          id
          cam_hash
          live_video_name
          presigned_url
          total_video_time
        }
      }
    }
  }
`;

export const GET_LIVE_TRANSCRIPT = gql`
  query GetLiveTranscript($cam_id: Int!, $time: Float!) {
    live_chat {
      get_live_system_prompt(cam_id: $cam_id, time: $time) {
        content
      }
    }
  }
`;

export const FETCH_EVENTS_QUERY = gql`
  query MyQuery($camId: Int!, $itemsPerPage: Int!, $pageNumber: Int!) {
    events_lists {
      fetch_events_live_by_cam_id(
        cam_id: $camId
        items_per_page: $itemsPerPage
        page_number: $pageNumber
      ) {
        event_id
        event_live_description
        event_live_start_time
        event_live_end_time
        live_chunk_id
        live_chunk_video_presigned_url
      }
    }
  }
`;

export const UPDATE_ALL_LIVE_EVENTS_READ_STATUS = gql`
  mutation UpdateAllLiveEventsReadStatus($readStatus: Boolean!) {
    updateAllLiveEventsReadStatus(readStatus: $readStatus)
  }
`;
