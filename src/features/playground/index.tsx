import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Search, CalendarIcon, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import BatchAnalysis from './components/playground-batch-analysis';
import NotificationModal from './components/playground-notification-panel';
import PlaygroundSearchDialog from './components/playground-search-dialog';
import { selectIsInitialized } from '@/store/slices/notifications-slice';
import { setSearchQuery } from '@/store/slices/playground-slice';
import type { RootState } from '@/store/index';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
// import { cn } from '@/lib/utils';

const TOOLTIP_UPLOAD_VIDEO =
  'Upload a video. Configure processing pipelines for batch analysis.';

const PlaygroundList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const searchQuery = useSelector(
    (state: RootState) => state.batchVideos.searchQuery
  );
  const isInitialized = useSelector((state: RootState) =>
    selectIsInitialized(state)
  );
  const viewMode = 'grid';
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    return () => {
      dispatch(setSearchQuery(''));
    };
  }, [dispatch]);

  // Reset filter to 'all' when coming from upload so newly uploaded video is visible
  useEffect(() => {
    const fromUpload = (location.state as { fromUpload?: boolean } | null)
      ?.fromUpload;
    if (fromUpload) {
      setFilter('all');
    }
  }, [location.state]);

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
      <Main fixed className="flex-1 overflow-hidden pl-10 pr-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="mb-3 flex flex-wrap items-center justify-between space-y-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight pb-2">
                Playground
              </h2>
              <p className="text-muted-foreground">
                Process and Manage Your Videos
              </p>
            </div>
          </div>
          {/* Top Controls */}
          <div className="flex items-center gap-4">
            <PlaygroundSearchDialog
              open={isSearchDialogOpen}
              onOpenChange={setIsSearchDialogOpen}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSearchDialogOpen(true)}
              className="bg-background/50 border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Open AI search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                aria-hidden="true"
                focusable="false"
                fill="currentColor"
              >
                <path d="M22.3135 20.8994L20.8994 22.3134L18.0713 19.4853L19.4854 18.0712L22.3135 20.8994ZM11 1.99995C11.2639 1.99995 11.525 2.01379 11.7832 2.03608C11.4424 2.63463 11.202 3.2974 11.084 4.0019C11.056 4.00158 11.028 3.99995 11 3.99995C7.13256 3.99995 4.00011 7.13254 4 11C4 14.8675 7.1325 18 11 18C14.8675 18 18 14.8675 18 11C18 10.9716 17.9974 10.9432 17.9971 10.915C18.7018 10.7971 19.3642 10.5566 19.9629 10.2158C19.9852 10.4742 20 10.7357 20 11C20 15.968 15.968 20 11 20C6.032 20 2 15.968 2 11C2.00011 6.03204 6.03206 1.99995 11 1.99995ZM16.5293 1.31929C16.7058 0.893246 17.2943 0.893246 17.4707 1.31929L17.7236 1.93061C18.1556 2.97343 18.9615 3.80614 19.9746 4.25679L20.6924 4.57612C21.1026 4.75903 21.1027 5.35623 20.6924 5.53901L19.9326 5.8769C18.9448 6.31622 18.1534 7.11927 17.7139 8.12788L17.4668 8.69331C17.2864 9.10744 16.7137 9.10744 16.5332 8.69331L16.2871 8.12788C15.8476 7.11924 15.0552 6.31623 14.0674 5.8769L13.3076 5.53901C12.8974 5.35624 12.8975 4.75902 13.3076 4.57612L14.0254 4.25679C15.0385 3.80614 15.8445 2.97346 16.2764 1.93061L16.5293 1.31929Z" />
              </svg>
            </Button>
            {isInitialized && (
              <NotificationModal selectedDate={dateRange?.from ?? null} />
            )}
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y')} -{' '}
                          {format(dateRange.to, 'LLL dd, y')}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y')
                      )
                    ) : (
                      <span>Select date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.to) {
                        setCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              {(dateRange?.from || dateRange?.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(undefined)}
                  className="h-9 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => navigate('/playground/upload')}>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{TOOLTIP_UPLOAD_VIDEO}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {/* Filter and Search Row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="pl-10 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200 bg-muted"
              maxLength={255}
            />
          </div>
          <Select onValueChange={(value) => setFilter(value)}>
            <SelectTrigger className="w-30 ">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All </SelectItem>
              <SelectItem value="completed">Processed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-hidden">
          <BatchAnalysis
            searchQuery={debouncedSearchQuery}
            filter={filter}
            viewMode={viewMode}
            dateRange={dateRange}
          />
        </div>
      </Main>
    </div>
  );
};

export default PlaygroundList;
