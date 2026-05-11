import { AVAILABLE_TIMEZONES, type TimezoneOption } from '@/constants/timezone';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectSelectedTimezone,
  setSelectedTimezone,
} from '@/store/slices/timezone-slice';

interface TimezoneContextType {
  selectedTimezone: TimezoneOption;
  setSelectedTimezone: (timezone: TimezoneOption) => void;
  availableTimezones: readonly TimezoneOption[];
}

export const useTimezone = (): TimezoneContextType => {
  const dispatch = useAppDispatch();
  const selectedTimezone = useAppSelector(selectSelectedTimezone);

  return {
    selectedTimezone,
    setSelectedTimezone: (timezone: TimezoneOption) => {
      dispatch(setSelectedTimezone(timezone));
    },
    availableTimezones: AVAILABLE_TIMEZONES,
  };
};
