import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apollo-client';
import {
  GET_EVENTS,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
} from '@/graphql/configuration_queries';
import type { Event } from '@/features/configuration/event-configuration/types/types';

export interface EventConfigurationState {
  events: Event[];
  loading: boolean;
  error: string | null;
  userId: number | null;
  cohortId: number | null;
}

const initialState: EventConfigurationState = {
  events: [],
  loading: false,
  error: null,
  userId: null,
  cohortId: null,
};

// Fetch all events
export const fetchEvents = createAsyncThunk(
  'eventConfiguration/fetchEvents',
  async ({ userId, cohortId }: { userId: number; cohortId: number }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const result = await client.query({
      query: GET_EVENTS,
      variables: {
        input_json: {
          user_id: userId,
          cohort_id: cohortId,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    const events = result?.data?.events?.fetch_data_by_filters_events || [];
    return events.map((ev: Event) => ({
      ...ev,
      id: parseInt(String(ev.id), 10),
    }));
  }
);

// Create new event
export const createEvent = createAsyncThunk(
  'eventConfiguration/createEvent',
  async ({
    userId,
    cohortId,
    eventName,
  }: {
    userId: number;
    cohortId: number;
    eventName: string;
  }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const result = await client.mutate({
      mutation: CREATE_EVENT,
      variables: {
        input_json: {
          user_id: userId,
          cohort_id: cohortId,
          event_name: eventName,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!result.data?.events?.create_event) {
      throw new Error('Failed to create event');
    }

    return {
      ...result.data.events.create_event,
      id: parseInt(String(result.data.events.create_event.id), 10),
    };
  }
);

// Update existing event
export const updateEvent = createAsyncThunk(
  'eventConfiguration/updateEvent',
  async ({
    userId,
    cohortId,
    eventId,
    eventName,
  }: {
    userId: number;
    cohortId: number;
    eventId: number;
    eventName: string;
  }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const result = await client.mutate({
      mutation: UPDATE_EVENT,
      variables: {
        input_json: {
          id: eventId,
          event_name: eventName,
          user_id: userId,
          cohort_id: cohortId,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!result.data?.events?.update_event) {
      throw new Error('Failed to update event');
    }

    return {
      ...result.data.events.update_event,
      id: parseInt(String(result.data.events.update_event.id), 10),
    };
  }
);

// Delete event
export const deleteEvent = createAsyncThunk(
  'eventConfiguration/deleteEvent',
  async ({ eventId }: { eventId: number }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    await client.mutate({
      mutation: DELETE_EVENT,
      variables: {
        event_id: eventId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    return eventId;
  }
);

const eventConfigurationSlice = createSlice({
  name: 'eventConfiguration',
  initialState,
  reducers: {
    setUserData: (
      state,
      action: PayloadAction<{ userId: number; cohortId: number }>
    ) => {
      state.userId = action.payload.userId;
      state.cohortId = action.payload.cohortId;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create event';
      })
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update event';
      })
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete event';
      });
  },
});

export const { setUserData, clearError } = eventConfigurationSlice.actions;

export default eventConfigurationSlice.reducer;
