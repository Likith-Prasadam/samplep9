import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setUserData,
} from '@/store/slices/event-configuration-slice';
import {
  EventConfigurationProvider,
  useEventConfiguration,
} from '@/providers/event-configuration-provider';
import type { RootState, AppDispatch } from '@/store';
import EventList from './components/event-list';
import EventCreator from './components/event-creator';
import ConfirmationDialog from './components/confirmation-dialog';
import { sanitizeInput, validateEvents } from './types/validation';
import { Info } from 'lucide-react';

const EventConfigurationContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    editingIndex,
    setEditingIndex,
    confirmationDialog,
    setConfirmationDialog,
    closeConfirmationDialog,
  } = useEventConfiguration();
  const { events, loading, error, userId, cohortId } = useSelector(
    (state: RootState) => state.eventConfiguration
  );

  const [eventInput, setEventInput] = useState('');

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Initialize user data
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        dispatch(
          setUserData({
            userId: parseInt(String(userData.user_id), 10),
            cohortId: parseInt(String(userData.cohort_id), 10),
          })
        );
      } catch {
        toast.error('Failed to load user data');
      }
    }
  }, [dispatch]);

  // Fetch events when user data is available
  useEffect(() => {
    if (userId && cohortId) {
      dispatch(fetchEvents({ userId, cohortId }));
    }
  }, [dispatch, userId, cohortId]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const lines = e.target.value.split('\n');
      const sanitized = lines.map((line) => sanitizeInput(line)).join('\n');
      setEventInput(sanitized);
    },
    []
  );

  const handleAddEvent = useCallback(async () => {
    if (!userId || !cohortId) {
      toast.error('User data not available');
      return;
    }

    const names = eventInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const validationError = validateEvents(names);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await Promise.all(
        names.map((name) =>
          dispatch(createEvent({ userId, cohortId, eventName: name })).unwrap()
        )
      );

      toast.success(`Successfully created ${names.length} event(s)`);
      setEventInput('');
      await dispatch(fetchEvents({ userId, cohortId }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create events'
      );
    }
  }, [eventInput, userId, cohortId, dispatch]);

  const handleEditEvent = useCallback(
    async (index: number, value: string) => {
      if (!userId || !cohortId) return;

      const event = events[index];
      if (!event.id) return;

      try {
        await dispatch(
          updateEvent({
            userId,
            cohortId,
            eventId: Number(event.id),
            eventName: value.trim(),
          })
        ).unwrap();

        toast.success('Event updated successfully');
        setEditingIndex(null);
        await dispatch(fetchEvents({ userId, cohortId }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to update event'
        );
      }
    },
    [events, userId, cohortId, dispatch, setEditingIndex]
  );

  const showUpdateConfirmation = useCallback(
    (index: number, value: string) => {
      setConfirmationDialog({
        open: true,
        type: 'update',
        title: 'Update Event',
        message: `Are you sure you want to update "${events[index].event_name}" to "${value.trim()}"?`,
        onConfirm: () => {
          closeConfirmationDialog();
          handleEditEvent(index, value);
        },
      });
    },
    [events, setConfirmationDialog, closeConfirmationDialog, handleEditEvent]
  );

  const handleDeleteEvent = useCallback(
    async (index: number) => {
      if (!userId || !cohortId) return;

      const event = events[index];
      if (!event.id) return;

      try {
        await dispatch(deleteEvent({ eventId: Number(event.id) })).unwrap();
        toast.success('Event deleted successfully');
        await dispatch(fetchEvents({ userId, cohortId }));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to delete event'
        );
      }
    },
    [events, userId, cohortId, dispatch]
  );

  const showDeleteConfirmation = useCallback(
    (index: number) => {
      setConfirmationDialog({
        open: true,
        type: 'delete',
        title: 'Delete Event',
        message: `Are you sure you want to delete "${events[index].event_name}"?`,
        onConfirm: () => {
          closeConfirmationDialog();
          handleDeleteEvent(index);
        },
      });
    },
    [events, setConfirmationDialog, closeConfirmationDialog, handleDeleteEvent]
  );

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Event Configuration
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Manage custom events for your AI model to detect and
                      respond to.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>
              <p className="text-muted-foreground">
                Create and manage events that your system can detect
              </p>

              {/* Integration info banner */}
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">
                      Live Stream Integration Active
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configured events are automatically used in the Live
                      Stream module to categorize and filter detected incidents.
                      Events will be tagged with their configured names in
                      real-time notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-card border border-border rounded-lg">
                <EventCreator
                  value={eventInput}
                  loading={loading}
                  onChange={handleInputChange}
                  onAdd={handleAddEvent}
                  disabled={!eventInput.trim()}
                />
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">
                    Current Events ({events.length})
                  </h3>
                  <div className="h-1 w-20 bg-primary rounded-full mt-2" />
                </div>
                <EventList
                  events={events}
                  editingIndex={editingIndex}
                  loading={loading}
                  onEdit={showUpdateConfirmation}
                  onStartEdit={setEditingIndex}
                  onDelete={showDeleteConfirmation}
                />
              </div>
            </div>
          </div>
        </div>
      </Main>

      <ConfirmationDialog
        open={confirmationDialog.open}
        type={confirmationDialog.type}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={closeConfirmationDialog}
        loading={loading}
      />
    </div>
  );
};

const EventConfiguration = () => {
  return (
    <EventConfigurationProvider>
      <EventConfigurationContent />
    </EventConfigurationProvider>
  );
};

export default EventConfiguration;
