import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VizDataPoint, VizMeta } from '@/types/viz';

interface ScatterPoint extends VizDataPoint {
  x: number;
  y: number;
  count: number;
}

interface DetectionScatterChartProps {
  title: string;
  data: ScatterPoint[];
  meta: VizMeta;
}

const DEFAULT_COLOR = '#6366f1';

const formatTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const calculateTrendLine = (data: ScatterPoint[]) => {
  if (data.length < 2) return [];

  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.x, 0);
  const sumY = data.reduce((sum, point) => sum + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;

  for (const point of data) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  const xValues = data.map((point) => point.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];
};

const renderTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const point = item.payload;

  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xl px-3 py-2.5 min-w-[180px]">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
        {point.name}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Speed</span>
          <span className="font-semibold text-foreground">{point.x} km/h</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Time</span>
          <span className="font-semibold text-foreground">{formatTime(point.y)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Count</span>
          <span className="font-semibold text-foreground">{point.count}</span>
        </div>
      </div>
    </div>
  );
};

export function DetectionScatterChart({ title, data, meta }: DetectionScatterChartProps) {
  const seriesMap = new Map<string, ScatterPoint[]>();

  data.forEach((point) => {
    const existing = seriesMap.get(point.name) ?? [];
    existing.push(point);
    seriesMap.set(point.name, existing);
  });

  const series = Array.from(seriesMap.entries()).map(([name, points]) => ({
    name,
    points,
    color: points[0]?.color ?? DEFAULT_COLOR,
  }));

  const trendLine = calculateTrendLine(data);

  return (
    <div className="w-full" style={{ cursor: 'crosshair' }}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {title}
        </p>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 32, left: 12, bottom: 28 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="x"
            tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))' }}
            tickLine={false}
            axisLine={false}
            label={
              meta.x_axis_label
                ? { value: meta.x_axis_label, position: 'insideBottom', offset: -20, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                : undefined
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))' }}
            tickLine={false}
            axisLine={false}
            width={60}
            tickFormatter={formatTime}
            label={
              meta.y_axis_label
                ? { value: meta.y_axis_label, angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                : undefined
            }
          />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'hsl(var(--muted))', strokeDasharray: '4 4' }} />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
            formatter={(value: string) => (
              <span style={{ color: 'hsl(var(--foreground))', fontSize: 11 }}>{value}</span>
            )}
          />

          {trendLine.length === 2 && (
            <Line
              type="linear"
              data={trendLine}
              dataKey="y"
              stroke="hsl(var(--foreground))"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              legendType="none"
            />
          )}

          {series.map((item) => (
            <Scatter
              key={item.name}
              name={item.name}
              data={item.points}
              fill={item.color}
              line={{}}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
