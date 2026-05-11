import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, CheckCircle2, XCircle } from 'lucide-react';
import type {
  ProcessWithModels,
  Model,
  PromptVersion,
} from '@/types/workflow-types';

interface ConfigurationSummaryProps {
  process: ProcessWithModels;
  model: Model | null;
  prompts: {
    system?: PromptVersion;
    user?: PromptVersion;
    events_list?: PromptVersion;
  };
  targetType: 'camera' | 'batch';
  targetHash: string;
  isEnabled: boolean;
  onIsEnabledChange: (enabled: boolean) => void;
  onSave: () => void;
  saving: boolean;
}

export function ConfigurationSummary({
  process,
  model,
  prompts,
  targetType,
  targetHash,
  isEnabled,
  onIsEnabledChange,
  onSave,
  saving,
}: ConfigurationSummaryProps) {
  const isValid =
    model &&
    targetHash &&
    process.required_prompt_types.every(
      (type) => prompts[type as keyof typeof prompts]
    );

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Configuration Summary</CardTitle>
        <CardDescription>Review your workflow configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Process</div>
          <div className="text-sm text-muted-foreground">
            {process.process_name}
          </div>
        </div>

        <Separator />

        <div>
          <div className="text-sm font-medium mb-2 flex items-center">
            Model
            {model ? (
              <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 ml-2 text-red-500" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {model ? model.model_name : 'Not selected'}
          </div>
        </div>

        <Separator />

        <div>
          <div className="text-sm font-medium mb-2">Prompts</div>
          {process.required_prompt_types.map((type) => {
            const prompt = prompts[type as keyof typeof prompts];
            return (
              <div
                key={type}
                className="flex items-center justify-between text-sm mb-1"
              >
                <span className="text-muted-foreground">{type}:</span>
                {prompt ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <div>
          <div className="text-sm font-medium mb-2 flex items-center">
            Target
            {targetHash ? (
              <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 ml-2 text-red-500" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {targetHash
              ? `${targetType}: ${targetHash.substring(0, 12)}...`
              : 'Not selected'}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enable on Save</Label>
          <Switch
            id="enabled"
            checked={isEnabled}
            onCheckedChange={onIsEnabledChange}
          />
        </div>

        <Button
          onClick={onSave}
          disabled={!isValid || saving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>

        {!isValid && (
          <p className="text-xs text-destructive text-center">
            Please complete all required fields
          </p>
        )}
      </CardContent>
    </Card>
  );
}
