import { useState, useEffect, useMemo } from 'react';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchDetentionDashboard,
  setSelectedZone,
} from '@/store/slices/detention-panel-slice';
import { Button } from '@/components/ui/button';

interface InmateZoneData {
  zone: string;
  current: number;
  delta: number;
  status: string;
}

export default function DetentionPanel() {
  const dispatch = useAppDispatch();
  const {
    data,
    loading,
    error,
    selectedFacility,
    selectedZone,
    lastFetchTimestamp,
  } = useAppSelector((state) => state.detentionPanel);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateText, setLastUpdateText] = useState('Never');

  useEffect(() => {
    dispatch(fetchDetentionDashboard(selectedFacility));
  }, [dispatch, selectedFacility]);

  // Update last update text every second
  useEffect(() => {
    const updateLastUpdateText = () => {
      if (!lastFetchTimestamp) {
        setLastUpdateText('Never');
        return;
      }
      const seconds = Math.floor((Date.now() - lastFetchTimestamp) / 1000);
      if (seconds < 60) {
        setLastUpdateText(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setLastUpdateText(`${minutes}m ago`);
      }
    };

    updateLastUpdateText();
    const interval = setInterval(updateLastUpdateText, 1000);
    return () => clearInterval(interval);
  }, [lastFetchTimestamp]);

  useEffect(() => {
    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await dispatch(fetchDetentionDashboard(selectedFacility));
      setIsRefreshing(false);
    }, 60000); // Auto-refresh every 1 minute (60 seconds)

    return () => clearInterval(interval);
  }, [dispatch, selectedFacility]);

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
      time: formatTimeInTimezone(currentTime, getUserTimezone(), 'time'),
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchDetentionDashboard(selectedFacility));
    setIsRefreshing(false);
  };

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

  if (error) {
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
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 max-w-md">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
                <p className="text-muted-foreground text-center">{error}</p>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            </Card>
          </div>
        </Main>
      </div>
    );
  }

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
              <Shield className="h-8 w-8 text-primary" />
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
              <div className="text-right">
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
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Popover>
                <PopoverTrigger asChild></PopoverTrigger>
                <VarianceAlertsPanel activeAlerts={activeAlerts} />
              </Popover>
              <div>
                <p className="text-sm text-muted-foreground">Current Time</p>
                <p className="text-xl font-mono font-bold">
                  {formatTimeInTimezone(currentTime, getUserTimezone(), 'time')}
                </p>
              </div>
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
                setSelectedZone={(zone) => {
                  if (typeof zone === 'function') {
                    // Handle function updates
                    const newZone = zone(selectedZone);
                    dispatch(setSelectedZone(newZone));
                  } else {
                    // Handle direct value updates
                    dispatch(setSelectedZone(zone));
                  }
                }}
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
