import type { NormalizedDetection } from '../utils/bounding-box-normalizer';
import { Group, Layer, Rect, Stage, Text } from 'react-konva';

interface BoundingBoxOverlayProps {
  /** Width of the rendered video area in pixels */
  renderWidth: number;
  /** Height of the rendered video area in pixels */
  renderHeight: number;
  /** X offset of the video relative to its container (object-contain letterboxing) */
  offsetX: number;
  /** Y offset of the video relative to its container (object-contain letterboxing) */
  offsetY: number;
  detections: NormalizedDetection[];
  /** Show track IDs on labels */
  showTrackIds?: boolean;
  /** Highlighted track ID (renders with emphasis) */
  highlightedTrackId?: string;
}

/** Deterministic colour per class name (matches YOLO prototype palette) */
const colorForClass = (className: string): string => {
  const palette = getThemePalette();
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const resolveCssVar = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

const getThemePalette = (): string[] => [
  resolveCssVar('--primary', '#0066cc'),
  resolveCssVar('--chart-2', '#1e5bff'),
  resolveCssVar('--chart-1', '#ffae05'),
  resolveCssVar('--chart-3', '#a4a4a4'),
  resolveCssVar('--chart-5', '#747474'),
  resolveCssVar('--success', '#16a34a'),
  resolveCssVar('--destructive', '#ff3237'),
];

const getStatusTextColor = (line: string): string => {
  if (/\byes\b/i.test(line)) {
    return resolveCssVar('--success', '#16a34a');
  }

  if (/\bno\b/i.test(line)) {
    return resolveCssVar('--destructive', '#ff3237');
  }

  return resolveCssVar('--popover-foreground', '#ffffff');
};

const buildLabelLines = (label: string): string[] =>
  label
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

export function BoundingBoxOverlay({
  renderWidth,
  renderHeight,
  offsetX,
  offsetY,
  detections,
  showTrackIds = false,
  highlightedTrackId = '',
}: BoundingBoxOverlayProps) {
  if (renderWidth <= 0 || renderHeight <= 0) return null;

  const fontSize = 12;
  const lineHeight = 1.25;
  const padX = 6;
  const padY = 4;

  return (
    <div
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        width: renderWidth,
        height: renderHeight,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <Stage width={renderWidth} height={renderHeight} listening={false}>
        <Layer listening={false}>
          {detections.map((det) => {
            const color = colorForClass(det.className);
            const isHighlighted =
              Boolean(highlightedTrackId) && det.trackId === highlightedTrackId;
            const x = det.bbox.x * renderWidth;
            const y = det.bbox.y * renderHeight;
            const w = det.bbox.width * renderWidth;
            const h = det.bbox.height * renderHeight;

            const classLabel = det.className.replace(/_/g, ' ');
            const confidenceLabel = `${(det.confidence * 100).toFixed(0)}%`;
            const trackLabel =
              showTrackIds && det.trackId ? ` [${det.trackId}]` : '';
            const rawLabelLines = det.displayLabel
              ? [
                  ...buildLabelLines(det.displayLabel),
                  trackLabel.trim(),
                ].filter(Boolean)
              : [`${classLabel} ${confidenceLabel}${trackLabel}`.trim()];

            const labelLines = rawLabelLines.map((line) => ({
              text: line,
              fill: getStatusTextColor(line),
            }));

            const measuredWidth = Math.max(
              Math.max(
                ...labelLines.map((line) => line.text.length * fontSize * 0.55)
              ) +
                padX * 2,
              40
            );
            const measuredHeight =
              labelLines.length * fontSize * lineHeight + padY * 2;
            const labelY = Math.max(2, y - measuredHeight - 2);
            const strokeWidth = isHighlighted ? 3 : 2;

            return (
              <Group key={det.id}>
                <Rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fillEnabled={false}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  cornerRadius={4}
                  opacity={isHighlighted ? 1 : 0.95}
                  shadowBlur={isHighlighted ? 8 : 0}
                  shadowColor={isHighlighted ? '#ffffff' : undefined}
                  shadowOpacity={isHighlighted ? 0.6 : 0}
                  perfectDrawEnabled={false}
                />
                <Rect
                  x={x}
                  y={labelY}
                  width={measuredWidth}
                  height={measuredHeight}
                  fill={color}
                  cornerRadius={3}
                  opacity={isHighlighted ? 0.6 : 0.45}
                  perfectDrawEnabled={false}
                />
                <Text
                  x={x + padX}
                  y={labelY + padY}
                  text={labelLines[0]?.text ?? ''}
                  fontSize={fontSize}
                  fontStyle="bold"
                  fill={labelLines[0]?.fill ?? '#ffffff'}
                  shadowBlur={2}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowOffsetY={1}
                  perfectDrawEnabled={false}
                />
                {labelLines.slice(1).map((line, index) => (
                  <Text
                    key={`${det.id}-${line.text}-${index}`}
                    x={x + padX}
                    y={labelY + padY + (index + 1) * fontSize * lineHeight}
                    text={line.text}
                    fontSize={fontSize}
                    fontStyle="bold"
                    fill={line.fill}
                    shadowBlur={2}
                    shadowColor="rgba(0,0,0,0.5)"
                    shadowOffsetY={1}
                    perfectDrawEnabled={false}
                  />
                ))}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
