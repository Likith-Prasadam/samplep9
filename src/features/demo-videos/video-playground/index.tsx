import { useEffect, useMemo, memo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchDemoVideos,
  fetchDemoEvents,
  setCurrentVideoType,
} from '@/store/slices/demo-videos-slice';
import { NotificationBell } from './components/notification-demo-bell';
import { VideoCard } from './components/video-card';

function VideoPlayground() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const { videos, loading, error } = useSelector(
    (state: RootState) => state.demoVideos
  );

  const videoType = useMemo(() => slug || 'smart_cities', [slug]);
  const formattedVideoType = useMemo(
    () =>
      videoType.charAt(0).toUpperCase() + videoType.slice(1).replace(/_/g, ' '),
    [videoType]
  );

  useEffect(() => {
    dispatch(setCurrentVideoType(videoType));
    dispatch(fetchDemoVideos(videoType));
  }, [dispatch, videoType, slug]);

  useEffect(() => {
    dispatch(fetchDemoEvents());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchDemoVideos(videoType));
    dispatch(fetchDemoEvents());
  };

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25 scroll-smooth">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Video Playground
            </h1>
            <p className="text-muted-foreground mt-2">
              Process and analyze videos with AI-powered insights
            </p>
          </div>
          <NotificationBell />
        </div>

        {loading && !videos.length ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">
                Error loading videos: {error}
              </p>
              <Button onClick={handleRetry} type="button">
                Retry
              </Button>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No videos found for {formattedVideoType}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {videos.map((video) =>
              video ? (
                <VideoCard key={video.id} video={video} videoType={videoType} />
              ) : null
            )}
          </div>
        )}
      </Main>
    </div>
  );
}

export default memo(VideoPlayground);
