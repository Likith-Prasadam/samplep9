import { getUserSession } from '@/lib/ssemanager';

const TIMELINE_WINDOW_URL = import.meta.env
  .VITE_TIMELINE_WINDOW_API_URL as string;

const getAuthToken = (): string | null => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) return accessToken;

    const token = localStorage.getItem('token');
    if (token) return token;

    const session = getUserSession();
    if (session.token) return session.token;

    return null;
  } catch {
    return null;
  }
};

export interface WindowEvent {
  event_hash: string;
  event_title: string;
  event_type: string;
  detected_at: string;
  confidence_score: number | null;
  chunk_hash: string;
  chunk_presigned_url?: string | null;
}

export interface TimelineWindowResponse {
  events: WindowEvent[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface FetchWindowParams {
  cam_hash: string;
  from_utc: string;
  to_utc: string;
  cursor?: string | null;
  limit?: number;
}

export async function fetchTimelineWindow(
  params: FetchWindowParams
): Promise<TimelineWindowResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const url = new URL(TIMELINE_WINDOW_URL);
  url.searchParams.set('cam_hash', params.cam_hash);
  url.searchParams.set('from_utc', params.from_utc);
  url.searchParams.set('to_utc', params.to_utc);
  if (params.cursor) url.searchParams.set('cursor', params.cursor);
  if (params.limit !== undefined)
    url.searchParams.set('limit', String(params.limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch timeline window: ${response.status}`);
  }

  return response.json() as Promise<TimelineWindowResponse>;
}
