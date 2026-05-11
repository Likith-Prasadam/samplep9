import { getUserSession } from '@/lib/ssemanager';

const DYNAMIC_INSIGHTS_URL = import.meta.env
  .VITE_DYNAMIC_INSIGHTS_DASHBOARD_API_URL as string;

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

export type InsightsGranularity = '5min' | '1hour' | '1day';

export interface InsightsClassBreakdown {
  class_label: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface InsightsSummaryStats {
  total_detections: number;
  dominant_class: string;
  dominant_class_count: number;
  detection_rate_per_minute: number;
  peak_window: string;
  peak_window_count: number;
  class_breakdown: InsightsClassBreakdown[];
}

export interface InsightsTimeSeriesBucket {
  bucket_start: string;
  class_counts: Record<string, number>;
}

export interface InsightsClassTotal {
  class_label: string;
  count: number;
  color?: string;
}

export interface InsightsPeakWindow {
  bucket_start: string;
  total_count: number;
  top_class: string;
  class_counts: Record<string, number>;
}

export interface InsightsCoOccurrence {
  class_a: string;
  class_b: string;
  co_occurrence_count: number;
}

export interface InsightsResponse {
  source_hash: string;
  source_type: string;
  from_ts: string;
  to_ts: string;
  granularity: InsightsGranularity;
  summary_stats: InsightsSummaryStats;
  time_series: InsightsTimeSeriesBucket[];
  class_totals: InsightsClassTotal[];
  peak_windows: InsightsPeakWindow[];
  co_occurrence: InsightsCoOccurrence[];
}

export interface FetchInsightsParams {
  source_hash: string;
  source_type: 'live' | 'batch';
  from_ts: string;
  to_ts: string;
  granularity: InsightsGranularity;
}

export async function fetchDynamicInsights(
  params: FetchInsightsParams
): Promise<InsightsResponse> {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const url = new URL(DYNAMIC_INSIGHTS_URL);
  url.searchParams.set('source_hash', params.source_hash);
  url.searchParams.set('source_type', params.source_type);
  url.searchParams.set('from_ts', params.from_ts);
  url.searchParams.set('to_ts', params.to_ts);
  url.searchParams.set('granularity', params.granularity);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch insights: ${response.status}`);
  }

  return response.json() as Promise<InsightsResponse>;
}
