import { useTheme } from '@/providers/theme-provider';
import type { VizDataPoint, VizMeta } from '@/types/viz';

interface DetectionStatCardsProps {
  title: string;
  data: VizDataPoint[];
  meta: VizMeta;
  hideTotal?: boolean;
}

const DEFAULT_COLOR = '#6366f1';

// Color palette for category backgrounds (light and dark themed)
const getCategoryColor = (color: string, isDark: boolean = false) => {
  if (isDark) {
    const darkColorMap: Record<string, string> = {
      '#6366f1': '#4f46e5', // Indigo dark - brighter for gradient
      '#22c55e': '#10b981', // Green dark - brighter for gradient
      '#f59e0b': '#d97706', // Orange dark - brighter for gradient
      '#ef4444': '#dc2626', // Red dark - brighter for gradient
    };
    return darkColorMap[color] || '#4b5563';
  }
  const colorMap: Record<string, string> = {
    '#6366f1': '#eef2ff', // Indigo
    '#22c55e': '#dcfce7', // Green
    '#f59e0b': '#fef3c7', // Orange
    '#ef4444': '#fee2e2', // Red
  };
  return colorMap[color] || '#f8fafc';
};

// Gradient backgrounds for cards (light and dark themed)
const getCardGradient = (color: string, isDark: boolean = false) => {
  if (isDark) {
    const darkGradientMap: Record<string, string> = {
      '#6366f1': 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', // Indigo gradient dark - brighter
      '#22c55e': 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green gradient dark - brighter
      '#f59e0b': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', // Orange gradient dark - brighter
      '#ef4444': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', // Red gradient dark - brighter
    };
    return (
      darkGradientMap[color] ||
      'linear-gradient(135deg, #4b5563 0%, #374151 100%)'
    );
  }
  const gradientMap: Record<string, string> = {
    '#6366f1': 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 100%)', // Indigo gradient
    '#22c55e': 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', // Green gradient
    '#f59e0b': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', // Orange gradient
    '#ef4444': 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', // Red gradient
  };
  return (
    gradientMap[color] || 'linear-gradient(135deg, #f8fafc 0%, #f3f4f6 100%)'
  );
};

// Icon components for each category
const PersonIcon = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 fill-current"
    style={{ color }}
    aria-hidden
    focusable="false"
  >
    <path d="M12 14V16C8.68629 16 6 18.6863 6 22H4C4 17.5817 7.58172 14 12 14ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11ZM18 21.5L15.0611 23.0451L15.6224 19.7725L13.2447 17.4549L16.5305 16.9775L18 14L19.4695 16.9775L22.7553 17.4549L20.3776 19.7725L20.9389 23.0451L18 21.5Z" />
  </svg>
);

const VehicleIcon = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    style={{ color }}
    aria-hidden
    focusable="false"
  >
    <path d="M13 6v5a1 1 0 0 0 1 1h6.102a1 1 0 0 1 .712.298l.898.91a1 1 0 0 1 .288.702V17a1 1 0 0 1-1 1h-3" />
    <path d="M5 18H3a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2h12c1.1 0 2.1.8 2.4 1.8l1.176 4.2" />
    <path d="M9 18h5" />
    <circle cx="16" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const BicycleIcon = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    style={{ color }}
    aria-hidden
    focusable="false"
  >
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
  </svg>
);

const TrafficSignIcon = ({ color }: { color: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    style={{ color }}
    aria-hidden
    focusable="false"
  >
    <path d="M16.05 10.966a5 2.5 0 0 1-8.1 0" />
    <path d="m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04" />
    <path d="M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" />
    <path d="M9.194 6.57a5 2.5 0 0 0 5.61 0" />
  </svg>
);

const getIcon = (iconSrc: string, color: string) => {
  switch (iconSrc) {
    case 'person':
      return <PersonIcon color={color} />;
    case 'vehicle':
      return <VehicleIcon color={color} />;
    case 'bicycle':
      return <BicycleIcon color={color} />;
    case 'traffic-sign':
      return <TrafficSignIcon color={color} />;
    default:
      return null;
  }
};

function StatCard({
  label,
  value,
  total,
  color,
  iconSrc,
}: {
  label: string;
  value: number;
  total?: number;
  color?: string;
  iconSrc?: string;
}) {
  const { resolvedTheme } = useTheme();
  const accentColor = color ?? DEFAULT_COLOR;
  const pct =
    total && total > 0 ? ((value / total) * 100).toFixed(1) : undefined;
  const isDark = resolvedTheme === 'dark';
  const bgColor = getCategoryColor(accentColor, isDark);
  const gradientBg = getCardGradient(accentColor, isDark);

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-1 overflow-hidden bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-sm"
      style={{
        background: gradientBg,
      }}
    >
      <div className="px-5 py-5 relative z-10">
        {/* Top: Icon and Label */}
        <div className="flex items-center gap-2.5">
          {/* Icon Circle */}
          <div
            className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full transition-transform duration-200 group-hover:scale-110 dark:bg-opacity-30"
            style={{
              backgroundColor: isDark
                ? `${accentColor}20`
                : iconSrc === 'vehicle'
                  ? '#dcfce7'
                  : bgColor,
            }}
          >
            {getIcon(iconSrc || '', accentColor)}
          </div>

          {/* Label */}
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: accentColor }}
          >
            {label}
          </span>
        </div>

        {/* Middle: Count and Percentage */}
        <div className="flex flex-col gap-1 mt-3">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {value.toLocaleString()}
          </span>
          {pct ? (
            <span
              className="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold -ml-2.5"
              style={{ color: accentColor }}
            >
              {pct}% of total
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom: Progress Bar */}
      {/* <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            backgroundColor: accentColor,
            width: `${pct ? Math.min(parseFloat(pct), 100) : 0}%`,
          }}
        />
      </div> */}
    </div>
  );
}

export function DetectionStatCards({
  title,
  data,
  meta,
}: DetectionStatCardsProps) {
  const total = meta.total_objects ?? 244;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      {!title?.includes('') && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 dark:bg-opacity-40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current text-indigo-600 dark:text-indigo-400"
                  aria-hidden
                  focusable="false"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detection Summary
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Object counts
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-slate-800 dark:border dark:border-slate-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Total Objects Detected
            </span>
            <span
              className="text-4xl font-bold dark:text-indigo-400"
              style={{ color: '#6366f1' }}
            >
              {total}
            </span>
          </div>
        </div>
      )}

      {/* Per-class grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((item, i) => (
          <StatCard
            key={i}
            label={item.name}
            value={item.value}
            total={total}
            color={item.color}
            iconSrc={
              item.name === 'Person'
                ? 'person'
                : item.name === 'Bicycle'
                  ? 'bicycle'
                  : item.name === 'Traffic Sign'
                    ? 'traffic-sign'
                    : item.name === 'Vehicle'
                      ? 'vehicle'
                      : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
