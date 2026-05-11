// utils/timeUtils.ts
import { DEFAULT_TIMEZONE, TIMEZONE_STORAGE_KEY } from '@/constants/timezone';

const getPersistedTimezone = (): string | null => {
  try {
    const rawValue = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue) as { iana?: string };
    return parsedValue.iana ?? null;
  } catch {
    return null;
  }
};

/**
 * Format backend UTC timestamps for display in UTC.
 * @param utcTime - UTC time string from backend
 * @param format - Optional format type
 * @returns Formatted UTC time string
 */
export const convertUTCToLocal = (
  utcTime: string | Date,
  format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'full',
  locale: string = 'en-US'
): string => {
  if (!utcTime) return '';

  const date = new Date(utcTime);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', utcTime);
    return '';
  }

  const timezone = getUserTimezone();

  switch (format) {
    case 'full':
      // Full date and time: "Oct 8, 2025, 10:30:45 AM"
      return date.toLocaleString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

    case 'date':
      // Date only: "Oct 8, 2025"
      return date.toLocaleDateString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'time':
      // Time only: "10:30 AM"
      return date.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    case 'datetime':
      // Date and time without seconds: "Oct 8, 2025, 10:30 AM"
      return date.toLocaleString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    case 'relative':
      // Relative time: "2 hours ago", "just now", etc.
      return getRelativeTime(date);

    default:
      return date.toLocaleString(locale, { timeZone: timezone });
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time for specific use cases
 */
export const formatTime = {
  // For displaying in cards/lists: "Oct 8, 10:30 AM"
  card: (utcTime: string | Date) => convertUTCToLocal(utcTime, 'datetime'),

  // For displaying full timestamps: "Oct 8, 2025, 10:30:45 AM"
  full: (utcTime: string | Date) => convertUTCToLocal(utcTime, 'full'),

  // For displaying just the date: "Oct 8, 2025"
  date: (utcTime: string | Date) => convertUTCToLocal(utcTime, 'date'),

  // For displaying just the time: "10:30 AM"
  time: (utcTime: string | Date) => convertUTCToLocal(utcTime, 'time'),

  // For displaying relative time: "2 hours ago"
  relative: (utcTime: string | Date) => convertUTCToLocal(utcTime, 'relative'),
};

/**
 * Format video offset (in seconds) to mm:ss or hh:mm:ss format
 * Used for chunkStartTime and chunkEndTime from API (video offsets, not UTC timestamps)
 * @param seconds - Video offset in seconds
 * @returns Formatted time string (mm:ss for < 1 hour, hh:mm:ss for >= 1 hour)
 */
export const formatVideoOffset = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num: number): string => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
};

/**
 * Get user's timezone
 */
export const getUserTimezone = (): string => {
  return (
    getPersistedTimezone() ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    DEFAULT_TIMEZONE.iana
  );
};

/**
 * Convert UTC to specific timezone
 */
export const convertToTimezone = (
  utcTime: string | Date,
  timezone: string = getUserTimezone(),
  locale: string = 'en-US'
): string => {
  const date = new Date(utcTime);
  return date.toLocaleString(locale, {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format time in a specific timezone with custom format
 * @param utcTime - UTC time string or Date object
 * @param timezone - IANA timezone string (e.g., 'UTC', 'Asia/Kolkata')
 * @param format - Format type: 'datetime', 'time', 'date', 'full', 'relative'
 * @returns Formatted time string in the specified timezone
 */
export const formatTimeInTimezone = (
  utcTime: string | Date,
  timezone: string = getUserTimezone(),
  format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'datetime',
  locale: string = 'en-US'
): string => {
  if (!utcTime) return '';

  const date = new Date(utcTime);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', utcTime);
    return '';
  }

  switch (format) {
    case 'full':
      // Full date and time: "Oct 8, 2025, 10:30:45 AM"
      return date.toLocaleString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

    case 'date':
      // Date only: "Oct 8, 2025"
      return date.toLocaleDateString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    case 'time':
      // Time only: "10:30 AM"
      return date.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    case 'datetime':
      // Date and time without seconds: "Oct 8, 2025, 10:30 AM"
      return date.toLocaleString(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    case 'relative':
      // Relative time: "2 hours ago", "just now", etc.
      return getRelativeTime(date);

    default:
      return date.toLocaleString('en-US', { timeZone: timezone });
  }
};

/**
 * Format time for notification cards with timezone
 * @param utcTime - UTC time string or Date object
 * @param timezone - IANA timezone string (e.g., 'UTC', 'Asia/Kolkata')
 * @returns Formatted time string in the specified timezone
 */
export const formatTimeCard = (
  utcTime: string | Date,
  timezone: string
): string => {
  return formatTimeInTimezone(utcTime, timezone, 'datetime');
};

/**
 * Format timestamp with UTC offset for enhanced display
 * @param utcTime - UTC time string or Date object
 * @param timezone - IANA timezone string
 * @param format - Format type
 * @returns Formatted time with offset, e.g., "10:30 AM (UTC+5:30)"
 */
export const formatTimeWithOffset = (
  utcTime: string | Date,
  timezone: string = getUserTimezone(),
  format: 'time' | 'datetime' | 'full' = 'datetime'
): string => {
  const formatted = formatTimeInTimezone(utcTime, timezone, format);
  const offset = getUTCOffsetString(new Date(utcTime), timezone);

  return `${formatted} (${offset})`;
};

/**
 * Calculate UTC offset string for display
 * Accounts for DST transitions
 * @param date - Date object
 * @param timezone - IANA timezone string
 * @returns UTC offset string, e.g., "UTC+5:30" or "UTC-8"
 */
export const getUTCOffsetString = (date: Date, timezone: string): string => {
  try {
    // Get UTC time string
    const utcString = date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Get local time string in target timezone
    const localString = date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the times
    const utcParts = utcString.split(',')[1]?.trim().split(':') || ['00', '00'];
    const localParts = localString.split(',')[1]?.trim().split(':') || [
      '00',
      '00',
    ];

    const utcHour = parseInt(utcParts[0], 10);
    const localHour = parseInt(localParts[0], 10);

    let offsetHours = localHour - utcHour;
    if (offsetHours > 12) offsetHours -= 24;
    if (offsetHours < -12) offsetHours += 24;

    const offsetMinutes =
      parseInt(localParts[1], 10) - parseInt(utcParts[1], 10);

    const sign = offsetHours >= 0 ? '+' : '';
    const minuteStr =
      offsetMinutes === 0
        ? ''
        : `:${Math.abs(offsetMinutes).toString().padStart(2, '0')}`;

    return `UTC${sign}${offsetHours}${minuteStr}`;
  } catch {
    return 'UTC';
  }
};

/**
 * Get timezone-aware time for tooltip display
 * Shows full timezone information
 * @param utcTime - UTC time string or Date object
 * @param timezone - IANA timezone string
 * @returns Tooltip text with full timezone info
 */
export const getTimezoneTooltip = (
  utcTime: string | Date,
  timezone: string
): string => {
  const formatted = formatTimeInTimezone(utcTime, timezone, 'full');
  const offset = getUTCOffsetString(new Date(utcTime), timezone);

  return `${formatted}\n${offset} - ${timezone}`;
};
