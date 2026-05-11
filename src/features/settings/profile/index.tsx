import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { ProfileForm } from './components/profile-form';

const ProfileSettings = () => {
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

      <Main fixed className="flex-1 overflow-hidden pl-25 pr-25">
        <div
          className="h-full overflow-y-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Profile Settings
            </h2>
            <p className="text-muted-foreground">
              Manage your personal information and preferences.
            </p>
          </div>

          <ProfileForm />
        </div>
      </Main>
    </div>
  );
};

export default ProfileSettings;
