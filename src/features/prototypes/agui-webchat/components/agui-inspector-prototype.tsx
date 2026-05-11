import type {
  Model,
  Process,
  ProcessWithModels,
  PromptCategory,
  PromptHashes,
} from '@/types/workflow-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PromptTemplate } from '@/types/workflow-types';

interface AguiInspectorPrototypeProps {
  processes: Process[];
  selectedProcess: ProcessWithModels | null;
  processHash: string;
  onProcessHashChange: (hash: string) => void;

  camHash: string;
  onCamHashChange: (hash: string) => void;

  modelHash: string;
  onModelHashChange: (hash: string) => void;

  promptHashes: PromptHashes;
  onPromptHashChange: (category: PromptCategory, hash: string) => void;

  durationMinutes: string;
  onDurationMinutesChange: (minutes: string) => void;

  saving: boolean;
  canSave: boolean;
  onSave: () => void;
}

const promptHashField = (category: PromptCategory) => {
  switch (category) {
    case 'system':
      return 'system_prompt_hash' as const;
    case 'user':
      return 'user_prompt_hash' as const;
    case 'events_list':
      return 'events_list_prompt_hash' as const;
  }
};

const getPromptHash = (
  promptHashes: PromptHashes,
  category: PromptCategory
) => {
  const field = promptHashField(category);
  return promptHashes[field];
};

function normalizePromptOptions(
  prompts: PromptTemplate[],
  category: PromptCategory
) {
  return prompts
    .filter((p) => p.is_active && p.prompt_category === category)
    .map((p) => ({
      value: p.latest_version?.prompt_hash || '',
      label: p.prompt_name,
      version: p.latest_version?.version_number,
    }))
    .filter((p) => p.value);
}

export function AguiInspectorPrototype({
  processes,
  selectedProcess,
  processHash,
  onProcessHashChange,
  camHash,
  onCamHashChange,
  modelHash,
  onModelHashChange,
  promptHashes,
  onPromptHashChange,
  durationMinutes,
  onDurationMinutesChange,
  saving,
  canSave,
  onSave,
}: AguiInspectorPrototypeProps) {
  const requiredPromptTypes = selectedProcess?.required_prompt_types ?? [];
  const requiredModelTypes = selectedProcess?.required_model_types ?? [];

  const compatibleModels: Model[] = selectedProcess
    ? selectedProcess.accessible_models.filter(
        (m) => requiredModelTypes.includes(m.model_type) && m.is_active
      )
    : [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Workflow Inspector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="text-sm font-medium">Target Camera Hash</div>
          <Input
            placeholder="Enter live_cam_hash (cam_hash)"
            value={camHash}
            onChange={(e) => onCamHashChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Process</div>
          <Select value={processHash} onValueChange={onProcessHashChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a process" />
            </SelectTrigger>
            <SelectContent>
              {processes.map((p) => (
                <SelectItem key={p.process_hash} value={p.process_hash}>
                  {p.process_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProcess ? (
            <div className="text-xs text-muted-foreground">
              Required prompts:{' '}
              {selectedProcess.required_prompt_types.join(', ')}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Model</div>
          <Select value={modelHash} onValueChange={onModelHashChange}>
            <SelectTrigger disabled={!selectedProcess}>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {compatibleModels.map((m) => (
                <SelectItem key={m.model_hash} value={m.model_hash}>
                  {m.model_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProcess && requiredPromptTypes.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Required Prompts</div>
            {requiredPromptTypes.map((category) => {
              const options = normalizePromptOptions(
                selectedProcess.accessible_prompts,
                category
              );
              const value = getPromptHash(promptHashes, category) || '';
              return (
                <div key={category} className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {category === 'events_list'
                      ? 'Events List'
                      : category[0].toUpperCase() + category.slice(1)}
                  </div>
                  <Select
                    value={value}
                    onValueChange={(hash) => onPromptHashChange(category, hash)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select prompt version" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                          {opt.version ? ` (v${opt.version})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="text-sm font-medium">Chat Context (minutes)</div>
          <Input
            type="number"
            min={0.5}
            step={0.5}
            value={durationMinutes}
            onChange={(e) => onDurationMinutesChange(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            onClick={onSave}
            disabled={!canSave || saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save workflow config'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
