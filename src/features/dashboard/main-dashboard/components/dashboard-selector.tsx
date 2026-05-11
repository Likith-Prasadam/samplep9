import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentDashboard,
  type Dashboard,
} from '@/store/slices/dashboard-navigation-slice';
import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { DashboardCard } from './dashboard-card';

export default function DashboardSelector() {
  const dispatch = useAppDispatch();
  const { availableDashboards, loading } = useAppSelector(
    (state) => state.dashboardNavigation
  );

  useEffect(() => {
    dispatch(setCurrentDashboard('dashboard-selector'));
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25">
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
            <p className="text-muted-foreground mt-2">
              Select a dashboard to view analytics and insights
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {availableDashboards.map((dashboard: Dashboard) => (
                <DashboardCard key={dashboard.id} {...dashboard} />
              ))}
            </div>
          )}
        </div>
      </Main>
    </div>
  );
}
