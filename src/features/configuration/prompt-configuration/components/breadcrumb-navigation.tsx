import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbNavigationProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export const BreadcrumbNavigation = ({
  items = [],
  showHome = true,
  className = '',
}: BreadcrumbNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const breadcrumbs: BreadcrumbItem[] = [];

  if (showHome) {
    breadcrumbs.push({
      label: 'Home',
      path: '/',
    });
  }

  // Add base configuration breadcrumb
  if (location.pathname.includes('/configuration')) {
    breadcrumbs.push({
      label: 'Configuration',
      path: '/configuration',
    });
  }

  // Add prompt configuration breadcrumb
  if (location.pathname.includes('/prompt-configuration')) {
    breadcrumbs.push({
      label: 'Prompt Configuration',
      path: '/configuration/prompt-configuration',
    });
  }

  // Add custom items
  breadcrumbs.push(...items);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate(crumb.path)}
            className={`p-0 h-auto ${
              index === breadcrumbs.length - 1
                ? 'text-foreground font-medium pointer-events-none'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {crumb.label}
          </Button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          )}
        </div>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;
