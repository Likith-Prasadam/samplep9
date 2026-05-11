import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Factory,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Factory,
  Shield,
};

export interface DashboardCardProps {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  status: 'active' | 'inactive';
  features: string[];
}

export const DashboardCard = memo(function DashboardCard({
  name,
  description,
  icon,
  status,
  features,
  path,
}: DashboardCardProps) {
  const navigate = useNavigate();
  const Icon = iconMap[icon] || LayoutDashboard;

  const handleClick = useCallback(() => {
    navigate(path);
  }, [path, navigate]);

  return (
    <Card className="group hover:border-blue-500 dark:hover:border-blue-400 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
            <Icon className="h-6 w-6 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {name}
            </h3>
            <Badge
              variant={status === 'active' ? 'default' : 'secondary'}
              className="text-xs mt-1"
            >
              {status}
            </Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
          {description}
        </p>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            Key Features
          </h4>
          <div className="flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={handleClick}
          size="sm"
          className="w-full mt-4 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600"
        >
          Open Dashboard
        </Button>
      </CardContent>
    </Card>
  );
});
