import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  sub,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button-1';
import { Material } from '@/components/ui/material-1';
import { Input } from '@/components/ui/input-1';
import { Select } from '@/components/ui/select-1';
import { useTimezone } from '@/hooks/use-timezone';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { useClickOutside } from '@/components/ui/use-click-outside';
import clsx from 'clsx';
import { enUS } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

const ClockIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8.75 4.75V4H7.25V4.75V7.875C7.25 8.18976 7.39819 8.48615 7.65 8.675L9.55 10.1L10.15 10.55L11.05 9.35L10.45 8.9L8.75 7.625V4.75Z"
      className="fill-gray-1000"
    />
  </svg>
);

const ArrowBottomIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx('fill-gray-1000', className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
      className="fill-gray-700"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
      className="fill-gray-700"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 0.5V1.25V2H10.5V1.25V0.5H12V1.25V2H14H15.5V3.5V13.5C15.5 14.8807 14.3807 16 13 16H3C1.61929 16 0.5 14.8807 0.5 13.5V3.5V2H2H4V1.25V0.5H5.5ZM2 3.5H14V6H2V3.5ZM2 7.5V13.5C2 14.0523 2.44772 14.5 3 14.5H13C13.5523 14.5 14 14.0523 14 13.5V7.5H2Z"
    />
  </svg>
);

const ClearIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
    />
  </svg>
);

const parseRelativeDate = (input: string) => {
  const regex = /(\d+)\s*(day|week|month|year|hour)s?/i;
  const match = input.match(regex);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = `${match[2].toLowerCase()}s` as
    | 'days'
    | 'weeks'
    | 'months'
    | 'years'
    | 'hours';
  const now = new Date();
  const start = startOfDay(sub(now, { [unit]: value }));
  const end = endOfDay(now);
  return { [input]: { text: input, start, end } };
};

const parseExactDate = (input: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const dateFormats = ['d MMM yyyy', 'd MMM', 'yyyy-MM-dd'];
  for (const formatValue of dateFormats) {
    const date = parse(input.trim(), formatValue, now, { locale: enUS });
    if (isValid(date)) {
      if (formatValue === 'd MMM') date.setFullYear(currentYear);
      return {
        [input]: { text: input, start: startOfDay(date), end: endOfDay(date) },
      };
    }
  }
  return null;
};

const parseFixedRange = (input: string) => {
  const rangePattern = /(.+)\s*[-–]\s*(.+)/;
  const match = input.match(rangePattern);
  if (!match) return parseExactDate(input);

  const [, startStr, endStr] = match;
  if (!startStr || !endStr) return null;

  const possibleFormats = ['d MMM yyyy', 'd MMM', 'yyyy-MM-dd'];
  for (const formatValue of possibleFormats) {
    const now = new Date();
    const year = now.getFullYear();
    const start = parse(startStr, formatValue, now, { locale: enUS });
    const end = parse(endStr, formatValue, now, { locale: enUS });
    const finalStart = isValid(start) ? startOfDay(start) : null;
    const finalEnd = isValid(end) ? endOfDay(end) : null;
    if (finalStart && finalEnd) {
      if (formatValue === 'd MMM') {
        finalStart.setFullYear(year);
        finalEnd.setFullYear(year);
      }
      return { [input]: { text: input, start: finalStart, end: finalEnd } };
    }
  }
  return null;
};

const parseDateInput = (input: string) =>
  parseRelativeDate(input) || parseFixedRange(input) || parseExactDate(input);

const filterPresets = (
  obj: Record<string, { text: string; start: Date; end: Date }>,
  search: string
) => {
  if (!search) return obj;
  const searchWords = search.toLowerCase().split('-').filter(Boolean);
  const filtered = Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      const keyLower = value.text.toLowerCase();
      return searchWords.every((word) => keyLower.includes(word));
    })
  );
  if (Object.entries(filtered).length > 0) return filtered;

  const parsed = parseDateInput(search);
  if (parsed) return parsed;

  const numberMatch = search.match(/\d+/);
  if (!numberMatch) return {};
  const n = parseInt(numberMatch[0], 10);
  const now = new Date();

  return {
    [`last-${n}-days`]: { text: `Last ${n} Days`, start: startOfDay(subDays(now, n)), end: endOfDay(now) },
    [`last-${n}-weeks`]: { text: `Last ${n} Weeks`, start: startOfDay(subWeeks(now, n)), end: endOfDay(now) },
    [`last-${n}-months`]: { text: `Last ${n} Months`, start: startOfDay(subMonths(now, n)), end: endOfDay(now) },
    [`last-${n}-years`]: { text: `Last ${n} Years`, start: startOfDay(subYears(now, n)), end: endOfDay(now) },
  };
};

const formatDateRange = (start: Date, end: Date, timezone: string) => {
  const startDayKey = formatInTimeZone(start, timezone, 'yyyy-MM-dd');
  const endDayKey = formatInTimeZone(end, timezone, 'yyyy-MM-dd');
  const sameDay = startDayKey === endDayKey;
  const formatTime = (date: Date) =>
    formatInTimeZone(date, timezone, 'hh:mm a').toUpperCase();

  if (sameDay) {
    const day = formatInTimeZone(start, timezone, 'EEE, MMM d');
    return `${day}, ${formatTime(start)} - ${formatTime(end)}`;
  }

  const startFormatted = `${formatInTimeZone(start, timezone, 'MMM d')}, ${formatTime(start)}`;
  const endFormatted = `${formatInTimeZone(end, timezone, 'MMM d')}, ${formatTime(end)}`;
  return `${startFormatted} - ${endFormatted}`;
};

const formatTime12 = (date: Date, timezone: string) =>
  formatInTimeZone(date, timezone, 'hh:mm a').toUpperCase();

const buildTimeDropdownOptions = () => {
  const options: Array<{ value: string; label: string }> = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      const minuteText = String(minute).padStart(2, '0');
      const text = `${String(hour12).padStart(2, '0')}:${minuteText} ${period}`;
      options.push({ value: text, label: text });
    }
  }
  // Keep end-of-day explicit option for timeline use-cases.
  if (!options.some((opt) => opt.value === '11:59 PM')) {
    options.push({ value: '11:59 PM', label: '11:59 PM' });
  }
  return options;
};

const parseTimeInput = (value: string) => {
  const normalized = value.trim().toUpperCase();
  const formats = ['hh:mm a', 'h:mm a', 'hh:mma', 'h:mma', 'HH:mm'];
  for (const fmt of formats) {
    const parsed = parse(normalized, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  return new Date('invalid');
};

const typeRelativeTimes = [
  { text: '45m', start: subMinutes(new Date(), 45), end: new Date() },
  { text: '12 hours', start: subHours(new Date(), 12), end: new Date() },
  { text: '10d', start: startOfDay(subDays(new Date(), 10)), end: endOfDay(new Date()) },
  { text: '2 weeks', start: startOfDay(subWeeks(new Date(), 2)), end: endOfDay(new Date()) },
  { text: 'last month', start: startOfDay(subMonths(new Date(), 1)), end: endOfDay(new Date()) },
  { text: 'yesterday', start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) },
  { text: 'today', start: startOfDay(new Date()), end: endOfDay(new Date()) },
];

const typeFixedTimes = [
  { text: 'Jan 1', start: startOfDay(new Date(new Date().getFullYear(), 0, 1)), end: endOfDay(new Date(new Date().getFullYear(), 0, 1)) },
  { text: 'Jan 1 - Jan 2', start: startOfDay(new Date(new Date().getFullYear(), 0, 1)), end: endOfDay(new Date(new Date().getFullYear(), 0, 2)) },
  { text: '1/1', start: startOfDay(new Date(new Date().getFullYear(), 0, 1)), end: endOfDay(new Date(new Date().getFullYear(), 0, 1)) },
  { text: '1/1 - 1/2', start: startOfDay(new Date(new Date().getFullYear(), 0, 1)), end: endOfDay(new Date(new Date().getFullYear(), 0, 2)) },
];

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

interface CalendarComboboxProps {
  stacked: boolean;
  compact: boolean;
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets: Record<string, { text: string; start: Date; end: Date }>;
  presetIndex?: number;
}

const CalendarCombobox = ({ stacked, compact, value, onChange, presets, presetIndex }: CalendarComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentPreset, setCurrentPreset] = useState<{ text: string; start: Date; end: Date } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const onClickPreset = (preset: { text: string; start: Date; end: Date }) => {
    setInputValue(preset.text);
    setCurrentPreset(preset);
    onChange({ start: preset.start, end: preset.end });
    setIsOpen(false);
  };

  const filteredPresets = filterPresets(presets, inputValue);
  useClickOutside(ref, () => setIsOpen(false));

  useEffect(() => {
    const array = Object.entries(presets);
    if (presetIndex !== undefined && presetIndex >= 0 && presetIndex < array.length) {
      const preset = array[presetIndex][1];
      setInputValue(preset.text);
      setCurrentPreset(preset);
      onChange({ start: preset.start, end: preset.end });
    }
  }, [presetIndex, presets, onChange]);

  useEffect(() => {
    if (
      currentPreset &&
      (currentPreset.start !== value?.start || currentPreset.end !== value?.end)
    ) {
      setCurrentPreset(null);
      setInputValue('');
    }
  }, [value, currentPreset]);

  return (
    <div
      ref={ref}
      className={twMerge(
        clsx(
          'inline-block text-sm font-sans',
          compact ? 'w-[180px] absolute left-[38px]' : 'w-[250px] relative',
          compact && !isOpen && 'pl-[140px]',
          compact &&
            (isOpen ||
              (currentPreset &&
                currentPreset?.start === value?.start &&
                currentPreset?.end === value?.end)) &&
            'pl-0'
        )
      )}
    >
      <Input
        prefix={compact ? undefined : <ClockIcon />}
        prefixStyling="pl-2.5"
        suffix={<ArrowBottomIcon className={clsx('duration-200', isOpen && 'rotate-180')} />}
        suffixStyling={clsx(
          'cursor-pointer',
          compact &&
            !isOpen &&
            (!currentPreset ||
              (currentPreset?.start !== value?.start &&
                currentPreset?.end !== value?.end)) &&
            'w-10 !px-0'
        )}
        placeholder="Select Period"
        onFocus={() => setIsOpen(true)}
        value={inputValue}
        onChange={(next) => setInputValue(next)}
        wrapperClassName={clsx(
          'hover:z-10',
          stacked && !compact && 'rounded-b-none',
          !stacked && !compact && 'rounded-r-none',
          compact && 'rounded-l-none',
          (isOpen ||
            (compact &&
              currentPreset &&
              currentPreset?.start === value?.start &&
              currentPreset?.end === value?.end)) &&
            'z-10'
        )}
        className={clsx(
          'pl-2 placeholder:!text-gray-1000 placeholder:!opacity-100',
          compact &&
            !isOpen &&
            (!currentPreset ||
              (currentPreset?.start !== value?.start &&
                currentPreset?.end !== value?.end)) &&
            '!w-0 !px-0'
        )}
      />
      <Material
        type="menu"
        className={clsx(
          'absolute z-50 top-12 left-0',
          compact ? 'w-full' : 'grid grid-cols-2 w-[200%]',
          isOpen && 'opacity-100',
          !isOpen && 'opacity-0 pointer-events-none duration-200'
        )}
      >
        <ul className="p-2 border-r border-r-gray-200">
          {Object.entries(filteredPresets).length > 0 ? (
            Object.entries(filteredPresets).map(([key, entry]) => (
              <li
                key={key}
                className="flex items-center cursor-pointer px-2 w-full h-9 rounded-md hover:bg-gray-alpha-300 active:bg-gray-alpha-300 font-sans text-sm text-gray-1000"
                onClick={() => onClickPreset(entry)}
              >
                {entry.text}
              </li>
            ))
          ) : (
            <li className="flex items-center cursor-pointer px-2 w-full h-9 rounded-md hover:bg-gray-alpha-300 active:bg-gray-alpha-300 font-sans text-sm text-gray-1000">
              {inputValue}
            </li>
          )}
        </ul>
        {!compact && (
          <div className="p-4 pr-[30px]">
            <div className="font-sans text-gray-900 text-sm">Type relative times</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {typeRelativeTimes.map((entry) => (
                <button
                  key={entry.text}
                  className="font-mono text-[13px] text-gray-1000 px-1.5 h-5 inline-flex items-center bg-accents-2 border-none rounded cursor-pointer"
                  onClick={() => onClickPreset(entry)}
                >
                  {entry.text}
                </button>
              ))}
            </div>
            <div className="font-sans text-gray-900 text-sm mt-4">Type fixed times</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {typeFixedTimes.map((entry) => (
                <button
                  key={entry.text}
                  className="font-mono text-[13px] text-gray-1000 px-1.5 h-5 inline-flex items-center bg-accents-2 border-none rounded cursor-pointer"
                >
                  {entry.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </Material>
    </div>
  );
};

interface CalendarProps {
  allowClear?: boolean;
  compact?: boolean;
  isDocsPage?: boolean;
  stacked?: boolean;
  horizontalLayout?: boolean;
  showTimeInput?: boolean;
  popoverAlignment?: 'start' | 'center' | 'end';
  defaultTimezone?: string;
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets?: Record<string, { text: string; start: Date; end: Date }>;
  presetIndex?: number;
  minValue?: Date;
  maxValue?: Date;
}

export const Calendar = ({
  allowClear = false,
  compact = false,
  isDocsPage = false,
  stacked = false,
  horizontalLayout = false,
  showTimeInput = true,
  popoverAlignment = 'start',
  defaultTimezone,
  value,
  onChange,
  presets,
  presetIndex,
  minValue,
  maxValue,
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const { selectedTimezone, setSelectedTimezone, availableTimezones } =
    useTimezone();
  const selectedTimezoneIana = selectedTimezone.iana;
  const timezoneOptions = useMemo(
    () =>
      availableTimezones.map((timezone) => ({
        value: timezone.iana,
        label: timezone.label,
      })),
    [availableTimezones]
  );
  const timeOptions = useMemo(() => buildTimeDropdownOptions(), []);
  const resolvedDefaultTimezone = useMemo(() => {
    if (!defaultTimezone) return null;
    return availableTimezones.find((tz) => tz.iana === defaultTimezone);
  }, [defaultTimezone, availableTimezones]);
  const [draftStart, setDraftStart] = useState<Date | null>(value?.start ?? null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(value?.end ?? null);
  const [startDate, setStartDate] = useState(
    formatInTimeZone(
      value?.start || new Date(),
      selectedTimezoneIana,
      'MMM dd, yyyy'
    )
  );
  const [startTime, setStartTime] = useState(
    formatTime12(startOfDay(value?.start || new Date()), selectedTimezoneIana)
  );
  const [endDate, setEndDate] = useState(
    formatInTimeZone(
      value?.end || new Date(),
      selectedTimezoneIana,
      'MMM dd, yyyy'
    )
  );
  const [endTime, setEndTime] = useState(
    formatTime12(endOfDay(value?.end || new Date()), selectedTimezoneIana)
  );
  const [startDateError, setStartDateError] = useState(false);
  const [startTimeError, setStartTimeError] = useState(false);
  const [endDateError, setEndDateError] = useState(false);
  const [endTimeError, setEndTimeError] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(calendarRef, () => setIsOpen(false));

  useEffect(() => {
    if (resolvedDefaultTimezone) {
      setSelectedTimezone(resolvedDefaultTimezone);
    }
  }, [resolvedDefaultTimezone, setSelectedTimezone]);

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close);
    };
  }, []);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysArray: Date[] = [];
  let day = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  while (day <= endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })) {
    daysArray.push(day);
    day = addDays(day, 1);
  }

  const toZonedDate = (date: Date, isEnd = false) => {
    const base = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      isEnd ? 23 : 0,
      isEnd ? 59 : 0,
      isEnd ? 59 : 0,
      isEnd ? 999 : 0
    );
    return fromZonedTime(base, selectedTimezoneIana);
  };

  const handleDateClick = (clickedDay: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      const nextStart = toZonedDate(clickedDay);
      setDraftStart(nextStart);
      setDraftEnd(null);
      setStartDate(
        formatInTimeZone(nextStart, selectedTimezoneIana, 'MMM dd, yyyy')
      );
      setStartTime(formatTime12(nextStart, selectedTimezoneIana));
      setEndDate('');
      setEndTime('');
      setHoverDate(clickedDay);
      setIsSelecting(true);
    } else if (isSelecting) {
      const nextStart = draftStart;
      if (!nextStart) return;
      const clickedStart = toZonedDate(clickedDay);
      const clickedEnd = toZonedDate(clickedDay, true);
      const normalizedStart = clickedStart > nextStart ? nextStart : clickedStart;
      const nextEnd = clickedStart > nextStart ? clickedEnd : toZonedDate(nextStart, true);

      setDraftStart(normalizedStart);
      setDraftEnd(nextEnd);
      setStartDate(
        formatInTimeZone(normalizedStart, selectedTimezoneIana, 'MMM dd, yyyy')
      );
      setStartTime(formatTime12(normalizedStart, selectedTimezoneIana));
      setEndDate(
        formatInTimeZone(nextEnd, selectedTimezoneIana, 'MMM dd, yyyy')
      );
      setEndTime(formatTime12(nextEnd, selectedTimezoneIana));

      onChange({ start: normalizedStart, end: nextEnd });
      setIsSelecting(false);
      setHoverDate(null);
    }
  };

  const onApply = () => {
    const parsedStartDate = parse(startDate, 'MMM dd, yyyy', new Date());
    const parsedStartTime = parseTimeInput(startTime || '');
    const parsedEndDate = parse(endDate, 'MMM dd, yyyy', new Date());
    const parsedEndTime = parseTimeInput(endTime || '');

    if (
      String(parsedStartDate) === 'Invalid Date' ||
      String(parsedStartTime) === 'Invalid Date' ||
      String(parsedEndDate) === 'Invalid Date' ||
      String(parsedEndTime) === 'Invalid Date'
    ) {
      setStartDateError(String(parsedStartDate) === 'Invalid Date');
      setStartTimeError(String(parsedStartTime) === 'Invalid Date');
      setEndDateError(String(parsedEndDate) === 'Invalid Date');
      setEndTimeError(String(parsedEndTime) === 'Invalid Date');
      return;
    }

    setStartDateError(false);
    setStartTimeError(false);
    setEndDateError(false);
    setEndTimeError(false);

    const parsedStart = parse(
      `${startDate} ${startTime.toUpperCase()}`,
      'MMM d, yyyy hh:mm a',
      new Date()
    );
    const parsedEnd = parse(
      `${endDate} ${endTime.toUpperCase()}`,
      'MMM d, yyyy hh:mm a',
      new Date()
    );
    setDraftStart(parsedStart);
    setDraftEnd(parsedEnd);
    onChange({
      start: fromZonedTime(parsedStart, selectedTimezoneIana),
      end: fromZonedTime(parsedEnd, selectedTimezoneIana),
    });
    setIsOpen(false);
  };

  useEffect(() => {
    setDraftStart(value?.start ?? null);
    setDraftEnd(value?.end ?? null);
    setStartDate(
      formatInTimeZone(
        value?.start || new Date(),
        selectedTimezoneIana,
        'MMM dd, yyyy'
      )
    );
    setStartTime(
      formatTime12(value?.start || startOfDay(new Date()), selectedTimezoneIana)
    );
    setEndDate(
      formatInTimeZone(
        value?.end || new Date(),
        selectedTimezoneIana,
        'MMM dd, yyyy'
      )
    );
    setEndTime(
      formatTime12(value?.end || endOfDay(new Date()), selectedTimezoneIana)
    );
  }, [isOpen, value, selectedTimezoneIana]);

  const activeStart = draftStart;
  const activeEnd = draftEnd;

  return (
    <div className="relative z-30">
      <div
        className={clsx(
          presets && 'flex',
          presets && stacked && 'flex-col',
          compact && 'w-[220px]'
        )}
      >
        {presets && (
          <div>
            <CalendarCombobox
              stacked={stacked}
              compact={compact}
              presets={presets}
              value={value}
              onChange={onChange}
              presetIndex={presetIndex}
            />
          </div>
        )}
        <div className="flex justify-between items-center">
          <div className="relative">
            <Button
              className={clsx(
                '!justify-start focus:!border-transparent focus:!shadow-focus-input',
                presets && !stacked && !compact && 'rounded-l-none -ml-[1px]',
                presets && stacked && !compact && 'rounded-t-none -mt-[1px]',
                presets && compact && 'rounded-r-none -mr-[1px]',
                compact ? 'w-[180px] gap-1.5' : 'min-w-[250px] w-fit max-w-[min(100vw-2rem,680px)]'
              )}
              prefix={<CalendarIcon />}
              type="secondary"
              onClick={() => setIsOpen((prevState) => !prevState)}
            >
              <div className="pr-4 whitespace-nowrap">
                {value?.start && value?.end
                  ? formatDateRange(value.start, value.end, selectedTimezoneIana)
                  : 'Select Date Range'}
              </div>
            </Button>
            {allowClear && value?.start && value?.end && (
              <Button
                aria-label="Clear input value"
                svgOnly
                variant="unstyled"
                className="absolute right-0 top-1/2 -translate-y-1/2 fill-gray-700 hover:fill-gray-1000"
                onClick={() => onChange(null)}
              >
                <ClearIcon />
              </Button>
            )}
          </div>
        </div>
      </div>
      {isOpen && (
        <Material
          ref={calendarRef}
          type="menu"
          className={twMerge(
            clsx(
              'p-4 font-sans absolute top-12 z-[120] border border-gray-alpha-300',
              horizontalLayout ? 'w-[690px]' : 'w-[320px]',
              presets && !stacked && !compact && 'left-[250px]',
              presets && stacked && 'top-[88px]',
              popoverAlignment === 'center' && 'left-[125px] -translate-x-1/2',
              popoverAlignment === 'end' && 'left-[250px] -translate-x-full'
            )
          )}
        >
          <div className={clsx(horizontalLayout && 'flex gap-5 items-start')}>
            <div className="min-w-[310px]">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm text-gray-1000 font-medium">
                  {formatInTimeZone(
                    currentDate,
                    selectedTimezoneIana,
                    'MMMM yyyy'
                  )}
                </h2>
                <div className="flex gap-0.5">
                  <Button variant="unstyled" onClick={prevMonth}>
                    <ArrowLeftIcon />
                  </Button>
                  <Button variant="unstyled" onClick={nextMonth}>
                    <ArrowRightIcon />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-gray-900 uppercase mb-2 gap-x-1">
                <div className="w-10 text-center">M</div>
                <div className="w-10 text-center">T</div>
                <div className="w-10 text-center">W</div>
                <div className="w-10 text-center">T</div>
                <div className="w-10 text-center">F</div>
                <div className="w-10 text-center">S</div>
                <div className="w-10 text-center">S</div>
              </div>
              <div className="grid grid-cols-7 items-center justify-items-center gap-x-1 gap-y-1.5">
                {daysArray.map((currDay) => {
                  const isStart = activeStart && isSameDay(currDay, activeStart);
                  const isEnd = activeEnd && isSameDay(currDay, activeEnd);
                  const currentHover = hoverDate && isSelecting && isSameDay(currDay, hoverDate);
                  const isInRange =
                    activeStart &&
                    ((activeEnd &&
                      isWithinInterval(currDay, { start: activeStart, end: activeEnd })) ||
                      (hoverDate &&
                        isWithinInterval(currDay, {
                          start: activeStart,
                          end: hoverDate,
                        })));
                  const isAllowedDate =
                    (minValue ? currDay >= minValue : true) &&
                    (maxValue ? currDay <= maxValue : true);

                  return (
                    <div
                      key={currDay.toString()}
                      className={clsx(
                        'flex items-center justify-center text-sm text-center rounded transition',
                        isSameMonth(currDay, currentDate) && isAllowedDate
                          ? 'bg-background-100 text-gray-1000'
                          : 'bg-background-100 text-gray-700',
                        isInRange &&
                          !isStart &&
                          !isEnd &&
                          !currentHover &&
                          '!bg-accents-2 rounded-none',
                        isAllowedDate ? 'cursor-pointer' : 'cursor-not-allowed'
                      )}
                      onMouseEnter={() => isAllowedDate && activeStart && !activeEnd && setHoverDate(currDay)}
                      onClick={() => isAllowedDate && handleDateClick(currDay)}
                    >
                      <div
                        className={clsx(
                          'h-10 w-10 shrink-0 flex items-center justify-center rounded-md font-medium tabular-nums leading-none',
                          (isStart || isEnd || currentHover) &&
                            isAllowedDate &&
                            ' !bg-gray-1000 !text-background-100',
                          !isStart &&
                            !isEnd &&
                            !currentHover &&
                            !isToday(currDay) &&
                            isAllowedDate &&
                            'hover:text-gray-1000 hover:border hover:border-gray-alpha-500',
                          currentHover && isAllowedDate && ' !shadow-focus-calendar-date',
                          isToday(currDay) && ' !bg-blue-900 !text-background-100'
                        )}
                      >
                        {format(currDay, 'd')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={clsx(
                'flex flex-col gap-4 min-w-[280px]',
                horizontalLayout
                  ? 'justify-between'
                  : 'mt-3 -mx-3 px-3 pt-2.5 border-t border-gray-alpha-100'
              )}
            >
              <div className="rounded-md border border-gray-alpha-300 p-3">
                <div className="text-xs uppercase tracking-wider text-gray-900 mb-2">
                  Selection
                </div>
                <div>
                  <div className="text-[13px] text-gray-900 capitalize">Start</div>
                  <div className="grid grid-cols-12 gap-2 mt-1 items-start">
                    <div className={showTimeInput ? 'col-span-7 min-w-0' : 'col-span-12'}>
                      <Input
                        size="small"
                        value={startDate}
                        onChange={(next) => setStartDate(next)}
                        error={startDateError}
                      />
                    </div>
                    {showTimeInput && (
                      <div className="col-span-5 min-w-0">
                        <Select
                          size="small"
                          options={timeOptions}
                          placeholder="Select time"
                          value={startTime}
                          onChange={(event) => {
                            setStartTime(event.target.value);
                            setStartTimeError(false);
                          }}
                          error={startTimeError ? 'Invalid time' : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-[13px] text-gray-900 capitalize">End</div>
                  <div className="grid grid-cols-12 gap-2 mt-1 items-start">
                    <div className={showTimeInput ? 'col-span-7 min-w-0' : 'col-span-12'}>
                      <Input
                        size="small"
                        value={endDate}
                        onChange={(next) => setEndDate(next)}
                        error={endDateError}
                      />
                    </div>
                    {showTimeInput && (
                      <div className="col-span-5 min-w-0">
                        <Select
                          size="small"
                          options={timeOptions}
                          placeholder="Select time"
                          value={endTime}
                          onChange={(event) => {
                            setEndTime(event.target.value);
                            setEndTimeError(false);
                          }}
                          error={endTimeError ? 'Invalid time' : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-700 mt-3">
                  Click dates on the calendar or edit these fields.
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="secondary"
                  size="small"
                  suffix={<span className="mt-1 text-xs">↵</span>}
                  onClick={onApply}
                >
                  Apply
                </Button>
                <div className="w-fit self-center">
                  <Select
                    size="xsmall"
                    variant="ghost"
                    options={timezoneOptions}
                    value={selectedTimezoneIana}
                    onChange={(event) => {
                      const nextTimezone = availableTimezones.find(
                        (timezone) => timezone.iana === event.target.value
                      );
                      if (nextTimezone) {
                        setSelectedTimezone(nextTimezone);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {isDocsPage ? null : null}
        </Material>
      )}
    </div>
  );
};
