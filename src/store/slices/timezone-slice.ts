import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  AVAILABLE_TIMEZONES,
  DEFAULT_TIMEZONE,
  TIMEZONE_STORAGE_KEY,
  type TimezoneOption,
  findTimezoneByIana,
} from '@/constants/timezone';
import type { RootState } from '@/store';

type TimezoneState = {
  selectedTimezone: TimezoneOption;
};

const getStoredTimezone = (): TimezoneOption => {
  try {
    const rawValue = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (!rawValue) return DEFAULT_TIMEZONE;

    const parsedValue = JSON.parse(rawValue) as Partial<TimezoneOption>;
    if (!parsedValue?.iana) return DEFAULT_TIMEZONE;

    return (
      findTimezoneByIana(parsedValue.iana) ?? {
        value: parsedValue.value ?? parsedValue.iana,
        label: parsedValue.label ?? parsedValue.iana,
        iana: parsedValue.iana,
        city: '',
      }
    );
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const persistTimezone = (timezone: TimezoneOption) => {
  try {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, JSON.stringify(timezone));
  } catch {
    // no-op: persist failure should not block state updates
  }
};

const initialState: TimezoneState = {
  selectedTimezone: getStoredTimezone(),
};

const timezoneSlice = createSlice({
  name: 'timezone',
  initialState,
  reducers: {
    setSelectedTimezone: (state, action: PayloadAction<TimezoneOption>) => {
      state.selectedTimezone = action.payload;
      persistTimezone(action.payload);
    },
    setSelectedTimezoneByIana: (state, action: PayloadAction<string>) => {
      const requestedIana = action.payload;
      const resolvedTimezone = findTimezoneByIana(requestedIana) ?? {
        value: requestedIana,
        label: requestedIana,
        iana: requestedIana,
        city: '',
      };

      state.selectedTimezone = resolvedTimezone;
      persistTimezone(resolvedTimezone);
    },
  },
});

export const { setSelectedTimezone, setSelectedTimezoneByIana } =
  timezoneSlice.actions;

export const selectSelectedTimezone = (state: RootState) =>
  state.timezone.selectedTimezone;

export const selectSelectedTimezoneIana = (state: RootState) =>
  state.timezone.selectedTimezone.iana;

export const selectSelectedTimezoneCode = (state: RootState) =>
  state.timezone.selectedTimezone.value;

export const selectAvailableTimezones = () => AVAILABLE_TIMEZONES;

export default timezoneSlice.reducer;
