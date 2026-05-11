export type IconType = 'radio-tower' | 'file-video';

export interface Notification {
  event_id: string;
  timestamp: string;
  alert: string;
  details: {
    video_id?: string;
    camera_id?: string;
    chunk_id: string;
    description: string;
    presigned_url?: string;
    timeline: {
      start: string;
      end: string;
      duration: string;
    };
  };
  initials: string;
  type: 'live' | 'batch' | undefined;
  icon: string;
  source: 'sse' | 'db';
}

export interface EventData {
  event_id: string;
  created_at: string;
  event_source_llm_alert_text?: string;
  event_source_text_name?: string;
  batch_id?: string;
  batch_chunk_id?: string;
  event_batch_description?: string;
  batch_chunk_video_presigned_url?: string;
  event_batch_start_time?: string;
  event_batch_end_time?: string;
  live_id?: string;
  cam_id?: string;
  live_chunk_id?: string;
  event_live_description?: string;
  live_chunk_video_presigned_url?: string;
  event_live_start_time?: string;
  event_live_end_time?: string;
  total_events?: number;
  id?: number;
}

export interface FetchOptions {
  itemsPerPage: number;
  page: number;
  type?: 'live' | 'batch';
  search?: string;
  videoId?: string | null;
}

export type BatchNotification = Notification;
