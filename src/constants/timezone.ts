export type TimezoneOption = {
  value: string;
  label: string;
  iana: string;
  city: string;
};

export const TIMEZONE_STORAGE_KEY = 'selectedTimezone';

/**
 * All 38 timezones in the world ordered chronologically (by UTC offset)
 * Includes standard 24 + 11 half/quarter-hour offsets + 3 bonus zones
 */
export const AVAILABLE_TIMEZONES: readonly TimezoneOption[] = [
  // Western Pacific - Negative Offsets
  {
    value: 'UTC-12',
    label: 'UTC-12 (-12:00)',
    iana: 'Etc/GMT+12',
    city: 'Baker Island',
  },
  {
    value: 'HST',
    label: 'HST (-10:00)',
    iana: 'US/Hawaii',
    city: 'Honolulu, Hawaii',
  },
  {
    value: 'AKST',
    label: 'AKST (-09:00)',
    iana: 'US/Alaska',
    city: 'Anchorage, Alaska',
  },
  {
    value: 'PST',
    label: 'PST (-08:00)',
    iana: 'US/Pacific',
    city: 'Los Angeles, Vancouver',
  },
  {
    value: 'MST',
    label: 'MST (-07:00)',
    iana: 'US/Mountain',
    city: 'Denver, Phoenix',
  },
  {
    value: 'CST',
    label: 'CST (-06:00)',
    iana: 'US/Central',
    city: 'Chicago, Mexico City',
  },
  {
    value: 'EST',
    label: 'EST (-05:00)',
    iana: 'US/Eastern',
    city: 'New York, Toronto',
  },
  {
    value: 'NST',
    label: 'NST (-03:30)',
    iana: 'Canada/Newfoundland',
    city: "St. John's, Newfoundland",
  },
  {
    value: 'ART',
    label: 'ART (-03:00)',
    iana: 'America/Argentina/Buenos_Aires',
    city: 'Buenos Aires',
  },
  {
    value: 'BRT',
    label: 'BRT (-03:00)',
    iana: 'America/Sao_Paulo',
    city: 'São Paulo, Brasília',
  },
  {
    value: 'CVT',
    label: 'CVT (-01:00)',
    iana: 'Atlantic/Cape_Verde',
    city: 'Praia, Cabo Verde',
  },

  // Prime Meridian
  {
    value: 'UTC',
    label: 'UTC (±00:00)',
    iana: 'UTC',
    city: 'Coordinated Universal Time',
  },
  {
    value: 'GMT',
    label: 'GMT (±00:00)',
    iana: 'Europe/London',
    city: 'London, Dublin',
  },

  // Europe & Africa - Positive Offsets
  {
    value: 'CET',
    label: 'CET (+01:00)',
    iana: 'Europe/Paris',
    city: 'Paris, Berlin, Rome',
  },
  {
    value: 'WAT',
    label: 'WAT (+01:00)',
    iana: 'Africa/Lagos',
    city: 'Lagos, Kinshasa',
  },
  {
    value: 'EET',
    label: 'EET (+02:00)',
    iana: 'Africa/Cairo',
    city: 'Cairo, Athens, Helsinki',
  },
  {
    value: 'CAT',
    label: 'CAT (+02:00)',
    iana: 'Africa/Johannesburg',
    city: 'Johannesburg, Harare',
  },
  {
    value: 'EAT',
    label: 'EAT (+03:00)',
    iana: 'Africa/Nairobi',
    city: 'Nairobi, Addis Ababa',
  },
  {
    value: 'MSK',
    label: 'MSK (+03:00)',
    iana: 'Europe/Moscow',
    city: 'Moscow, St. Petersburg',
  },
  {
    value: 'IRST',
    label: 'IRST (+03:30)',
    iana: 'Asia/Tehran',
    city: 'Tehran, Iran',
  },
  {
    value: 'GST',
    label: 'GST (+04:00)',
    iana: 'Asia/Dubai',
    city: 'Dubai, Abu Dhabi',
  },
  {
    value: 'AFT',
    label: 'AFT (+04:30)',
    iana: 'Asia/Kabul',
    city: 'Kabul, Afghanistan',
  },
  {
    value: 'PKT',
    label: 'PKT (+05:00)',
    iana: 'Asia/Karachi',
    city: 'Karachi, Islamabad',
  },
  {
    value: 'IST',
    label: 'IST (+05:30)',
    iana: 'Asia/Kolkata',
    city: 'Mumbai, New Delhi',
  },
  {
    value: 'NPT',
    label: 'NPT (+05:45)',
    iana: 'Asia/Kathmandu',
    city: 'Kathmandu, Nepal',
  },
  {
    value: 'BDT',
    label: 'BDT (+06:00)',
    iana: 'Asia/Dhaka',
    city: 'Dhaka, Colombo',
  },
  {
    value: 'CCT',
    label: 'CCT (+06:30)',
    iana: 'Asia/Yangon',
    city: 'Yangon, Myanmar',
  },
  {
    value: 'ICT',
    label: 'ICT (+07:00)',
    iana: 'Asia/Bangkok',
    city: 'Bangkok, Hanoi, Jakarta',
  },
  {
    value: 'AWST',
    label: 'AWST (+08:00)',
    iana: 'Australia/Perth',
    city: 'Perth, Australia',
  },
  {
    value: 'SGT',
    label: 'SGT (+08:00)',
    iana: 'Asia/Singapore',
    city: 'Singapore, Hong Kong, Beijing',
  },
  {
    value: 'ACWST',
    label: 'ACWST (+08:45)',
    iana: 'Australia/Eucla',
    city: 'Eucla, Australia',
  },
  {
    value: 'JST',
    label: 'JST (+09:00)',
    iana: 'Asia/Tokyo',
    city: 'Tokyo, Seoul, Osaka',
  },
  {
    value: 'ACST',
    label: 'ACST (+09:30)',
    iana: 'Australia/Adelaide',
    city: 'Adelaide, Darwin',
  },
  {
    value: 'AEST',
    label: 'AEST (+10:00)',
    iana: 'Australia/Sydney',
    city: 'Sydney, Melbourne, Brisbane',
  },
  {
    value: 'ACST2',
    label: 'ACST (+10:30)',
    iana: 'Australia/Broken_Hill',
    city: 'Broken Hill, South Australia',
  },
  {
    value: 'AEDT',
    label: 'AEDT (+11:00)',
    iana: 'Pacific/Guadalcanal',
    city: 'Honiara, Solomon Islands',
  },
  {
    value: 'NZST',
    label: 'NZST (+12:00)',
    iana: 'Pacific/Auckland',
    city: 'Auckland, Wellington',
  },
  {
    value: 'CHAT',
    label: 'CHAT (+12:45)',
    iana: 'Pacific/Chatham',
    city: 'Chatham Islands, NZ',
  },
  {
    value: 'NZDT',
    label: 'NZDT (+13:00)',
    iana: 'Pacific/Tongatapu',
    city: "Nuku'alofa, Tonga",
  },
  {
    value: 'LINT',
    label: 'LINT (+14:00)',
    iana: 'Pacific/Kiritimati',
    city: 'Kiritimati, Kiribati',
  },
];

export const DEFAULT_TIMEZONE = AVAILABLE_TIMEZONES[0];

/**
 * Find timezone by IANA identifier
 */
export const findTimezoneByIana = (iana: string): TimezoneOption | undefined =>
  AVAILABLE_TIMEZONES.find((timezone) => timezone.iana === iana);

/**
 * Filter timezones by search term
 */
export const filterTimezones = (
  timezones: readonly TimezoneOption[],
  searchTerm: string
): TimezoneOption[] => {
  if (!searchTerm.trim()) return Array.from(timezones);

  const term = searchTerm.toLowerCase();
  return Array.from(timezones).filter((tz) => {
    return (
      tz.label.toLowerCase().includes(term) ||
      tz.value.toLowerCase().includes(term) ||
      tz.iana.toLowerCase().includes(term) ||
      tz.city.toLowerCase().includes(term)
    );
  });
};
