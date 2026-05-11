import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Model } from '@/types/workflow-types';

interface ModelSelectorProps {
  models: Model[];
  selectedModel: Model | null;
  onSelectModel: (model: Model) => void;
  requiredTypes: string[];
  loading: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  requiredTypes,
  loading,
}: ModelSelectorProps) {
  const compatibleModels = models.filter(
    (model) => requiredTypes.includes(model.model_type) && model.is_active
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Model</CardTitle>
        <CardDescription>Choose an AI model for this workflow</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading models...</div>
        ) : compatibleModels.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No compatible models available
          </div>
        ) : (
          <RadioGroup
            value={selectedModel?.model_hash}
            onValueChange={(hash) => {
              const model = compatibleModels.find((m) => m.model_hash === hash);
              if (model) onSelectModel(model);
            }}
          >
            {compatibleModels.map((model) => (
              <div
                key={model.model_hash}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent"
              >
                <RadioGroupItem
                  value={model.model_hash}
                  id={model.model_hash}
                />
                <Label
                  htmlFor={model.model_hash}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{model.model_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {model.provider} • {model.model_type}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
