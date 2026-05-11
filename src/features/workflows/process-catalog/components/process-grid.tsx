import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Zap } from 'lucide-react';
import type { Process } from '@/types/workflow-types';

interface ProcessGridProps {
  processes: Process[];
  loading: boolean;
  onConfigure: (process: Process) => void;
}

const getProcessTypeColor = (type: string) => {
  switch (type) {
    case 'event_detection':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'object_tracking':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'anomaly_detection':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'classification':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export function ProcessGrid({
  processes,
  loading,
  onConfigure,
}: ProcessGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
        <Zap className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No workflows found</p>
        <p className="text-sm text-muted-foreground">
          Check back later for available workflows
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {processes.map((process) => (
        <Card
          key={process.process_hash}
          className="hover:shadow-lg transition-shadow"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {process.process_name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {process.description || 'No description available'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={getProcessTypeColor(process.process_type)}
              >
                {process.process_type.replace('_', ' ')}
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-500 border-green-500/20"
              >
                {process.access_level}
              </Badge>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => onConfigure(process)}
              className="w-full"
              size="sm"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Configure Workflow
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
