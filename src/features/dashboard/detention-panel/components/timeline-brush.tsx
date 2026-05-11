import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface DataPoint {
  time: string;
  dining?: number;
  yard?: number;
  total?: number;
  index: number;
}

interface Event {
  index: number;
  time: string;
  type: 'deficit_start' | 'deficit_end';
  message: string;
  severity: 'high' | 'medium';
}

interface TimelineBrushProps {
  data: DataPoint[];
  events: Event[];
  onRangeChange: (start: number, end: number) => void;
  height?: number;
}

const TimelineBrush: React.FC<TimelineBrushProps> = ({
  data,
  events,
  onRangeChange,
  height = 50,
}) => {
  const [isDragging, setIsDragging] = useState<
    'selection' | 'left' | 'right' | false
  >(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: data.length - 1,
  });
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState<number>(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = (
    e: React.MouseEvent<SVGElement>,
    type: 'selection' | 'left' | 'right' = 'selection'
  ) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const index = Math.floor((x / rect.width) * data.length);
    setIsDragging(type);
    setDragStart(
      type === 'selection'
        ? index
        : selection[type === 'left' ? 'start' : 'end']
    );
  };

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const index = Math.floor((x / rect.width) * data.length);
    setMousePosition({ x, y });

    if (!isDragging || dragStart === null) return;

    if (isDragging === 'selection') {
      const start = Math.min(dragStart, index);
      const end = Math.max(dragStart, index);
      setSelection({
        start: Math.max(0, start),
        end: Math.min(data.length - 1, end),
      });
    }

    if (isDragging === 'left') {
      setSelection((prev) => ({
        ...prev,
        start: Math.max(0, Math.min(index, prev.end - 5)),
      }));
    }

    if (isDragging === 'right') {
      setSelection((prev) => ({
        ...prev,
        end: Math.min(data.length - 1, Math.max(index, prev.start + 5)),
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging !== false) {
      setIsDragging(false);
      setDragStart(null);
      onRangeChange(selection.start, selection.end);
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setSelection({ start: 0, end: data.length - 1 });
    onRangeChange(0, data.length - 1);
  };

  const brushData = data.map((d, i) => ({
    index: i,
    value: d.total ?? 0,
    isDeficit: (d.total ?? 0) < 900,
  }));

  const eventIndices = new Set(events.map((e) => e.index));
  const selectedRange = selection.end - selection.start + 1;
  const totalEvents = events.length;
  const criticalEvents = events.filter((e) => e.severity === 'high').length;

  const timeLabels = [
    '00:00',
    '01:00',
    '02:00',
    '03:00',
    '04:00',
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:59',
  ];

  return (
    <div className="w-full bg-card rounded-xl border overflow-hidden">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Timeline Analysis</h3>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{selectedRange} intervals selected</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>{criticalEvents} critical events</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.min(zoom * 1.5, 3))}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom / 1.5, 0.5))}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative rounded-lg border">
          <svg
            ref={svgRef}
            width="100%"
            height={height}
            className="cursor-crosshair bg-muted/50"
            onMouseDown={(e) => handleMouseDown(e, 'selection')}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoveredEvent(null);
            }}
          >
            {brushData.map((_, i) => {
              const barWidth = 100 / data.length;
              const x = i * barWidth;
              const isSelected = i >= selection.start && i <= selection.end;
              const isEvent = eventIndices.has(i);
              return (
                <rect
                  key={i}
                  x={`${x}%`}
                  y="3"
                  width={`${barWidth * 0.2}%`}
                  height={height - 10}
                  fill={
                    isEvent
                      ? 'rgb(96 165 250 / 0.30)'
                      : ' hsla(356, 72%, 67%, 0.40)'
                  }
                  opacity={isSelected ? 1 : 0.3}
                  rx="0"
                />
              );
            })}
            <rect
              x={`${(selection.start / data.length) * 100}%`}
              y="0"
              width={`${((selection.end - selection.start + 1) / data.length) * 100}%`}
              height="100%"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              rx="0"
              strokeLinejoin="miter"
            />
            <rect
              x={`${(selection.start / data.length) * 100}%`}
              y="0"
              width="1"
              height="100%"
              fill="hsl(var(--border))"
              className="cursor-ew-resize"
              rx="0"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <rect
              x={`${((selection.end + 1) / data.length) * 100}%`}
              y="0"
              width="1"
              height="100%"
              fill="hsl(var(--border))"
              className="cursor-ew-resize"
              rx="0"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
          </svg>

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {timeLabels.map((t) => (
              <span key={t} className="bg-muted px-1 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>

        {hoveredEvent && (
          <div
            className="absolute z-10 bg-card border rounded-lg shadow-xl p-3 pointer-events-none max-w-xs"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              transform: mousePosition.x > 300 ? 'translateX(-100%)' : 'none',
            }}
          >
            <div className="flex items-center space-x-2 mb-2">
              {hoveredEvent.severity === 'high' ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-semibold">{hoveredEvent.time}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {hoveredEvent.message}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Type: {hoveredEvent.type.replace('_', ' ')}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-6 bg-destructive/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>Event detection Summary</span>
                <span className="bg-destructive/20 text-destructive text-xs px-2 py-1 rounded-full">
                  {totalEvents} total
                </span>
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {events.slice(0, 6).map((event, i) => (
                <div
                  key={i}
                  className="bg-card p-3 rounded-lg border hover:shadow-md"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {event.severity === 'high' ? (
                      <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    )}
                    <span className="font-medium text-sm">{event.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {event.message}
                  </p>
                </div>
              ))}
            </div>
            {events.length > 6 && (
              <div className="mt-4 text-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full border">
                  +{events.length - 6} more events detected
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineBrush;
