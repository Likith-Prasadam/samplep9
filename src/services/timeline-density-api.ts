import { getUserSession } from '@/lib/ssemanager';

const TIMELINE_DENSITY_URL = import.meta.env
  .VITE_TIMELINE_DENSITY_API_URL as string;

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

export type Granularity = '5min' | '1hour' | '1day';

export interface DensityBucket {
  bucket_start: string;
  event_count: number;
}

export interface TimelineDensityResponse {
  buckets: DensityBucket[];
}

export interface FetchDensityParams {
  cam_hash: string;
  from_utc: string;
  to_utc: string;
  granularity: Granularity;
}

export async function fetchTimelineDensity(
  params: FetchDensityParams
): Promise<TimelineDensityResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const url = new URL(TIMELINE_DENSITY_URL);
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
    throw new Error(`Failed to fetch timeline density: ${response.status}`);
  }

  return response.json() as Promise<TimelineDensityResponse>;
}
