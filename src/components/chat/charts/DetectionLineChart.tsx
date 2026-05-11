import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { VizDataPoint, VizMeta, SeriesDescriptor } from '@/types/viz';

interface DetectionLineChartProps {
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
}

const DEFAULT_COLOR = '#6366f1';

// ─── Crosshair cursor ────────────────────────────────────────────────────────
const CustomCursor = ({
  points,
  height,
}: {
  points?: { x: number; y: number }[];
  height?: number;
}) => {
  if (!points?.[0] || !height) return null;
  const { x } = points[0];
  return (
    <svg overflow="visible">
      <line
        x1={x} y1={0} x2={x} y2={height}
        stroke={DEFAULT_COLOR}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeOpacity={0.45}
      />
    </svg>
  );
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const MultiTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p) => p.value > 0);
  if (!visible.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-card shadow-xl px-3 py-2.5 min-w-[160px] max-w-[220px]">
      {label && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 border-b border-border/40 pb-1.5">
          {label}
        </p>
      )}
      {visible.map((item, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground flex-1 truncate text-xs">{item.name}</span>
          <span className="font-bold text-foreground tabular-nums text-xs ml-2">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export function DetectionLineChart({ title, data, meta }: DetectionLineChartProps) {
  const showDot     = meta.dot ?? true;
  const strokeWidth = meta.stroke_width ?? 2;
  const rows        = (meta.rows   ?? []) as Record<string, unknown>[];
  const allSeries   = (meta.series ?? []) as SeriesDescriptor[];

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (rows.length === 0 && data.length === 0) {
    return (
      <div className="w-full">
        {title && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {title}
          </p>
        )}
        <div className="flex items-center justify-center h-40 rounded-xl border border-border/40 bg-muted/10">
          <p className="text-sm text-muted-foreground">No time-series data available</p>
        </div>
      </div>
    );
  }

  // ── Multi-series path (meta.rows + meta.series present) ──────────────────────
  if (rows.length > 0 && allSeries.length > 0) {
    const xKey = meta.x_axis_key ?? 'segment';

    // Keep only series that have at least one non-zero value
    const activeSeries = allSeries
      .filter((s) => rows.some((row) => Number(row[s.key] ?? 0) > 0))
      .map((s) => ({
        ...s,
        total: rows.reduce((sum, row) => sum + Number(row[s.key] ?? 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // max 8 lines — keeps legend readable

    // Y-axis: zoom into the data range so lines aren't all near zero
    let maxVal = 0;
    let minNonZero = Infinity;
    for (const row of rows) {
      for (const s of activeSeries) {
        const v = Number(row[s.key] ?? 0);
        if (v > maxVal) maxVal = v;
        if (v > 0 && v < minNonZero) minNonZero = v;
      }
    }
    if (minNonZero === Infinity) minNonZero = 0;
    const yPad = Math.max(Math.ceil(maxVal * 0.15), 5);
    const yMin = Math.max(0, minNonZero - yPad);
    const yMax = Math.ceil(maxVal + yPad);

    return (
      <div className="w-full" style={{ cursor: 'crosshair' }}>
        {title && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {title}
          </p>
        )}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={rows}
            margin={{ top: 8, right: 24, left: 8, bottom: 28 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              label={
                meta.x_axis_label
                  ? { value: meta.x_axis_label, position: 'insideBottom', offset: -14, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                  : undefined
              }
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: 'var(--chart-axis-tick-muted, hsl(var(--muted-foreground)))' }}
              tickLine={false}
              axisLine={false}
              width={45}
              label={
                meta.y_axis_label
                  ? { value: meta.y_axis_label, angle: -90, position: 'insideLeft', offset: 8, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                  : undefined
              }
            />
            <Tooltip
              content={<MultiTooltip />}
              wrapperStyle={{ outline: 'none' }}
              cursor={<CustomCursor />}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))', fontSize: 11 }}>{value}</span>
              )}
            />
            {activeSeries.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.key}
                stroke={s.color}
                strokeWidth={strokeWidth}
                dot={showDot ? { fill: s.color, stroke: 'white', strokeWidth: 2, r: 5 } : false}
                activeDot={{ r: 7, fill: s.color, stroke: 'white', strokeWidth: 2.5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Summary: total per class for context */}
        <div className="mt-3 pt-2 border-t border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            Totals across {rows.length} segments
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {activeSeries.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-muted-foreground flex-1 truncate">{s.key}</span>
                <span className="text-xs font-bold tabular-nums text-foreground">{s.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Fallback: single-line (old payload — only data[], no rows/series) ─────────
  const safeData = data.filter((d) => d.value > 0);
  const total    = safeData.reduce((s, d) => s + d.value, 0);
  const avg      = safeData.length > 0 ? Math.round(total / safeData.length) : 0;
  const maxVal   = safeData.reduce((m, d) => Math.max(m, d.value), 0);
  const minVal   = safeData.reduce((m, d) => Math.min(m, d.value), maxVal);
  const yPad     = Math.max(Math.ceil(maxVal * 0.15), 5);
  const yMin     = Math.max(0, minVal - yPad);
  const yMax     = maxVal > 0 ? Math.ceil(maxVal + yPad) : 10;
  const fallbackRows = safeData.map((d) => ({ segment: d.name, value: d.value }));

  return (
    <div className="w-full" style={{ cursor: 'crosshair' }}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={fallbackRows} margin={{ top: 12, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
          <XAxis
            dataKey="segment"
            tick={{ fontSize: 12, fill: 'var(--chart-axis-tick, hsl(var(--foreground)))', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            label={
              meta.x_axis_label
                ? { value: meta.x_axis_label, position: 'insideBottom', offset: -14, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                : undefined
            }
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: 'var(--chart-axis-tick-muted, hsl(var(--muted-foreground)))' }}
            tickLine={false}
            axisLine={false}
            width={45}
            label={
              meta.y_axis_label
                ? { value: meta.y_axis_label, angle: -90, position: 'insideLeft', offset: 8, fontSize: 11, fill: 'var(--chart-axis-label, hsl(var(--muted-foreground)))' }
                : undefined
            }
          />
          <Tooltip
            content={<MultiTooltip />}
            wrapperStyle={{ outline: 'none' }}
            cursor={<CustomCursor />}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Detections"
            stroke={DEFAULT_COLOR}
            strokeWidth={strokeWidth}
            dot={showDot ? { fill: DEFAULT_COLOR, stroke: 'white', strokeWidth: 2, r: 5 } : false}
            activeDot={{ r: 7, fill: DEFAULT_COLOR, stroke: 'white', strokeWidth: 2.5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {safeData.length <= 6 && (
        <div
          className="mt-3 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(safeData.length, 4)}, 1fr)` }}
        >
          {safeData.map((d, i) => {
            const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
            const color = d.color ?? DEFAULT_COLOR;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 rounded-lg border border-border/50 bg-muted/10 px-3 py-2">
                <span className="inline-block w-2 h-2 rounded-full mb-0.5" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium text-muted-foreground truncate w-full text-center">{d.name}</span>
                <span className="text-base font-bold tabular-nums text-foreground">{d.value.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-border/40">
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums" style={{ color: DEFAULT_COLOR }}>{total.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-foreground">{avg.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg / Segment</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-foreground">{safeData.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Segments</div>
        </div>
      </div>
    </div>
  );
}
