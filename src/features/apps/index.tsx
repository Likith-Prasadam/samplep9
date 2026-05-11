import { Shield, Database, Factory } from 'lucide-react';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { AppCard } from './components/app-card';
import type { AppCardProps } from './components/app-card';

const apps: AppCardProps[] = [
  {
    id: 'civil-supplies',
    title: 'Civil Supplies',
    description:
      'Comprehensive supply chain management system for civil infrastructure and public distribution.',
    url: 'http://54.85.187.163/',
    icon: Database,
    status: 'active',
    features: [
      'Supply Tracking',
      'Distribution Management',
      'Inventory Control',
    ],
  },
  {
    id: 'detention-panel',
    title: 'Detention Panel',
    description:
      'Administrative panel for detention facility management and monitoring systems.',
    path: '/apps/detention-panel',
    icon: Shield,
    status: 'active',
    features: [
      'Facility Management',
      'Security Monitoring',
      'Administrative Tools',
    ],
  },
  {
    id: 'manufacturing-safety',
    title: 'Manufacturing Safety',
    description:
      'AI-powered video analysis for manufacturing floor safety compliance, PPE detection, and incident monitoring.',
    path: '/dashboard/manufacturing-safety',
    icon: Factory,
    status: 'active',
    features: [
      'PPE Violation Detection',
      'Vehicle Tracking',
      'AI Video Analysis',
    ],
  },
];

export default function Apps() {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">App Dashboards</h1>
          <p className="text-muted-foreground">
            Here&apos;s a list of your dashboards!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {apps.map((app) => (
            <AppCard key={app.id} {...app} />
          ))}
        </div>
      </Main>
    </div>
  );
}
