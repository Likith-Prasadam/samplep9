import { Car, Bus, Truck, Bike, TrendingUp } from 'lucide-react';

interface StatData {
  count: number;
  trend: 'up' | 'down';
  trendValue: number;
}

interface StatsData {
  cars: StatData;
  buses: StatData;
  trucks: StatData;
  bikes: StatData;
  totalVehicles: StatData;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
}

const StatCard = ({
  title,
  count,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: StatCardProps) => {
  const leftBorderClasses = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
    red: 'border-l-red-500',
    cyan: 'border-l-cyan-500',
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 border-l-4 ${leftBorderClasses[color]} rounded-lg p-4 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {count.toLocaleString()}
          </h3>
          {trend && trendValue !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              <TrendingUp
                size={14}
                className={trend === 'down' ? 'rotate-180' : ''}
              />
              <span>{trendValue}% vs last week</span>
            </div>
          )}
        </div>
        <div
          className={`${iconColorClasses[color]} bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

interface VehicleStatsCardsProps {
  stats?: StatsData;
  showTotalHeader?: boolean;
}

const VehicleStatsCards = ({
  stats,
  showTotalHeader = true,
}: VehicleStatsCardsProps) => {
  // Default stats if none provided
  const defaultStats: StatsData = {
    cars: { count: 1234, trend: 'up', trendValue: 12.5 },
    buses: { count: 456, trend: 'up', trendValue: 8.3 },
    trucks: { count: 789, trend: 'down', trendValue: 3.2 },
    bikes: { count: 2345, trend: 'up', trendValue: 15.7 },
    totalVehicles: { count: 4824, trend: 'up', trendValue: 10.2 },
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="w-full h-full overflow-y-auto">
      {showTotalHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Total Vehicles:{' '}
            <span className="text-purple-600 dark:text-purple-400">
              {displayStats.totalVehicles.count.toLocaleString()}
            </span>
          </h2>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Cars"
          count={displayStats.cars.count}
          icon={Car}
          trend={displayStats.cars.trend}
          trendValue={displayStats.cars.trendValue}
          color="blue"
        />

        <StatCard
          title="Buses"
          count={displayStats.buses.count}
          icon={Bus}
          trend={displayStats.buses.trend}
          trendValue={displayStats.buses.trendValue}
          color="green"
        />

        <StatCard
          title="Trucks"
          count={displayStats.trucks.count}
          icon={Truck}
          trend={displayStats.trucks.trend}
          trendValue={displayStats.trucks.trendValue}
          color="orange"
        />

        <StatCard
          title="Bikes"
          count={displayStats.bikes.count}
          icon={Bike}
          trend={displayStats.bikes.trend}
          trendValue={displayStats.bikes.trendValue}
          color="red"
        />
      </div>
    </div>
  );
};

export default VehicleStatsCards;
