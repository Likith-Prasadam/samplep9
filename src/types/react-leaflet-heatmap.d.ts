declare module 'react-leaflet-heatmap-layer-v3' {
  import { ReactNode } from 'react';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import { LatLngExpression } from 'leaflet';

  interface HeatmapLayerProps<T> {
    points: T[];
    longitudeExtractor: (point: T) => number;
    latitudeExtractor: (point: T) => number;
    intensityExtractor: (point: T) => number;
    radius?: number;
    max?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  export function HeatmapLayer<T>(props: HeatmapLayerProps<T>): ReactNode;
}
