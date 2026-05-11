import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProcessWithModels } from '@/types/workflow-types';

interface ProcessOverviewProps {
  process: ProcessWithModels;
}

export function ProcessOverview({ process }: ProcessOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{process.process_name}</CardTitle>
        <CardDescription>{process.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium">Process Type:</span>
            <Badge variant="outline" className="ml-2">
              {process.process_type}
            </Badge>
          </div>
          <div>
            <span className="text-sm font-medium">Required Model Types:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {process.required_model_types.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">Required Prompts:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {process.required_prompt_types.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
