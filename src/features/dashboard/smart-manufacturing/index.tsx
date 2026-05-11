import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertTriangle,
  CameraOff,
  Bell,
  HardHat,
  Camera,
  Video,
  Truck,
} from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState, useMemo } from 'react';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import { useQuery } from '@apollo/client';
import {
  GET_MANUFACTURING_RECORDS,
  GET_MANUFACTURING_WEEKLY_TIMELINE,
} from '@/graphql/manufacturing_queries';

const notifications = [
  {
    icon: CameraOff,
    text: 'Camera 10 offline',
    time: 'Recent ahead 4 hours ago',
  },
  {
    icon: AlertTriangle,
    text: 'High violation rate detected',
    time: 'Recent ahead 3 hours ago',
  },
  {
    icon: CameraOff,
    text: 'Camera 10 offline',
    time: 'Recent ahead 3 hours ago',
  },
  {
    icon: AlertTriangle,
    text: 'High violation rate detected',
    time: 'Recent ahead 3 hours ago',
  },
];

function ManufacturingData() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [camId] = useState(10);
  const [startDate, setStartDate] = useState('2025-12-23');
  const [endDate, setEndDate] = useState('2025-12-24');

  const {
    data: recordsData,
    loading: recordsLoading,
    refetch: refetchRecords,
  } = useQuery(GET_MANUFACTURING_RECORDS, {
    variables: {
      cam_id: camId,
      start_date: startDate,
      end_date: endDate,
    },
  });

  const { data: timelineData, loading: timelineLoading } = useQuery(
    GET_MANUFACTURING_WEEKLY_TIMELINE
  );

  const records = recordsData?.manufacturing?.records || [];

  const latestRecord = records[records.length - 1];
  const totalViolations = latestRecord?.total_missing || 0;

  const ppeViolationStats = useMemo(() => {
    if (!latestRecord) return [];

    const stats = [
      { name: 'Hard Hat Missing', count: latestRecord.hard_hat_missing || 0 },
      {
        name: 'Safety Vest Missing',
        count: latestRecord.safety_vest_missing || 0,
      },
      { name: 'Gloves Missing', count: latestRecord.gloves_missing || 0 },
      { name: 'Goggles Missing', count: latestRecord.goggles_missing || 0 },
      {
        name: 'Safety Shoes Missing',
        count: latestRecord.safety_shoes_missing || 0,
      },
    ];

    return stats.map((item) => ({
      ...item,
      percentage:
        totalViolations > 0
          ? Math.round((item.count / totalViolations) * 100)
          : 0,
    }));
  }, [latestRecord, totalViolations]);

  const vehicles = useMemo(() => {
    if (!latestRecord?.list_of_vehicles) return [];
    try {
      return Array.isArray(latestRecord.list_of_vehicles)
        ? latestRecord.list_of_vehicles
        : JSON.parse(latestRecord.list_of_vehicles);
    } catch {
      return [];
    }
  }, [latestRecord]);

  const trendData = useMemo(() => {
    const timeline = timelineData?.manufacturing?.timeline || [];
    return timeline.map(
      (item: {
        date: string;
        total_missing: number;
        hard_hat_missing: number;
        safety_vest_missing: number;
        gloves_missing: number;
        goggles_missing: number;
        safety_shoes_missing: number;
      }) => ({
        date: formatTimeInTimezone(
          item.date,
          getUserTimezone(),
          'date',
          'en-GB'
        ),
        total: item.total_missing || 0,
        hardHat: item.hard_hat_missing || 0,
        safetyVest: item.safety_vest_missing || 0,
        gloves: item.gloves_missing || 0,
        goggles: item.goggles_missing || 0,
        safetyShoes: item.safety_shoes_missing || 0,
      })
    );
  }, [timelineData]);

  const handleApplyFilters = () => {
    refetchRecords();
  };

  return (
    <div className="flex flex-col h-screen">
      <Header fixed>
        <SearchField />
        <div className="ml-auto flex items-center gap-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Smart Manufacturing
              </h2>
              <p className="text-muted-foreground">
                Monitor PPE violations and safety metrics
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
                <Button onClick={handleApplyFilters} disabled={recordsLoading}>
                  {recordsLoading ? 'Loading...' : 'Apply Filters'}
                </Button>
              </div>

              <Popover
                open={showNotifications}
                onOpenChange={setShowNotifications}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-96 bg-transparent backdrop-blur-xl border-border/50 p-0 shadow-lg"
                  align="end"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Notifications
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.map((notif, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-b-0"
                        >
                          <div className="bg-destructive/10 p-2 rounded-full">
                            <notif.icon className="w-5 h-5 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notif.text}</p>
                            <p className="text-xs text-muted-foreground">
                              {notif.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-destructive">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">78</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Alerts
                    </p>
                  </div>
                  <Bell className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">
                      {recordsLoading ? '...' : totalViolations}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total PPE Violations
                    </p>
                  </div>
                  <HardHat className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">24</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Cameras
                    </p>
                  </div>
                  <Camera className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xl font-bold">20</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Active Cameras
                    </p>
                  </div>
                  <Video className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>PPE Violations (Last 24 hrs)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recordsLoading ? (
                  <p className="text-muted-foreground">Loading violations...</p>
                ) : ppeViolationStats.length > 0 ? (
                  <>
                    {ppeViolationStats.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                          <span className="text-sm font-medium">
                            {item.count}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-red-400/70 h-3 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold">
                          Total Missing
                        </span>
                        <span className="text-2xl font-bold text-red-400/70">
                          {totalViolations}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No violation data available
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>List of Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <p className="text-muted-foreground">Loading vehicles...</p>
                ) : vehicles.length > 0 ? (
                  <div className="space-y-3">
                    {vehicles.map((vehicle: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Truck className="h-5 w-5" />
                          </div>

                          <span className="font-medium text-foreground">
                            {vehicle}
                          </span>
                        </div>

                        <span className="text-sm font-medium text-muted-foreground">
                          {String.fromCharCode(65 + i)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No vehicles detected</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Weekly Timeline Trend</span>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                    <span>Hard Hat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
                    <span>Safety Vest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                    <span>Gloves</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                    <span>Goggles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                    <span>Safety Shoes</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">
                    Loading timeline data...
                  </p>
                </div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 'auto']}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        padding: '8px 12px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />

                    <Line
                      type="monotone"
                      dataKey="hardHat"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Hard Hat"
                    />

                    <Line
                      type="monotone"
                      dataKey="safetyVest"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Safety Vest"
                    />

                    <Line
                      type="monotone"
                      dataKey="gloves"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Gloves"
                    />

                    <Line
                      type="monotone"
                      dataKey="goggles"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Goggles"
                    />

                    <Line
                      type="monotone"
                      dataKey="safetyShoes"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Safety Shoes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">
                    No timeline data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </div>
  );
}

export default ManufacturingData;
