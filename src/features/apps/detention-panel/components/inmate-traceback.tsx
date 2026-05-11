import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
  type TooltipProps,
} from 'recharts';
import TimelineBrush from './timeline-brush';

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const labels: Record<string, string> = {
    dining: 'Dining Hall',
    yard: 'Yard',
    total: 'Total Count',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Time: {label}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 dark:text-gray-400">
            {labels[entry.dataKey] || entry.dataKey}:
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface DataPoint {
  time: string;
  dining?: number;
  yard?: number;
  total: number;
  index: number;
}

interface Event {
  index: number;
  time: string;
  type: 'deficit_start' | 'deficit_end';
  message: string;
  severity: 'high' | 'medium';
}

type Zone = 'all' | 'dining' | 'yard';

const generateTimelineData = (): DataPoint[] => {
  const data: DataPoint[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 2; m++) {
      const time = `${h.toString().padStart(2, '0')}:${(m * 30).toString().padStart(2, '0')}`;
      const base = 900;
      const variance = Math.random() * 100 - 50;
      const dip = Math.random() < 0.1;
      const total = dip ? base - Math.random() * 200 : base + variance;
      const dining = Math.floor(total * (0.4 + Math.random() * 0.2));
      const yard = total - dining;
      data.push({
        time,
        dining: Math.max(0, dining),
        yard: Math.max(0, yard),
        total: Math.max(0, Math.floor(total)),
        index: data.length,
      });
    }
  }
  return data;
};

const generateEvents = (data: DataPoint[]): Event[] => {
  const events: Event[] = [];
  let inDeficit = false;
  data.forEach((p, i) => {
    if (p.total < 900 && !inDeficit) {
      inDeficit = true;
      events.push({
        index: i,
        time: p.time,
        type: 'deficit_start',
        message: `Count dropped below expected (${p.total}/900)`,
        severity: 'high',
      });
    } else if (p.total >= 900 && inDeficit) {
      inDeficit = false;
      events.push({
        index: i,
        time: p.time,
        type: 'deficit_end',
        message: `Count restored (${p.total}/900)`,
        severity: 'medium',
      });
    }
  });
  return events;
};

export default function InmateTracebackViewer() {
  const [zone, setZone] = useState<Zone>('all');
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(47);

  const fullData = useMemo(generateTimelineData, []);
  const events = useMemo(() => generateEvents(fullData), [fullData]);

  const filteredData = useMemo(() => {
    const sliced = fullData.slice(start, end + 1);
    return zone === 'all'
      ? sliced
      : sliced.map((d) => ({
          time: d.time,
          [zone]: d[zone as keyof DataPoint],
          index: d.index,
        }));
  }, [zone, start, end, fullData]);

  const handleRangeChange = (newStart: number, newEnd: number) => {
    setStart(newStart);
    setEnd(newEnd);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Inmate Traceback Viewer
          </CardTitle>
          <Select onValueChange={(v: Zone) => setZone(v)} defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="dining">Dining Hall</SelectItem>
              <SelectItem value="yard">Yard</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <div className="h-96 pb-6 pt-2 px-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ right: 40, left: 20 }}>
              <CartesianGrid
                strokeDasharray="5 5"
                stroke="#e5e7eb"
                className="dark:stroke-gray-700"
              />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <YAxis
                domain={[0, 1000]}
                ticks={[0, 200, 400, 600, 800, 1000]}
                stroke="#6b7280"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    dining: 'Dining Hall',
                    yard: 'Yard',
                    total: 'Total Count',
                  };
                  return (
                    <span style={{ color: 'hsl(var(--foreground))' }}>
                      {labels[value] || value}
                    </span>
                  );
                }}
              />
              {zone === 'all' && (
                <ReferenceLine
                  y={900}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Expected (900)',
                    fontSize: 11,
                    fill: '#ef4444',
                  }}
                />
              )}
              {(zone === 'dining' || zone === 'all') && (
                <Line
                  type="monotone"
                  dataKey="dining"
                  name="dining"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#3b82f6',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}
              {(zone === 'yard' || zone === 'all') && (
                <Line
                  type="monotone"
                  dataKey="yard"
                  name="yard"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#22c55e',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}
              {zone === 'all' && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name="total"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: '#8b5cf6',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <TimelineBrush
        data={fullData}
        events={events}
        onRangeChange={handleRangeChange}
        height={50}
      />
    </div>
  );
}
