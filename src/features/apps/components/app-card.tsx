import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface AppCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'active' | 'inactive';
  features: string[];
  url?: string;
  path?: string;
}

export const AppCard = memo(function AppCard({
  title,
  description,
  icon: Icon,
  status,
  features,
  url,
  path,
}: AppCardProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    } else if (path) {
      navigate(path);
    }
  }, [url, path, navigate]);

  return (
    <Card className="group hover:border-blue-500 dark:hover:border-blue-400 mt-20">
      <CardContent className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
            <Icon className="h-5 w-5 text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {title}
            </h3>
            <Badge
              variant={status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {status}
            </Badge>
          </div>
          {url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
        <h4 className="font-medium mb-2 text-sm text-gray-400 tracking-wide">
          Key Features
        </h4>
        <div className="flex flex-wrap gap-1 mb-3">
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

        <Button
          onClick={handleClick}
          size="sm"
          className="w-full hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600"
        >
          {url ? 'Visit Demo' : 'Open Demo'}
          {url && <ExternalLink className="ml-2 h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
});
