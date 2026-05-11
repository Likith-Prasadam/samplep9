import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Activity } from 'lucide-react';
interface TrafficData {
  time: string;
  vehicles: number;
  cars: number;
  bikes: number;
  trucks: number;
  buses: number;
}

interface TrafficIntensityGraphProps {
  data?: TrafficData[];
}

const TrafficIntensityGraph = ({ data }: TrafficIntensityGraphProps) => {
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

  // Generate realistic traffic data for a full day (24 hours)
  const defaultData: TrafficData[] = [
    { time: '00:00', vehicles: 45, cars: 20, bikes: 15, trucks: 5, buses: 5 },
    { time: '01:00', vehicles: 30, cars: 15, bikes: 10, trucks: 3, buses: 2 },
    { time: '02:00', vehicles: 25, cars: 12, bikes: 8, trucks: 3, buses: 2 },
    { time: '03:00', vehicles: 20, cars: 10, bikes: 6, trucks: 2, buses: 2 },
    { time: '04:00', vehicles: 35, cars: 15, bikes: 12, trucks: 5, buses: 3 },
    { time: '05:00', vehicles: 85, cars: 35, bikes: 30, trucks: 12, buses: 8 },
    {
      time: '06:00',
      vehicles: 180,
      cars: 70,
      bikes: 65,
      trucks: 25,
      buses: 20,
    },
    {
      time: '07:00',
      vehicles: 320,
      cars: 125,
      bikes: 120,
      trucks: 40,
      buses: 35,
    },
    {
      time: '08:00',
      vehicles: 450,
      cars: 180,
      bikes: 160,
      trucks: 60,
      buses: 50,
    },
    {
      time: '09:00',
      vehicles: 520,
      cars: 210,
      bikes: 180,
      trucks: 70,
      buses: 60,
    },
    {
      time: '10:00',
      vehicles: 480,
      cars: 190,
      bikes: 170,
      trucks: 65,
      buses: 55,
    },
    {
      time: '11:00',
      vehicles: 420,
      cars: 165,
      bikes: 150,
      trucks: 55,
      buses: 50,
    },
    {
      time: '12:00',
      vehicles: 390,
      cars: 155,
      bikes: 140,
      trucks: 50,
      buses: 45,
    },
    {
      time: '13:00',
      vehicles: 380,
      cars: 150,
      bikes: 135,
      trucks: 50,
      buses: 45,
    },
    {
      time: '14:00',
      vehicles: 400,
      cars: 160,
      bikes: 145,
      trucks: 50,
      buses: 45,
    },
    {
      time: '15:00',
      vehicles: 440,
      cars: 175,
      bikes: 155,
      trucks: 55,
      buses: 55,
    },
    {
      time: '16:00',
      vehicles: 510,
      cars: 200,
      bikes: 180,
      trucks: 70,
      buses: 60,
    },
    {
      time: '17:00',
      vehicles: 580,
      cars: 230,
      bikes: 200,
      trucks: 80,
      buses: 70,
    },
    {
      time: '18:00',
      vehicles: 620,
      cars: 250,
      bikes: 215,
      trucks: 85,
      buses: 70,
    },
    {
      time: '19:00',
      vehicles: 550,
      cars: 220,
      bikes: 190,
      trucks: 75,
      buses: 65,
    },
    {
      time: '20:00',
      vehicles: 420,
      cars: 170,
      bikes: 145,
      trucks: 55,
      buses: 50,
    },
    {
      time: '21:00',
      vehicles: 280,
      cars: 115,
      bikes: 100,
      trucks: 35,
      buses: 30,
    },
    {
      time: '22:00',
      vehicles: 180,
      cars: 75,
      bikes: 65,
      trucks: 25,
      buses: 15,
    },
    { time: '23:00', vehicles: 95, cars: 40, bikes: 35, trucks: 12, buses: 8 },
  ];

  const displayData = data || defaultData;

  const gridStroke = isDark ? '#374151' : '#e5e7eb';
  const axisStroke = isDark ? '#9CA3AF' : '#6b7280';

  // Custom tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 dark:text-white font-semibold mb-2">
            {payload[0].payload.time}
          </p>
          <div className="space-y-1">
            <p className="text-purple-600 dark:text-purple-400 text-sm">
              Total: <span className="font-semibold">{payload[0].value}</span>{' '}
              vehicles
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-xs">
              Cars: {payload[0].payload.cars}
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs">
              Bikes: {payload[0].payload.bikes}
            </p>
            <p className="text-orange-600 dark:text-orange-400 text-xs">
              Trucks: {payload[0].payload.trucks}
            </p>
            <p className="text-green-600 dark:text-green-400 text-xs">
              Buses: {payload[0].payload.buses}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate peak traffic time
  const peakTraffic = displayData.reduce((max, curr) =>
    curr.vehicles > max.vehicles ? curr : max
  );

  return (
    <div className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 border-l-4 border-l-purple-500 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-lg">
            <Activity
              className="text-purple-600 dark:text-purple-400"
              size={24}
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Traffic Insights
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              24-hour vehicle flow analysis
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Peak Traffic
          </p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {peakTraffic.time}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {peakTraffic.vehicles} vehicles
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={displayData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="time"
            stroke={axisStroke}
            tick={{ fill: axisStroke, fontSize: 12 }}
            interval={2}
          />
          <YAxis
            stroke={axisStroke}
            tick={{ fill: axisStroke, fontSize: 12 }}
            label={{
              value: 'Vehicles',
              angle: -90,
              position: 'insideLeft',
              fill: axisStroke,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="vehicles"
            stroke="#a855f7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorVehicles)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Cars</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Bikes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Trucks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-500 dark:text-gray-400">Buses</span>
        </div>
      </div>
    </div>
  );
};

export default TrafficIntensityGraph;
