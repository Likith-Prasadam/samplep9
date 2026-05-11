import { Link } from 'react-router-dom';

type LinkProps = React.ComponentProps<typeof Link>;

type User = {
  name: string;
  email: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  user_hash?: string;
  cohort_id?: number;
  is_root?: boolean;
  is_general?: boolean;
};

type Team = {
  name: string;
  logo: React.ElementType;
  plan: string;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
};

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {});
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] | (string & {}) })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  items: NavItem[];
};

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink, User };
