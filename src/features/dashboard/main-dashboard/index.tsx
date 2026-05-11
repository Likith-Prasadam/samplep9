import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import LocationMap from './components/search-map';
import VehicleStatsCards from './components/vehicles-stats';
// import TrafficIntensityGraph from './components/graph';
import IncidentTimeline from './components/incident-timeline';

import EventAlertCards from './components/event-alerts';
import { Header } from '@/components/layouts/header';
import { ThemeSwitch } from '@/components/theme-switch';
// import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { SearchField } from '@/components/search';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Main } from '@/components/layouts/main';

type GeoJSONCoordinates = number[][] | number[][][];

interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: GeoJSONCoordinates;
}

interface NominatimAddress {
  state?: string;
  region?: string;
  province?: string;
  county?: string;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  address?: NominatimAddress;
  boundingbox?: [string, string, string, string];
  geojson?: GeoJSONGeometry;
}

const Dashboard = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('detention');
  const [searchQuery, setSearchQuery] = useState('New Orleans, Louisiana, USA');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
  const [center, setCenter] = useState<[number, number]>([29.9586, -90.0657]);
  const [zoom, setZoom] = useState(12);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    null
  );
  const [locationName, setLocationName] = useState(
    'New Orleans, Louisiana, USA'
  );
  const [isSearching, setIsSearching] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONGeometry | null>(null);
  const [bounds, setBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);
  const [locationDetails, setLocationDetails] = useState<{
    lat: number;
    lon: number;
    region: string;
  } | null>({ lat: 29.9586, lon: -90.0657, region: 'Louisiana' });

  const newOrleansPoints: [number, number][] = [
    [29.9586, -90.0657],
    [29.9776, -90.0802],
    [29.9396, -90.0512],
  ];

  useEffect(() => {
    const initialQuery = 'New Orleans, Louisiana, USA';
    setIsSearching(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        initialQuery
      )}&format=json&limit=10&polygon_geojson=1&addressdetails=1`
    )
      .then((response) => response.json())
      .then((data: NominatimResult[]) => {
        if (data && data.length > 0) {
          let bestResult: NominatimResult = data[0];
          let maxArea = 0;
          for (const result of data) {
            if (
              result.geojson &&
              (result.geojson.type === 'Polygon' ||
                result.geojson.type === 'MultiPolygon')
            ) {
              const bbox = result.boundingbox;
              if (bbox) {
                const area =
                  (parseFloat(bbox[1]) - parseFloat(bbox[0])) *
                  (parseFloat(bbox[3]) - parseFloat(bbox[2]));
                if (area > maxArea) {
                  maxArea = area;
                  bestResult = result;
                }
              }
            }
          }
          processLocation(bestResult);
        }
      })
      .catch(() => {
        // Handle error silently for initial load
      })
      .finally(() => {
        setIsSearching(false);
      });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }
    if (!shouldShowSuggestions) {
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&limit=5&polygon_geojson=1&addressdetails=1`
        );
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, shouldShowSuggestions]);

  const processLocation = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setCenter([lat, lon]);
    setLocationName(result.display_name);
    const address = result.address || {};
    const region =
      address.state ||
      address.region ||
      address.province ||
      address.county ||
      '';
    setLocationDetails({ lat, lon, region });

    if (result.geojson) {
      setGeoJsonData(result.geojson);
      setMarkerPosition(null);
      if (result.boundingbox) {
        const bbox = result.boundingbox;
        const southWest: [number, number] = [
          parseFloat(bbox[0]),
          parseFloat(bbox[2]),
        ];
        const northEast: [number, number] = [
          parseFloat(bbox[1]),
          parseFloat(bbox[3]),
        ];
        setBounds([southWest, northEast]);
      } else {
        setBounds(null);
      }
    } else {
      setGeoJsonData(null);
      setBounds(null);
      setMarkerPosition([lat, lon]);
      const type = result.type;
      let newZoom = 12;
      if (type === 'country' || result.class === 'boundary') {
        newZoom = 5;
      } else if (type === 'state' || type === 'province') {
        newZoom = 7;
      } else if (type === 'city' || type === 'town' || type === 'village') {
        newZoom = 12;
      } else if (type === 'suburb' || type === 'neighbourhood') {
        newZoom = 14;
      }
      setZoom(newZoom);
    }
  };

  const handleSearch = async (query?: string) => {
    const actualQuery = query || searchQuery;
    if (!actualQuery.trim()) return;
    setIsSearching(true);
    setSuggestions([]);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          actualQuery
        )}&format=json&limit=10&polygon_geojson=1&addressdetails=1`
      );
      const data: NominatimResult[] = await response.json();
      if (data && data.length > 0) {
        let bestResult: NominatimResult = data[0];
        let maxArea = 0;
        for (const result of data) {
          if (
            result.geojson &&
            (result.geojson.type === 'Polygon' ||
              result.geojson.type === 'MultiPolygon')
          ) {
            const bbox = result.boundingbox;
            if (bbox) {
              const area =
                (parseFloat(bbox[1]) - parseFloat(bbox[0])) *
                (parseFloat(bbox[3]) - parseFloat(bbox[2]));
              if (area > maxArea) {
                maxArea = area;
                bestResult = result;
              }
            }
          }
        }
        processLocation(bestResult);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch {
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: NominatimResult) => {
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
    setIsLoadingSuggestions(false);
    setShouldShowSuggestions(false);
    processLocation(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSuggestions([]);
      handleSearch();
    }
  };

  const isNewOrleans = locationName.toLowerCase().includes('new orleans');

  return (
    <div className="w-full h-screen flex flex-col">
      <Header fixed>
        <div className="flex items-center gap-2 w-full">
          <SearchField />
          <div className="ms-auto flex items-center space-x-4">
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </div>
      </Header>
      <Main fixed className="flex-1 overflow-auto pl-16 pr-25">
        <div className="w-full flex flex-col pl-10">
          <div className="w-full flex items-center justify-between gap-8 py-3 mb-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Live Traffic Dashboard
              </h2>
              <p className="text-muted-foreground">
                Real-time monitoring of traffic conditions across regions
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Total Vehicles:{' '}
                  <span className="text-purple-600 dark:text-purple-400">
                    4,824
                  </span>
                </h2>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={'h-8 px-3 flex items-center gap-2'}
                    title="Select Dashboard"
                  >
                    <span className="text-sm">Select Dashboard</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={selectedDashboard}
                    onValueChange={(value) => {
                      setSelectedDashboard(value);
                      if (value === 'detention') {
                        window.location.href = '/apps/detention-panel';
                      } else if (value === 'civil') {
                        window.open('http://54.85.187.163/', '_blank');
                      } else if (value === 'manufacturing') {
                        window.location.href = '/dashboard/main';
                      } else if (value === 'traffic') {
                        window.location.href = '/dashboard/main';
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value="detention">
                      Detention Panel
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="civil">
                      Civil Supplies
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="manufacturing">
                      Manufacturing Safety
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="traffic">
                      Live Traffic Dashboard
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="w-full py-2">
            <VehicleStatsCards showTotalHeader={false} />
          </div>

          <div className="w-full py-2">
            <IncidentTimeline />
          </div>

          <div className="w-full flex items-center justify-start gap-8 py-3">
            <div className="flex-1 max-w-xl shrink-0">
              <div className="p-0 border-gray-800/50">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShouldShowSuggestions(true);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search for a city, state, or country..."
                      className="w-full bg-muted/25 group text-muted-foreground hover:bg-accent relative h-8 flex-1 justify-start rounded-md text-sm font-normal shadow-none "
                    />
                    {(isLoadingSuggestions || suggestions.length > 0) &&
                      !isSearching && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-2xl max-h-80 overflow-auto z-1001 backdrop-blur-md">
                          {isLoadingSuggestions ? (
                            <div className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                              Loading suggestions...
                            </div>
                          ) : (
                            suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                onClick={() =>
                                  handleSuggestionSelect(suggestion)
                                }
                                className="w-full justify-start px-4 py-3 text-left text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg transition-colors duration-150 border-b border-gray-200/50 dark:border-gray-800/30 last:border-b-0"
                              >
                                <span className="text-sm">
                                  {suggestion.display_name}
                                </span>
                              </Button>
                            ))
                          )}
                        </div>
                      )}
                  </div>
                  <Button
                    onClick={() => {
                      setSuggestions([]);
                      handleSearch();
                    }}
                    disabled={isSearching}
                    className=" shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-8 w-full my-2">
            <div className="w-[40%] flex flex-col gap-2">
              {locationDetails && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2 border border-gray-200 dark:border-gray-800/30">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        📍 Coordinates:
                      </span>
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {locationDetails.lat.toFixed(6)},{' '}
                        {locationDetails.lon.toFixed(6)}
                      </span>
                    </div>
                    {locationDetails.region && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          📌 Region:
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {locationDetails.region}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-[500px]">
                <LocationMap
                  center={center}
                  zoom={zoom}
                  markerPosition={markerPosition}
                  locationName={locationName}
                  geoJsonData={geoJsonData}
                  bounds={bounds}
                  randomPoints={isNewOrleans ? newOrleansPoints : undefined}
                />
              </div>
            </div>

            <div className="w-[60%] overflow-auto">
              <EventAlertCards />
            </div>
          </div>
        </div>
      </Main>
    </div>
  );
};

export default Dashboard;
