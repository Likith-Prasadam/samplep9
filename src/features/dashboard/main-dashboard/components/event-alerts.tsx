import { AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface EventDetails {
  congestionLevel: string;
  accidentOccurred: string;
  weatherCondition: string;
  vehicleTypes: string;
  accidentType: string;
}

interface EventAlert {
  id: string;
  eventId: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  description: string;
  details: EventDetails;
}

interface EventAlertCardsProps {
  events?: EventAlert[];
  onViewAll?: () => void;
}

const EventAlertCard = ({ event }: { event: EventAlert }) => {
  const severityConfig = {
    critical: {
      borderColor: 'border-l-red-500',
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      barColor: 'bg-red-500',
    },
    warning: {
      borderColor: 'border-l-yellow-500',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      barColor: 'bg-yellow-500',
    },
    info: {
      borderColor: 'border-l-blue-500',
      icon: CheckCircle,
      iconColor: 'text-blue-600 dark:text-blue-400',
      barColor: 'bg-blue-500',
    },
  };

  const config = severityConfig[event.severity];
  const Icon = config.icon;

  const getValueColor = (value: string) => {
    const lowerValue = value.toLowerCase();
    if (
      lowerValue === 'yes' ||
      lowerValue === 'present' ||
      lowerValue === 'collision'
    ) {
      return 'text-red-600 dark:text-red-400';
    }
    if (lowerValue === 'no' || lowerValue === 'not present') {
      return 'text-green-600 dark:text-green-400';
    }
    if (lowerValue === 'sunny' || lowerValue === 'clear') {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-gray-600 dark:text-gray-300';
  };

  // Generate severity bars
  const getSeverityBars = (level: string) => {
    const levels = ['low', 'moderate', 'high', 'severe'];
    const currentLevel = level.toLowerCase();
    const activeCount = levels.indexOf(currentLevel) + 1;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1.5 h-3 rounded-sm ${
              bar <= activeCount
                ? config.barColor
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 border-l-4 ${config.borderColor} rounded-lg p-4 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <Icon className={config.iconColor} size={16} />
          <div className="flex-1">
            <h3 className="text-gray-900 dark:text-white font-semibold text-sm">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {event.timestamp}
              </span>
              <span>ID: {event.eventId}</span>
            </div>
          </div>
        </div>
        {getSeverityBars(event.details.congestionLevel)}
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed mb-3">
        {event.description}
      </p>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-x-4 text-xs">
        <div className="flex items-start">
          <span className="text-gray-400 dark:text-gray-600 mr-1.5">•</span>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Accident: </span>
            <span className={getValueColor(event.details.accidentOccurred)}>
              {event.details.accidentOccurred}
            </span>
          </div>
        </div>

        <div className="flex items-start">
          <span className="text-gray-400 dark:text-gray-600 mr-1.5">•</span>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Weather: </span>
            <span className={getValueColor(event.details.weatherCondition)}>
              {event.details.weatherCondition}
            </span>
          </div>
        </div>

        <div className="flex items-start">
          <span className="text-gray-400 dark:text-gray-600 mr-1.5">•</span>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Vehicles: </span>
            <span className="text-gray-600 dark:text-gray-300">
              {event.details.vehicleTypes}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const EventAlertCards = ({ events, onViewAll }: EventAlertCardsProps) => {
  const defaultEvents: EventAlert[] = [
    {
      id: '1',
      eventId: '7C2-21',
      title: 'Accident Detected',
      severity: 'critical',
      timestamp: '20:32',
      description:
        'Two vehicles collided in the northbound lane. No VRUs were involved. The blockage is causing moderate congestion.',
      details: {
        congestionLevel: 'Moderate',
        accidentOccurred: 'Yes',
        weatherCondition: 'Sunny',
        vehicleTypes: 'Car, Bus',
        accidentType: 'Collision',
      },
    },
    {
      id: '2',
      eventId: '8D3-45',
      title: 'Heavy Traffic Alert',
      severity: 'warning',
      timestamp: '19:15',
      description:
        'High traffic density detected on the southbound route. Multiple vehicles experiencing delays.',
      details: {
        congestionLevel: 'High',
        accidentOccurred: 'No',
        weatherCondition: 'Clear',
        vehicleTypes: 'Car, Bike',
        accidentType: 'Not Present',
      },
    },
    {
      id: '3',
      eventId: '5A1-12',
      title: 'Emergency Vehicle',
      severity: 'warning',
      timestamp: '18:45',
      description:
        'Ambulance approaching intersection. Priority signal control activated.',
      details: {
        congestionLevel: 'Low',
        accidentOccurred: 'No',
        weatherCondition: 'Sunny',
        vehicleTypes: 'Ambulance',
        accidentType: 'Not Present',
      },
    },
    {
      id: '4',
      eventId: '9E4-67',
      title: 'Road Maintenance',
      severity: 'info',
      timestamp: '17:30',
      description:
        'Scheduled maintenance work in progress. One lane temporarily closed.',
      details: {
        congestionLevel: 'Low',
        accidentOccurred: 'No',
        weatherCondition: 'Clear',
        vehicleTypes: 'Truck',
        accidentType: 'Not Present',
      },
    },
    {
      id: '5',
      eventId: '3B2-89',
      title: 'Pedestrian Crossing',
      severity: 'info',
      timestamp: '16:55',
      description:
        'High pedestrian activity detected at crosswalk. Extended crossing time activated.',
      details: {
        congestionLevel: 'Low',
        accidentOccurred: 'No',
        weatherCondition: 'Sunny',
        vehicleTypes: 'Car',
        accidentType: 'Not Present',
      },
    },
    {
      id: '6',
      eventId: '6C7-34',
      title: 'Vehicle Breakdown',
      severity: 'warning',
      timestamp: '15:20',
      description:
        'Disabled vehicle on eastbound lane. Tow truck has been dispatched.',
      details: {
        congestionLevel: 'Moderate',
        accidentOccurred: 'No',
        weatherCondition: 'Clear',
        vehicleTypes: 'Car',
        accidentType: 'Not Present',
      },
    },
  ];

  const displayEvents = events || defaultEvents;
  const visibleEvents = displayEvents.slice(0, 6);
  const hasMore = displayEvents.length > 6;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Events
          </h2>
          <p className="text-gray-600 dark:text-gray-500 text-sm">
            Real-time traffic events and alerts
          </p>
        </div>
        {hasMore && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-all duration-200"
          >
            View All ({displayEvents.length})
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {visibleEvents.map((event) => (
          <EventAlertCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventAlertCards;
