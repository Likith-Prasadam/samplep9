import { getUserSession } from '@/lib/ssemanager';

const TIMELINE_RANGE_URL = import.meta.env
  .VITE_TIMELINE_TIMELINE_RANGE_API_URL as string;

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

export type RangeGranularity = '5min' | '1hour' | '1day';

export interface EventTypeCount {
  event_type: string;
  event_count: number;
}

export interface RangeBucket {
  bucket_start: string;
  bucket_end: string;
  total_event_count: number;
  event_type_counts: EventTypeCount[];
}

export interface TimelineRangeResponse {
  buckets: RangeBucket[];
}

export interface FetchRangeParams {
  cam_hash: string;
  from_utc: string;
  to_utc: string;
  granularity: RangeGranularity;
}

export async function fetchTimelineRange(
  params: FetchRangeParams
): Promise<TimelineRangeResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const url = new URL(TIMELINE_RANGE_URL);
  url.searchParams.set('cam_hash', params.cam_hash);
  url.searchParams.set('from_utc', params.from_utc);
  url.searchParams.set('to_utc', params.to_utc);
  url.searchParams.set('granularity', params.granularity);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch timeline range: ${response.status}`);
  }

  return response.json() as Promise<TimelineRangeResponse>;
}
