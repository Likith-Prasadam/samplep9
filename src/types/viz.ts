export type ChartType = 'bar' | 'pie' | 'line' | 'stat_cards' | 'multi';

export interface VizDataPoint {
  name: string;
  value: number;
  color?: string;
  delta?: number;
}

export interface SeriesDescriptor {
  key: string;
  color: string;
}

export interface VizMeta {
  total_objects?: number;
  chunk_count?: number;
  segment_count?: number;
  detection_type?: string;
  unit?: string;
  mode_counts?: Record<string, number>;
  x_axis_label?: string;
  x_axis_key?: string;
  y_axis_label?: string;
  layout?: 'horizontal' | 'vertical';
  inner_radius?: number;
  outer_radius?: number;
  show_legend?: boolean;
  dot?: boolean;
  stroke_width?: number;
  // multi-series line chart
  rows?: Record<string, unknown>[];
  series?: SeriesDescriptor[];
  // multi chart sub-payloads
  charts?: VizPayload[];
}

export interface VizPayload {
  chart_type: ChartType;
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
}

export interface SSEDelta {
  content?: string;
  viz?: VizPayload;
}
