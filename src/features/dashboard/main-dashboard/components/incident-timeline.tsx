import { useEffect, useRef, useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import './timeline-custom.css';

interface TimelineEvent {
  id?: string;
  start_date: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
  };
  end_date?: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
  };
  text: {
    headline: string;
    text: string;
  };
  media?: {
    url: string;
    thumbnail?: string;
  };
  background?: {
    color?: string;
  };
}

interface TimelineData {
  title?: {
    text: {
      headline: string;
      text: string;
    };
  };
  events: TimelineEvent[];
}

export interface IncidentData {
  id: number;
  timestamp: string;
  title: string;
  description: string;
  detectionStatus?: 'detected' | 'not_detected';
  videoUrl?: string;
  thumbnailUrl?: string;
  severity?: 'critical' | 'warning' | 'info';
  startTime?: string;
  endTime?: string;
}

interface IncidentTimelineProps {
  incidents?: IncidentData[];
}

declare global {
  interface Window {
    TL?: {
      Timeline: new (
        container: string | HTMLElement,
        data: TimelineData,
        options?: Record<string, unknown>
      ) => void;
    };
  }
}

const IncidentTimeline = ({ incidents }: IncidentTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const timelineInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    const updateTheme = () => setIsDark(html.classList.contains('dark'));
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const defaultIncidents: IncidentData[] = [
    {
      id: 1,
      timestamp: '2026-02-18T20:32:00',
      title: 'Accident Detected',
      description:
        'Two vehicles collided in the northbound lane. No VRUs were involved. The blockage is causing moderate congestion.',
      detectionStatus: 'detected',
      severity: 'critical',
    },
    {
      id: 2,
      timestamp: '2026-02-18T19:15:00',
      title: 'Heavy Traffic Alert',
      description:
        'High traffic density detected on the southbound route. Multiple vehicles experiencing delays.',
      detectionStatus: 'detected',
      severity: 'warning',
    },
    {
      id: 3,
      timestamp: '2026-02-18T18:45:00',
      title: 'Emergency Vehicle',
      description:
        'Ambulance approaching intersection. Priority signal control activated.',
      detectionStatus: 'detected',
      severity: 'warning',
    },
    {
      id: 4,
      timestamp: '2026-02-18T17:30:00',
      title: 'Road Maintenance',
      description:
        'Scheduled maintenance work in progress. One lane temporarily closed.',
      detectionStatus: 'not_detected',
      severity: 'info',
    },
    {
      id: 5,
      timestamp: '2026-02-18T16:55:00',
      title: 'Pedestrian Crossing',
      description:
        'High pedestrian activity detected at crosswalk. Extended crossing time activated.',
      detectionStatus: 'not_detected',
      severity: 'info',
    },
    {
      id: 6,
      timestamp: '2026-02-18T15:20:00',
      title: 'Vehicle Breakdown',
      description:
        'Disabled vehicle on eastbound lane. Tow truck has been dispatched.',
      detectionStatus: 'detected',
      severity: 'warning',
    },
  ];

  const displayIncidents = incidents || defaultIncidents;

  const transformToTimelineData = useCallback(
    (incidentData: IncidentData[]): TimelineData => {
      const events: TimelineEvent[] = incidentData.map((incident) => {
        const date = new Date(incident.timestamp);

        const formattedDateTime = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const backgroundColor =
          incident.detectionStatus === 'detected'
            ? incident.severity === 'critical'
              ? isDark
                ? '#dc2626'
                : '#b91c1c'
              : incident.severity === 'warning'
                ? '#ffa850'
                : isDark
                  ? '#2563eb'
                  : '#1d4ed8'
            : isDark
              ? '#059669'
              : '#047857';

        return {
          id: incident.id.toString(),
          start_date: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
          },
          text: {
            headline: incident.title,
            text: `
            <p><strong>Date & Time:</strong> ${formattedDateTime}</p>
            <p>${incident.description}</p>
            ${
              incident.detectionStatus
                ? `<p class="text-sm mt-2"><strong>Status:</strong> ${
                    incident.detectionStatus === 'detected'
                      ? '🟠 Incident Detected'
                      : '🟢 No Incident'
                  }</p>`
                : ''
            }
          `,
          },
          background: {
            color: backgroundColor,
          },
        };
      });

      return {
        title: {
          text: {
            headline: 'Incident Timeline',
            text: 'Real-time incident detection and traffic events',
          },
        },
        events,
      };
    },
    [isDark]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadTimelineJS = async () => {
      try {
        if (window.TL) {
          setIsLoaded(true);
          return;
        }
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href =
          'https://cdn.knightlab.com/libs/timeline3/latest/css/timeline.css';
        document.head.appendChild(cssLink);

        const script = document.createElement('script');
        script.src =
          'https://cdn.knightlab.com/libs/timeline3/latest/js/timeline.js';
        script.async = true;

        script.onload = () => {
          setIsLoaded(true);
        };

        script.onerror = () => {
          setError('Failed to load TimelineJS library');
        };

        document.head.appendChild(script);

        return () => {
          document.head.removeChild(cssLink);
          document.head.removeChild(script);
        };
      } catch (err) {
        setError('Error loading TimelineJS');
        console.error('TimelineJS loading error:', err);
      }
    };

    loadTimelineJS();
  }, []);
  useEffect(() => {
    if (!isLoaded || !timelineRef.current || !window.TL) return;

    if (timelineInstanceRef.current) {
      timelineInstanceRef.current = null;

      if (timelineRef.current) {
        timelineRef.current.innerHTML = '';
      }
    }

    try {
      const timelineData = transformToTimelineData(displayIncidents);

      const options = {
        scale_factor: 1,
        initial_zoom: 2,
        timenav_position: 'bottom',
        duration: 500,
        ease: 'ease-in-out',
        start_at_end: false,
        hash_bookmark: false,
        default_bg_color: isDark
          ? { r: 31, g: 41, b: 55, a: 0.5 }
          : { r: 255, g: 255, b: 255, a: 1 },
        timenav_height: 150,
        timenav_height_percentage: 30,
        optimal_tick_width: 100,
      };

      timelineInstanceRef.current = new window.TL.Timeline(
        timelineRef.current,
        timelineData,
        options
      );
    } catch (err) {
      setError('Error initializing timeline');
      console.error('Timeline initialization error:', err);
    }
  }, [isLoaded, displayIncidents, isDark, transformToTimelineData]);

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden backdrop-blur-sm">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-500 dark:text-white">
              Incident Timeline
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Chronological view of traffic events and incidents
            </p>
          </div>
        </div>
      </div>

      {!isLoaded ? (
        <div className="h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading timeline...
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={timelineRef}
          className="timeline-container"
          style={{ height: '400px', width: '100%' }}
        ></div>
      )}
    </div>
  );
};

export default IncidentTimeline;
