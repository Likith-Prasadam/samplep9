import { useState } from 'react';
import type { VizDataPoint, VizMeta } from '@/types/viz';

interface DetectionStatCardsProps {
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
}

const DEFAULT_COLOR = '#6366f1';

function StatCard({
  label,
  value,
  pct,
  color,
  isTotal,
}: {
  label: string;
  value: number;
  pct?: string;
  color?: string;
  isTotal?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accentColor = isTotal ? 'hsl(var(--primary))' : (color ?? DEFAULT_COLOR);

  return (
    <div
      className={`relative flex flex-col gap-1 rounded-xl border px-4 py-3 transition-all duration-150 ${
        isTotal
          ? 'bg-primary/5 border-primary/20'
          : hovered
            ? 'bg-muted/40 border-border shadow-md'
            : 'bg-card border-border/60'
      }`}
      style={{ cursor: 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-[11px] font-medium text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <span
        className={`font-bold tabular-nums leading-none ${isTotal ? 'text-3xl' : 'text-2xl'}`}
        style={{ color: accentColor }}
      >
        {value.toLocaleString()}
      </span>

      {/* Hover tooltip bubble */}
      {hovered && !isTotal && pct && (
        <div
          className="absolute -top-8 left-1/2 z-10 rounded-lg border border-border/80 bg-card px-2.5 py-1 shadow-xl text-xs font-semibold text-foreground whitespace-nowrap"
          style={{ transform: 'translateX(-50%)' }}
        >
          {value.toLocaleString()} &nbsp;·&nbsp;
          <span className="text-muted-foreground font-normal">{pct}%</span>
          {/* Arrow */}
          <span
            className="absolute left-1/2 -bottom-1.5 w-2.5 h-2.5 bg-card border-b border-r border-border/80 rotate-45"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
          />
        </div>
      )}
    </div>
  );
}

export function DetectionStatCards({ title, data, meta }: DetectionStatCardsProps) {
  const total = meta.total_objects ?? data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="w-full">
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {title}
        </p>
      )}

      {/* Total — full width */}
      {total > 0 && (
        <div className="mb-2">
          <StatCard label="Total Objects" value={total} isTotal />
        </div>
      )}

      {/* Per-class grid */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => {
          const pct =
            total > 0 ? ((item.value / total) * 100).toFixed(1) : undefined;
          return (
            <StatCard
              key={i}
              label={item.name}
              value={item.value}
              pct={pct}
              color={item.color}
            />
          );
        })}
      </div>
    </div>
  );
}
