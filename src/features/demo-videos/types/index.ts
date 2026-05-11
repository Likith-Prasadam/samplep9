export interface DemoVideo {
  duration: string;
  id: number;
  presigned_url: string;
  thumbnail: string | null;
  transcript_path: string;
  video_description: string;
  video_name: string;
  event_end_time: string | number | null;
  event_start_time: string | number | null;
  process?: string;
  created_at?: string;
  event_description?: string;
}

export interface Event {
  id: number;
  demo_id: number;
  event_description: string;
  event_end_time: string;
  event_name: string;
  event_start_time: string;
  created_at: string;
  is_deleted: boolean;
}

import type { VizPayload } from '@/types/viz';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: {
    text: string;
  }[];
  timestamp?: string;
  viz?: VizPayload;
}

export interface UseCase {
  name: string;
  slug: string;
  content: string;
  icon: React.ReactElement;
  image: string;
}

export interface TranscriptSegment {
  timestamp: string;
  content: string;
  isIncident: boolean;
}

export interface TranscriptEvent {
  type: string;
  start_time: string;
  end_time: string;
  description: string;
}

export interface TranscriptData {
  videoTranscript: {
    results: string;
    events?: TranscriptEvent[];
  };
}
