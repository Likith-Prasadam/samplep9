import { gql } from '@apollo/client';

// Demo videos for a given use case/type
export const GET_DEMO_VIDEOS = gql`
  query GetDemoVideos($type: String!) {
    demo {
      demoVideos(type: $type) {
        createdAt
        duration
        eventDescription
        eventEndTime
        eventName
        eventStartTime
        eventType
        id
        presignedUrl
        process
        thumbnail
        transcriptPath
        type
        videoDescription
        videoName
        videoSourcePath
      }
    }
  }
`;

export const PROCESS_DEMO_VIDEO = gql`
  mutation ProcessDemoVideo($demoId: Int!) {
    demo {
      processDemoVideo(demoId: $demoId) {
        id
        transcript
      }
    }
  }
`;

// Paginated demo events
export const FETCH_DEMO_EVENTS = gql`
  query FetchDemoEvents($itemsPerPage: Int!, $pageNumber: Int!) {
    demo {
      fetchDemoEvents(itemsPerPage: $itemsPerPage, pageNumber: $pageNumber) {
        events {
          createdAt
          demoId
          eventDescription
          eventEndTime
          eventName
          eventStartTime
          id
          isDeleted
        }
        metadata
      }
    }
  }
`;

// Transcript for a demo video
export const GET_DEMO_TRANSCRIPT = gql`
  query GetDemoTranscript($videoId: Int!) {
    demo {
      demoTranscript(videoId: $videoId) {
        id
        presignedUrl
        transcript
      }
    }
  }
`;

// System prompt for a demo video (not yet wired into UI)
export const GET_DEMO_SYSTEM_PROMPT = gql`
  query GetDemoSystemPrompt($id: Int!) {
    demo {
      getSystemPromptsDemo(id: $id) {
        id
        presignedUrl
        transcript
      }
    }
  }
`;
