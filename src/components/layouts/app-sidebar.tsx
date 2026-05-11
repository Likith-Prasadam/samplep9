import { useLayout } from '@/providers/layout-provider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { sidebarData } from '../layouts/data/sidebar-data';
import { NavGroup } from './nav-group';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import type { User } from './types';
import { useUser } from '@/context/user-context';
import { usePermissions } from '@/hooks/use-permissions';

export function AppSidebar() {
  const { collapsible, variant } = useLayout();
  const { user } = useUser();
  const { isRootAdmin, isRootUser, selectedRole } = usePermissions();
  const canAccessRootOnlyFeatures = isRootAdmin || isRootUser;
  const canAccessDashboard =
    selectedRole === 'ROOT_ADMIN' || selectedRole === 'ROOT_USER';

  const dynamicUser: User = {
    name:
      user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.username || sidebarData.user.name,
    email: user?.email || sidebarData.user.email,
    avatar: user?.avatar || sidebarData.user.avatar,
    first_name: user?.first_name,
    last_name: user?.last_name,
    username: user?.username,
    user_hash: user?.user_hash,
    cohort_id: user?.cohort_id,
    is_root: user?.is_root,
    is_general: user?.is_general,
  };

  const filteredNavGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.url === '/dashboard' && !canAccessDashboard) {
        return false;
      }
      const isRootOnlyNav =
        item.url === '/demo-videos' || item.url === '/chat-page';
      if (isRootOnlyNav) {
        return canAccessRootOnlyFeatures;
      }
      return true;
    }),
  }));

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={dynamicUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
