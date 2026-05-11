interface TooltipPayloadItem {
  name: string;       // dataKey name, e.g. "value" for Area/Line
  value: number;
  color?: string;     // Recharts passes fill color — may be a gradient URL for Area
  stroke?: string;    // actual stroke color for line/area series
  payload?: {
    name?: string;
    value?: number;
    color?: string;
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  total?: number;
  unit?: string;
  showLabel?: boolean;
}

export function ChartTooltip({
  active,
  payload,
  label,
  total,
  unit = 'detections',
  showLabel = true,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-border/80 bg-card shadow-xl px-3 py-2.5 min-w-[140px]"
      style={{ fontSize: 12 }}
    >
      {showLabel && label && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 border-b border-border/40 pb-1.5">
          {label}
        </p>
      )}
      {payload.map((item, i) => {
        // Prefer stroke color over fill — Area/Line pass fill as a gradient URL string
        const rawColor = item.color ?? '';
        const resolvedColor =
          rawColor.startsWith('url(') || rawColor === ''
            ? (item.stroke ?? item.payload?.color ?? '#6366f1')
            : rawColor;
        const value = item.value ?? 0;
        const pct =
          total && total > 0
            ? ` (${((value / total) * 100).toFixed(1)}%)`
            : '';
        // "value" is the dataKey name — not useful to show. Use "Detections" as fallback.
        const displayName =
          item.name === 'value' ? 'Detections' : (item.name || item.payload?.name || 'Count');
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: resolvedColor }}
            />
            <span className="text-muted-foreground flex-1 truncate">
              {displayName}
            </span>
            <span className="font-bold text-foreground tabular-nums ml-2">
              {value.toLocaleString()}
              <span className="font-normal text-muted-foreground text-[10px]">
                {pct}
              </span>
            </span>
          </div>
        );
      })}
      {unit && (
        <p className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border/40">
          {unit}
        </p>
      )}
    </div>
  );
}

/** Shared tooltip content style — pass to Recharts Tooltip contentStyle */
export const tooltipContentStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  padding: 0,
  boxShadow: 'none',
};
