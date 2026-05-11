import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/lib/utils';

type HeatPoint = {
  lat: number;
  lng: number;
  intensity: number;
  zone?: string;
  count?: number;
};

interface Zone {
  name: string;
  lat: number;
  lng: number;
  current: number;
  expected: number;
  delta: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export type { Zone };

// Generate synthetic heat points based on zone data
const generateHeatPointsFromZones = (zones: Zone[]): HeatPoint[] => {
  const heatPoints: HeatPoint[] = [];

  zones.forEach((zone) => {
    // Create multiple points around each zone center based on inmate count
    const pointCount = Math.ceil(zone.current / 50); // ~1 point per 50 inmates

    for (let i = 0; i < pointCount; i++) {
      // Distribute points in a circular pattern around the zone
      const angle = (i / pointCount) * Math.PI * 2;
      const radius = 0.001; // ~100 meters
      const offsetLat = Math.sin(angle) * radius;
      const offsetLng = Math.cos(angle) * radius;

      // Intensity based on status
      let intensity = 0.5;
      if (zone.status === 'CRITICAL') {
        intensity = 0.9 + Math.random() * 0.1;
      } else if (zone.status === 'WARNING') {
        intensity = 0.6 + Math.random() * 0.2;
      } else {
        intensity = 0.3 + Math.random() * 0.2;
      }

      heatPoints.push({
        lat: zone.lat + offsetLat + (Math.random() - 0.5) * 0.0005,
        lng: zone.lng + offsetLng + (Math.random() - 0.5) * 0.0005,
        intensity,
        zone: zone.name,
        count: zone.current,
      });
    }
  });

  return heatPoints;
};

// Default zones (facility layout) - Sample coordinates for a facility
const FACILITY_ZONES: Zone[] = [
  {
    name: 'Dining Hall',
    lat: 40.7128,
    lng: -74.006,
    current: 252,
    expected: 250,
    delta: 2,
    status: 'WARNING',
  },
  {
    name: 'Main Block A',
    lat: 40.7138,
    lng: -74.007,
    current: 401,
    expected: 401,
    delta: 0,
    status: 'OK',
  },
  {
    name: 'Medical Wing',
    lat: 40.7118,
    lng: -74.005,
    current: 66,
    expected: 61,
    delta: 5,
    status: 'CRITICAL',
  },
  {
    name: 'Yard',
    lat: 40.7148,
    lng: -74.008,
    current: 300,
    expected: 299,
    delta: 1,
    status: 'WARNING',
  },
];

const FACILITY_CENTER: [number, number] = [40.7133, -74.0064];

// Status color mapping
const getStatusColor = (status: 'OK' | 'WARNING' | 'CRITICAL'): string => {
  switch (status) {
    case 'OK':
      return '#22c55e'; // green
    case 'WARNING':
      return '#f59e0b'; // amber
    case 'CRITICAL':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

interface FacilityMapProps {
  zones?: Zone[];
}

export default function FacilityMap({
  zones = FACILITY_ZONES,
}: FacilityMapProps) {
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Generate heat points from zone data
  useEffect(() => {
    setIsLoading(true);
    // Simulate data processing
    const timer = setTimeout(() => {
      setHeatPoints(generateHeatPointsFromZones(zones));
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [zones]);

  // Memoize gradient to prevent re-renders
  const gradient = useMemo(
    () => ({
      0.2: 'rgba(34, 197, 94, 0.67)', // green
      0.4: 'rgba(34, 197, 94, 1)', // green
      0.5: 'rgba(245, 158, 11, 0.7)', // amber
      0.6: 'rgba(245, 158, 11, 0.8)', // amber
      0.7: 'rgba(255, 120, 0, 0.9)', // orange
      0.8: 'rgba(239, 68, 68, 0.7)', // red
      1.0: 'rgba(239, 68, 68, 1.0)', // red
    }),
    []
  );

  return (
    <Card className="min-h-[500px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Facility Heat-Map
            {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
          </CardTitle>

          {/* Status Legend (right side) */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              <span className="text-muted-foreground">Normal</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />
              <span className="text-muted-foreground">Minor</span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#ef4444' }}
              />
              <span className="text-muted-foreground">Critical</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 relative">
        {isLoading ? (
          <div className="h-[380px] flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Loading facility map...</p>
            </div>
          </div>
        ) : (
          <div className="h-[380px] w-full rounded-lg overflow-visible border relative">
            <MapContainer
              center={FACILITY_CENTER}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              className={resolvedTheme === 'dark' ? 'dark-map' : ''}
            >
              <TileLayer
                url={
                  resolvedTheme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                }
                attribution={
                  resolvedTheme === 'dark'
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }
              />

              {/* Render heatmap layer */}
              {heatPoints.length > 0 && (
                <HeatmapLayer
                  points={heatPoints}
                  longitudeExtractor={(point: HeatPoint) => point.lng}
                  latitudeExtractor={(point: HeatPoint) => point.lat}
                  intensityExtractor={(point: HeatPoint) => point.intensity}
                  radius={25}
                  max={1.0}
                  blur={15}
                  gradient={gradient}
                />
              )}

              {/* Render zone markers */}
              {zones.map((zone) => (
                <div key={zone.name}>
                  <Circle
                    center={[zone.lat, zone.lng]}
                    radius={40}
                    pathOptions={{
                      color: getStatusColor(zone.status),
                      fillColor: getStatusColor(zone.status),
                      fillOpacity: 0.2,
                      weight: 2,
                    }}
                  />
                  <Marker
                    position={[zone.lat, zone.lng]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `
                        <div style="
                          background-color: ${getStatusColor(zone.status)};
                          color: white;
                          border-radius: 50%;
                          width: 40px;
                          height: 40px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-weight: bold;
                          font-size: 14px;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                          border: 2px solid white;
                          cursor: pointer;
                        ">
                          ${zone.current}
                        </div>
                      `,
                      iconSize: [40, 40],
                    })}
                    eventHandlers={{
                      click: (e) => {
                        setSelectedZone(zone);
                        const leafletEvent = e.originalEvent as MouseEvent;
                        if (leafletEvent) {
                          setTooltipPosition({
                            x: leafletEvent.clientX,
                            y: leafletEvent.clientY,
                          });
                        }
                      },
                    }}
                  />
                </div>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Custom Tooltip for Map Point Click - Rendered via Portal */}
        {selectedZone &&
          tooltipPosition &&
          createPortal(
            <>
              {/* Backdrop overlay */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => {
                  setSelectedZone(null);
                  setTooltipPosition(null);
                }}
                style={{
                  pointerEvents: 'auto',
                }}
              />

              {/* Tooltip */}
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: 'translate(-50%, -110%)',
                }}
              >
                <div
                  className={cn(
                    'rounded-lg shadow-2xl border pointer-events-auto',
                    'max-w-sm animate-in fade-in zoom-in-95 duration-200',
                    'transition-all ease-out',
                    resolvedTheme === 'dark'
                      ? 'bg-slate-900/98 border-slate-700/80 text-slate-100'
                      : 'bg-white/98 border-slate-300/70 text-slate-950'
                  )}
                >
                  {/* Tooltip Header */}
                  <div
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 border-b',
                      resolvedTheme === 'dark'
                        ? 'border-slate-700/50'
                        : 'border-slate-200/60'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-md"
                        style={{
                          backgroundColor: getStatusColor(selectedZone.status),
                        }}
                      />
                      <h3 className="font-bold text-sm truncate">
                        {selectedZone.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedZone(null);
                        setTooltipPosition(null);
                      }}
                      className={cn(
                        'p-1.5 rounded-md hover:bg-opacity-15 transition-colors flex-shrink-0',
                        resolvedTheme === 'dark'
                          ? 'hover:bg-slate-400'
                          : 'hover:bg-slate-600'
                      )}
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tooltip Content - 2x2 Grid Layout */}
                  <div className="px-3 py-2 grid grid-cols-2 gap-4 text-sm">
                    {/* Current Count */}
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-md',
                        resolvedTheme === 'dark'
                          ? 'bg-slate-800/50'
                          : 'bg-slate-100/50'
                      )}
                    >
                      <span className="font-semibold text-xs">Current:</span>
                      <span
                        className={cn(
                          'font-bold text-base tabular-nums',
                          resolvedTheme === 'dark'
                            ? 'text-blue-400'
                            : 'text-blue-600'
                        )}
                      >
                        {selectedZone.current}
                      </span>
                    </div>

                    {/* Expected Count */}
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-md',
                        resolvedTheme === 'dark'
                          ? 'bg-slate-800/50'
                          : 'bg-slate-100/50'
                      )}
                    >
                      <span className="font-semibold text-xs">Expected:</span>
                      <span
                        className={cn(
                          'font-semibold text-base tabular-nums',
                          resolvedTheme === 'dark'
                            ? 'text-slate-300'
                            : 'text-slate-700'
                        )}
                      >
                        {selectedZone.expected}
                      </span>
                    </div>

                    {/* Variance */}
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-md',
                        resolvedTheme === 'dark'
                          ? 'bg-slate-800/50'
                          : 'bg-slate-100/50'
                      )}
                    >
                      <span className="font-semibold text-xs">Variance:</span>
                      <span
                        className={cn(
                          'font-bold text-base tabular-nums',
                          selectedZone.delta > 0
                            ? resolvedTheme === 'dark'
                              ? 'text-red-400'
                              : 'text-red-600'
                            : resolvedTheme === 'dark'
                              ? 'text-green-400'
                              : 'text-green-600'
                        )}
                      >
                        {selectedZone.delta > 0 ? '+' : ''}
                        {selectedZone.delta}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-md',
                        resolvedTheme === 'dark'
                          ? 'bg-slate-800/50'
                          : 'bg-slate-100/50'
                      )}
                    >
                      <span className="font-semibold text-xs">Status:</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-bold',
                          selectedZone.status === 'CRITICAL'
                            ? resolvedTheme === 'dark'
                              ? 'bg-red-500/30 text-red-300'
                              : 'bg-red-500/20 text-red-700'
                            : selectedZone.status === 'WARNING'
                              ? resolvedTheme === 'dark'
                                ? 'bg-amber-500/30 text-amber-300'
                                : 'bg-amber-500/20 text-amber-700'
                              : resolvedTheme === 'dark'
                                ? 'bg-green-500/30 text-green-300'
                                : 'bg-green-500/20 text-green-700'
                        )}
                      >
                        {selectedZone.status}
                      </span>
                    </div>
                  </div>

                  {/* Tooltip Arrow */}
                  <div
                    className={cn(
                      'absolute w-0 h-0 border-l-6 border-r-6 border-t-6 border-b-0 left-1/2 transform -translate-x-1/2',
                      resolvedTheme === 'dark'
                        ? 'border-t-slate-900/98'
                        : 'border-t-white/98'
                    )}
                    style={{
                      bottom: '-6px',
                      borderLeftColor: 'transparent',
                      borderRightColor: 'transparent',
                    }}
                  />
                </div>
              </div>
            </>,
            document.body
          )}
      </CardContent>
    </Card>
  );
}
