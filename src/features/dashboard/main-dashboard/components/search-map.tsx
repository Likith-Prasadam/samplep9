/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  GeoJSON,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface LocationMapProps {
  center: [number, number];
  zoom: number;
  markerPosition?: [number, number] | null;
  locationName: string;
  geoJsonData?: any;
  randomPoints?: [number, number][];
  bounds?: [[number, number], [number, number]] | null;
}

const MapController = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const FitBounds = ({ geoJsonData }: { geoJsonData: any }) => {
  const map = useMap();

  useEffect(() => {
    if (geoJsonData) {
      try {
        const bounds = L.geoJSON(geoJsonData).getBounds();
        map.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: 12,
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [geoJsonData, map]);

  return null;
};

const LocationMap = ({
  center,
  zoom,
  markerPosition,
  locationName,
  geoJsonData,
  randomPoints,
}: LocationMapProps) => {
  const defaultCenter: [number, number] = [16.51, 80.63];
  const defaultZoom = 12;
  const effectiveCenter = center || defaultCenter;
  const effectiveZoom = zoom || defaultZoom;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const updateTheme = () => setIsDark(html.classList.contains('dark'));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const customMarker = (
    latlng: [number, number],
    index: number,
    key: string
  ) => (
    <div key={key}>
      <CircleMarker
        center={latlng}
        radius={12}
        color="#ff0000"
        fillColor="#ff0000"
        fillOpacity={0.4}
        weight={2}
      >
        <Popup>
          <div className="font-medium text-gray-900 dark:text-gray-100">{`${locationName} - Point ${index + 1}`}</div>
        </Popup>
      </CircleMarker>
      <CircleMarker
        center={latlng}
        radius={6}
        color="#ff0000"
        fillColor="#ff0000"
        fillOpacity={1}
        weight={0}
      />
    </div>
  );

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        position: 'relative', // Important for containing absolute children
      }}
    >
      <MapContainer
        center={effectiveCenter}
        zoom={effectiveZoom}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          zIndex: 0, // Critical: Keep map below UI
        }}
        className="border-2 border-gray-200 dark:border-gray-800"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={20}
        />
        <MapController center={effectiveCenter} zoom={effectiveZoom} />
        <FitBounds geoJsonData={geoJsonData} />
        {geoJsonData && (
          <GeoJSON
            key={JSON.stringify(geoJsonData)}
            data={geoJsonData}
            style={{
              fillColor: '#60a5fa',
              weight: 3,
              opacity: 1,
              color: '#2563eb',
              fillOpacity: 0.15,
            }}
          />
        )}
        {randomPoints && randomPoints.length > 0 && (
          <>
            {randomPoints.map((point, index) =>
              customMarker(point, index, `point-${index}`)
            )}
          </>
        )}
        {markerPosition &&
          !randomPoints &&
          customMarker(markerPosition, 0, 'single-marker')}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
