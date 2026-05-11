import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, FileText, Settings2 } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProcessConfigurationFormProps {
  schema: any;
  models: any[];
  prompts: any[];
  config: any;
  onChange: (newConfig: any, newMeta?: any) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toDisplayName = (name: string): string => {
  if (!name) return '';

  // Common overrides for known process names
  const overrides: Record<string, string> = {
    event_detection: 'Event detection',
    video_preprocessing: 'Video Processing',
    vlm_inference: 'Transcript Generation',
  };

  if (overrides[name]) return overrides[name];

  // Replace underscores, hyphens, and forward slashes with spaces
  return name
    .replace(/[_\-/]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ProcessConfigurationForm: React.FC<ProcessConfigurationFormProps> = ({
  schema,
  models,
  prompts,
  config,
  onChange,
}) => {
  if (!schema?.properties) return null;

  // Sort fields: Model (0) -> Parameters (1) -> Prompts (2)
  const entries = Object.entries(schema.properties);
  const sortedEntries = entries.sort(([keyA], [keyB]) => {
    const getScore = (key: string) => {
      if (key === 'required_model_type') return 0;
      if (key.startsWith('required_') && key.endsWith('_prompt_types'))
        return 2;
      return 1; // Parameters
    };
    return getScore(keyA) - getScore(keyB);
  });

  const extractDefaultParams = (modelParams: any) => {
    if (!modelParams) return {};
    if (modelParams.properties && typeof modelParams.properties === 'object') {
      const defaults: Record<string, any> = {};
      Object.entries(modelParams.properties).forEach(
        ([key, value]: [string, any]) => {
          if (
            value &&
            typeof value === 'object' &&
            value.default !== undefined
          ) {
            defaults[key] = value.default;
          }
        }
      );
      return defaults;
    }
    return modelParams;
  };

  return (
    <div className="space-y-6">
      {sortedEntries.map(([key, prop]: [string, any]) => {
        if (key === 'version') return null;

        // Model Selection
        if (key === 'required_model_type') {
          if (models.length === 0) return null;
          return (
            <div key={key} className="space-y-2">
              <Select
                value={config.model_hash || ''}
                onValueChange={(val) => {
                  const selectedModel = models.find(
                    (m: any) => m.modelHash === val
                  );
                  const params = extractDefaultParams(
                    selectedModel?.modelDefaultParams
                  );
                  onChange({ ...config, model_hash: val, parameters: params });
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choose a model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.modelHash} value={model.modelHash}>
                      {toDisplayName(model.modelName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        // Prompt Selection
        if (key.startsWith('required_') && key.endsWith('_prompt_types')) {
          const promptKey = key
            .replace('required_', '')
            .replace('_types', '_hash');
          const label = prop.title || key.replace(/_/g, ' ');
          const requiredTypes = prop.default || [];

          const availablePrompts = prompts.filter((p) =>
            requiredTypes.some(
              (t: string) => p.promptType === t || p.promptType?.startsWith(t)
            )
          );

          return (
            <div
              key={key}
              className="space-y-2 p-3 border rounded-md bg-background/50"
            >
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-2">
                  <FileText className="w-3 h-3" /> {label}
                </label>
                {prop.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{prop.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Select
                value={config[promptKey] || ''}
                onValueChange={(val) => {
                  const selected = prompts.find((p) => p.promptHash === val);
                  onChange(
                    { ...config, [promptKey]: val },
                    { [promptKey]: selected?.promptName || '' }
                  );
                }}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Select Instruction Template" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrompts.map((p: any) => (
                    <SelectItem
                      key={p.promptHash}
                      value={p.promptHash}
                      className="text-xs"
                    >
                      {toDisplayName(p.promptName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        // Handle nested objects (like video_frames with width, height)
        if (key === 'video_frames' && prop.$ref) {
          const defName = prop.$ref.split('/').pop();
          const def = schema.$defs?.[defName];
          if (!def?.properties) return null;

          return (
            <div
              key={key}
              className="space-y-3 p-4 border rounded-lg bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium leading-none flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  {prop.title || 'Video Frames Configuration'}
                </label>
                {prop.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{prop.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(def.properties).map(
                  ([subKey, subProp]: [string, any]) => (
                    <div key={subKey} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground font-medium">
                          {subProp.title || subKey}
                          {(subProp.minimum !== undefined ||
                            subProp.maximum !== undefined) && (
                            <span className="ml-1 opacity-70">
                              ({subProp.minimum ?? '0'} -{' '}
                              {subProp.maximum ?? '∞'})
                            </span>
                          )}
                        </label>
                        {subProp.description && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Info className="w-3 h-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  {subProp.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <Input
                        type="number"
                        className="h-9"
                        placeholder={String(subProp.default)}
                        min={subProp.minimum}
                        max={subProp.maximum}
                        value={config[key]?.[subKey] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          onChange({
                            ...config,
                            [key]: {
                              ...config[key],
                              [subKey]: isNaN(val) ? undefined : val,
                            },
                          });
                        }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          );
        }

        // Scalar parameters (integer, number, string)
        if (
          prop.type === 'integer' ||
          prop.type === 'number' ||
          prop.type === 'string'
        ) {
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium leading-none">
                  {key === 'temperature'
                    ? 'Response Randomness'
                    : key === 'max_tokens'
                      ? 'Max Response Length'
                      : prop.title || key}
                  {(prop.minimum !== undefined ||
                    prop.maximum !== undefined) && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({prop.minimum ?? '0'} - {prop.maximum ?? '∞'})
                    </span>
                  )}
                </label>
                {prop.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">{prop.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Input
                type={prop.type === 'string' ? 'text' : 'number'}
                className="h-9"
                placeholder={String(prop.default || '')}
                min={prop.minimum}
                max={prop.maximum}
                value={config[key] || ''}
                onChange={(e) => {
                  let val: any = e.target.value;
                  if (prop.type === 'integer') val = parseInt(val);
                  else if (prop.type === 'number') val = parseFloat(val);
                  onChange({
                    ...config,
                    [key]:
                      isNaN(val) && prop.type !== 'string' ? undefined : val,
                  });
                }}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default ProcessConfigurationForm;
