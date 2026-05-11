import { useState, useEffect, useMemo } from 'react';
// import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  // Shield,
  Users,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  // RefreshCw,
} from 'lucide-react';
import InmateTracebackViewer from './components/inmate-traceback';
import ZoneCountsTable from './components/zone-counts-table';
import type { ZoneData } from './components/zone-counts-table';
import FacilityMap from './components/facility-map';
import type { Zone as FacilityZone } from './components/facility-map';
import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import type { VarianceAlert } from './components/variance-alerts';
import VarianceAlertsPanel from './components/variance-alerts';
import VarianceAlerts from './components/variance-alerts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

interface InmateZoneData {
  zone: string;
  current: number;
  delta: number;
  status: string;
}

// Hardcoded mock data
const MOCK_DETENTION_DATA = {
  count_accuracy: 98,
  variance_alerts: 2,
  total_inmates: 1019,
  zones_online: 4,
  zones: [
    {
      zone_name: 'Main Block A',
      actual: 401,
      expected: 401,
      variance: 0,
      variance_percent: 0,
      status: 'normal',
      timestamp: new Date().toISOString(),
    },
    {
      zone_name: 'Dining Hall',
      actual: 252,
      expected: 250,
      variance: 2,
      variance_percent: 0.8,
      status: 'warning',
      timestamp: new Date().toISOString(),
    },
    {
      zone_name: 'Medical Wing',
      actual: 66,
      expected: 61,
      variance: 5,
      variance_percent: 8.2,
      status: 'critical',
      timestamp: new Date().toISOString(),
    },
    {
      zone_name: 'Yard',
      actual: 300,
      expected: 299,
      variance: 1,
      variance_percent: 0.3,
      status: 'warning',
      timestamp: new Date().toISOString(),
    },
  ],
};

export default function DetentionPanel() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLastUpdateText] = useState('Using mock data');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedDashboard, setSelectedDashboard] = useState('detention');

  // Use hardcoded mock data
  const data = MOCK_DETENTION_DATA;
  const loading = false;

  // Update last update text every second
  useEffect(() => {
    const updateLastUpdateText = () => {
      setLastUpdateText('Using mock data');
    };

    updateLastUpdateText();
    const interval = setInterval(updateLastUpdateText, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalInmates = data?.total_inmates || 0;
  const countAccuracy = data?.count_accuracy || 0;
  const zonesOnline = data?.zones_online || 0;
  const totalZones = data?.zones?.length || 0;

  const zoneData: InmateZoneData[] = useMemo(() => {
    if (!data?.zones) return [];

    return data.zones.map((zone) => ({
      zone: zone.zone_name,
      current: zone.actual,
      delta: zone.variance,
      status:
        zone.status === 'normal'
          ? 'OK'
          : zone.status === 'critical'
            ? 'CRITICAL'
            : 'WARNING',
    }));
  }, [data]);

  const facilityZones: FacilityZone[] = useMemo(() => {
    if (!data?.zones) return [];

    const baseCoordinates = [
      { lat: 40.7128, lng: -74.006 },
      { lat: 40.7138, lng: -74.007 },
      { lat: 40.7118, lng: -74.005 },
      { lat: 40.7148, lng: -74.008 },
    ];

    return data.zones.map((zone, index) => ({
      name: zone.zone_name,
      lat: baseCoordinates[index % baseCoordinates.length].lat,
      lng: baseCoordinates[index % baseCoordinates.length].lng,
      current: zone.actual,
      expected: zone.expected,
      delta: zone.variance,
      status:
        zone.status === 'normal'
          ? 'OK'
          : zone.status === 'critical'
            ? 'CRITICAL'
            : 'WARNING',
    }));
  }, [data]);

  const zoneCountsTableData: ZoneData[] = useMemo(() => {
    if (!data?.zones) return [];

    return data.zones.map((zone) => ({
      zone: zone.zone_name,
      actual: zone.actual,
      expected: zone.expected,
      variance: zone.variance,
      variancePercent: zone.variance_percent,
      status:
        zone.status === 'normal'
          ? 'normal'
          : zone.status === 'critical'
            ? 'critical'
            : zone.variance_percent >= 5
              ? 'major'
              : 'minor',
    }));
  }, [data]);

  const activeAlerts: VarianceAlert[] = zoneData
    .filter((z) => z.status !== 'OK')
    .map((z) => ({
      time: currentTime.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      zone: z.zone,
      delta: Math.abs(z.delta),
      id: `${z.zone}-${currentTime.getTime()}`,
    }));

  const runningCount = zoneData.reduce((s, z) => s + z.current, 0);
  const varianceAlerts = activeAlerts.length;

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // const handleRefresh = async () => {
  //   setIsRefreshing(true);
  //   // Simulate refresh delay with mock data
  //   await new Promise((resolve) => setTimeout(resolve, 500));
  //   setIsRefreshing(false);
  // };

  const metrics = [
    { title: 'Total Inmates', value: totalInmates, icon: Users },
    { title: 'Variance Alerts', value: varianceAlerts, icon: AlertTriangle },
    { title: 'Count Accuracy', value: `${countAccuracy}%`, icon: Activity },
    {
      title: 'Zones Online',
      value: `${zonesOnline}/${totalZones}`,
      icon: zonesOnline === totalZones ? Wifi : WifiOff,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* <Shield className="h-8 w-8 text-primary" /> */}
              <div>
                <h1 className="text-2xl font-bold">
                  Detention Management Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Real-time inmate monitoring system
                </p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              {/* <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>{lastUpdateText}</span>
                  )}
                </p>
              </div> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button> */}
              <Popover>
                <PopoverTrigger asChild></PopoverTrigger>
                <VarianceAlertsPanel activeAlerts={activeAlerts} />
              </Popover>
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
              {/* <div>
                <p className="text-sm text-muted-foreground">Current Time</p>
                <p className="text-xl font-mono font-bold">
                  {formatTimeInTimezone(currentTime, getUserTimezone(), 'time')}
                </p>
              </div> */}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <Card key={i} className="p-3">
                <CardHeader className="flex flex-row items-center justify-between p-0 pb-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {m.title}
                  </CardTitle>
                  <m.icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent className="p-0 pt-0">
                  <div className="text-3xl font-bold leading-none">
                    {loading && !data ? (
                      <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      m.value
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Tabs defaultValue="traceback" className="w-full p-4">
            <TabsList className="inline-flex w-[450px] h-12 py-1 mb-4">
              <TabsTrigger value="traceback" className="h-10 px-4 text-base">
                Inmate Traceback
              </TabsTrigger>
              <TabsTrigger value="zonecounts" className="h-10 px-4 text-base">
                Zone Counts
              </TabsTrigger>
              <TabsTrigger value="map" className="h-10 px-4 text-base">
                Facility Map
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <TabsContent value="traceback">
              <InmateTracebackViewer />
            </TabsContent>

            <TabsContent value="zonecounts">
              <ZoneCountsTable
                zoneData={zoneCountsTableData}
                selectedZone={selectedZone}
                setSelectedZone={setSelectedZone}
                actualCount={totalInmates}
                runningCount={runningCount}
              />
            </TabsContent>
            <TabsContent value="alerts" className="mt-6">
              <VarianceAlerts activeAlerts={activeAlerts} />
            </TabsContent>
            <TabsContent value="map" className="mt-6">
              <FacilityMap zones={facilityZones} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </div>
  );
}
