import { useState, useEffect, useMemo, type JSX } from 'react';
import { useLazyQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Cpu, Settings2, Plus } from 'lucide-react';
import { GET_PROCESS_WITH_MODELS } from '@/graphql/workflow_queries';
import { PromptSelectionField } from './prompt-selection';
import { CreatePromptDialog } from '@/components/pipeline-configuration/create-prompt-dialog';

// --- Extracted Helper Functions ---

const toDisplayName = (raw: string | null | undefined) => {
  if (!raw) return '';
  const overrides: Record<string, string> = {
    event_detection: 'Event detection',
    video_preprocessing: 'Video Processing',
    vlm_inference: 'Transcript Generation',
  };
  if (overrides[raw]) return overrides[raw];

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const extractDefaultParams = (modelParams: Record<string, unknown>) => {
  if (!modelParams) return { temperature: 0.1, max_tokens: 1000 };

  // Check if it's a schema with properties (JSON Schema format)
  if (modelParams.properties && typeof modelParams.properties === 'object') {
    const defaults: Record<string, unknown> = {};
    Object.entries(modelParams.properties).forEach(([key, value]) => {
      if (
        value &&
        typeof value === 'object' &&
        (value as Record<string, unknown>).default !== undefined
      ) {
        defaults[key] = (value as Record<string, unknown>).default;
      }
    });
    return Object.keys(defaults).length > 0
      ? defaults
      : { temperature: 0.1, max_tokens: 1000 };
  }

  // Assume it's a direct key-value pair object
  return modelParams;
};

const extractDefaultsFromSchema = (schema: Record<string, unknown>) => {
  if (!schema?.properties) return {};
  const defaults: Record<string, unknown> = {};

  Object.entries(schema.properties as Record<string, unknown>).forEach(
    ([key, prop]) => {
      if (key === 'version') return; // Skip version field

      const propObj = prop as Record<string, unknown>;
      if (propObj.default !== undefined) {
        defaults[key] = propObj.default;
      } else if (propObj.type === 'integer' || propObj.type === 'number') {
        // If no default but has minimum, use minimum as fallback
        if (propObj.minimum !== undefined) {
          defaults[key] = propObj.minimum;
        }
      }

      // Handle nested objects like video_frames
      if (propObj.$ref && schema.$defs) {
        const defName = (propObj.$ref as string).split('/').pop();
        const def = (schema.$defs as Record<string, unknown>)[defName || ''];
        if (def && (def as Record<string, unknown>)?.properties) {
          const nestedDefaults: Record<string, unknown> = {};
          Object.entries(
            (def as Record<string, unknown>).properties as Record<
              string,
              unknown
            >
          ).forEach(([subKey, subProp]) => {
            const subPropObj = subProp as Record<string, unknown>;
            if (subPropObj.default !== undefined) {
              nestedDefaults[subKey] = subPropObj.default;
            } else if (
              subPropObj.type === 'integer' ||
              subPropObj.type === 'number'
            ) {
              // Use minimum as fallback if available
              if (subPropObj.minimum !== undefined) {
                nestedDefaults[subKey] = subPropObj.minimum;
              }
            }
          });
          if (Object.keys(nestedDefaults).length > 0) {
            defaults[key] = nestedDefaults;
          }
        }
      }
    }
  );
  return defaults;
};

// --- Extracted Components ---

export const ProcessConfigurationForm = ({
  schema,
  models,
  prompts,
  config,
  onChange,
  processName,
  onRefetchPrompts,
}: {
  schema: Record<string, unknown>;
  models: Record<string, unknown>[];
  prompts: Record<string, unknown>[];
  config: Record<string, unknown>;
  onChange: (
    newConfig: Record<string, unknown>,
    newMeta?: Record<string, unknown>
  ) => void;
  processName?: string;
  onRefetchPrompts?: () => Promise<void>;
}) => {
  const [isCreatePromptDialogOpen, setIsCreatePromptDialogOpen] =
    useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePromptCreated = async (prompt: any) => {
    console.log(
      '[ProcessConfigItem.handlePromptCreated] Prompt created:',
      prompt
    );

    // Auto-select the newly created prompt
    if (prompt && prompt.promptHash && prompt.promptType) {
      // Extract category from promptType (e.g., "event_detection/_/user" -> "user")
      const parts = prompt.promptType.split('/');
      const category = parts[parts.length - 1]; // Get last part (user, events_list, system, etc.)

      // Map category to config field name
      const fieldName = `${category}_prompt_hash`;

      console.log(
        '[ProcessConfigItem.handlePromptCreated] Auto-selecting prompt:',
        {
          category,
          fieldName,
          promptHash: prompt.promptHash,
          promptName: prompt.promptName,
        }
      );

      // Update config to select the new prompt
      onChange(
        { ...config, [fieldName]: prompt.promptHash },
        { [fieldName]: prompt.promptName }
      );
    }

    // Refetch to update the dropdown options
    if (onRefetchPrompts) {
      const promptsCountBefore = prompts.length;
      console.log(
        '[ProcessConfigItem.handlePromptCreated] Prompts before refetch:',
        promptsCountBefore
      );
      await onRefetchPrompts();
      console.log(
        '[ProcessConfigItem.handlePromptCreated] Refetch call completed'
      );
      toast.success('Prompt created and selected');
    } else {
      console.warn(
        '[ProcessConfigItem.handlePromptCreated] onRefetchPrompts callback not provided'
      );
      toast.success('Prompt created and selected');
    }
  };

  if (!schema?.properties) return null;

  // Sort fields: Model (0) -> Parameters (1) -> Prompts (2)
  const entries = Object.entries(schema.properties as Record<string, unknown>);
  const sortedEntries = entries.sort(([keyA], [keyB]) => {
    const getScore = (key: string) => {
      if (key === 'required_model_type') return 0;
      if (key.startsWith('required_') && key.endsWith('_prompt_types'))
        return 2;
      return 1; // Parameters
    };
    return getScore(keyA) - getScore(keyB);
  });

  const modelSection: JSX.Element[] = [];
  const parameterSections: JSX.Element[] = [];
  const promptSections: {
    key: string;
    label: string;
    element: JSX.Element;
    isEventsList: boolean;
    isUser: boolean;
  }[] = [];
  const otherSections: JSX.Element[] = [];

  sortedEntries.forEach(([key, prop]) => {
    if (key === 'version') return;

    // Model selector
    if (key === 'required_model_type') {
      if (models.length === 0) return;
      modelSection.push(
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium leading-none flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" /> Select Model
          </label>
          <Select
            value={(config.model_hash as string) || ''}
            onValueChange={(val) => {
              const selectedModel = models.find(
                (m: Record<string, unknown>) => m.modelHash === val
              );
              const params = extractDefaultParams(
                selectedModel?.modelDefaultParams as Record<string, unknown>
              );
              onChange({ ...config, model_hash: val, parameters: params });
            }}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((model: Record<string, unknown>) => (
                <SelectItem
                  key={model.modelHash as string}
                  value={model.modelHash as string}
                >
                  {model.modelName as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
      return;
    }

    // Prompt selectors (Events List / User / others)
    if (key.startsWith('required_') && key.endsWith('_prompt_types')) {
      const promptKey = key.replace('required_', '').replace('_types', '_hash');
      const rawPromptType = key
        .replace('required_', '')
        .replace('_prompt_types', '');
      const promptType = toDisplayName(rawPromptType);
      const label = `${promptType} prompts`;
      const propObj = prop as Record<string, unknown>;
      const requiredTypes = (propObj.default as string[]) || [];

      const element = (
        <PromptSelectionField
          key={key}
          label={label}
          requiredTypes={requiredTypes}
          accessiblePrompts={prompts}
          value={String(config[promptKey] || '')}
          selectedParentHash={String(
            config[`parent_${promptKey.replace(/_prompt_hash$/, '_hash')}`] ||
              ''
          )}
          onChange={(val, meta) => {
            const parentKey = String(promptKey).replace(
              /_prompt_hash$/,
              '_hash'
            );
            const parentPromptHash = String(meta?.parentPromptHash || '');
            onChange(
              {
                ...config,
                [promptKey]: val,
                ...(parentPromptHash
                  ? { [`parent_${parentKey}`]: parentPromptHash }
                  : {}),
              },
              { [promptKey]: meta?.promptName || '' }
            );
          }}
        />
      );

      const lowerLabel = label.toLowerCase();
      promptSections.push({
        key,
        label,
        element,
        isEventsList: lowerLabel.includes('events list'),
        isUser: lowerLabel.startsWith('user '),
      });
      return;
    }

    // Handle Video Frames (Nested Object)
    if (key === 'video_frames' && (prop as Record<string, unknown>).$ref) {
      const defName = ((prop as Record<string, unknown>).$ref as string)
        .split('/')
        .pop();
      const def = defName
        ? (schema.$defs as Record<string, Record<string, unknown>>)?.[defName]
        : undefined;
      if (!def || !(def as Record<string, unknown>).properties) return;

      otherSections.push(
        <div key={key} className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <label className="text-sm font-medium leading-none flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />{' '}
            {((prop as Record<string, unknown>).title as string | undefined) ||
              'Video Frames Configuration'}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(
              (def as Record<string, unknown>).properties as Record<
                string,
                unknown
              >
            ).map(([subKey, subProp]) => {
              const subPropObj = subProp as Record<string, unknown>;
              return (
                <div key={subKey} className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">
                    {(subPropObj.title as string | undefined) || subKey}
                    {((subPropObj.minimum as number | undefined) !==
                      undefined ||
                      (subPropObj.maximum as number | undefined) !==
                        undefined) && (
                      <span className="ml-1 opacity-70">
                        ({(subPropObj.minimum as number | undefined) ?? '0'} -{' '}
                        {(subPropObj.maximum as number | undefined) ?? '∞'})
                      </span>
                    )}
                  </label>
                  <Input
                    type="number"
                    className="h-9"
                    placeholder={String(subPropObj.default)}
                    min={subPropObj.minimum as number | undefined}
                    max={subPropObj.maximum as number | undefined}
                    value={String(
                      (config[key] as Record<string, unknown>)?.[subKey] || ''
                    )}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onChange({
                        ...config,
                        [key]: {
                          ...(config[key] as Record<string, unknown>),
                          [subKey]: isNaN(val) ? undefined : val,
                        },
                      });
                    }}
                  />
                  {subPropObj.description ? (
                    <p className="text-[10px] text-muted-foreground">
                      {String(subPropObj.description)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      );
      return;
    }

    // Simple scalar parameters (numbers / strings)
    const propObj = prop as Record<string, unknown>;
    if (
      propObj.type === 'integer' ||
      propObj.type === 'number' ||
      propObj.type === 'string'
    ) {
      parameterSections.push(
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium leading-none">
            {String(propObj.title || key)}
            {((propObj.minimum as number | undefined) !== undefined ||
              (propObj.maximum as number | undefined) !== undefined) && (
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                ({String(propObj.minimum ?? '0')} -{' '}
                {String(propObj.maximum ?? '∞')})
              </span>
            )}
          </label>
          <Input
            type={propObj.type === 'string' ? 'text' : 'number'}
            className="h-9"
            placeholder={String(propObj.default || '')}
            min={propObj.minimum as number | undefined}
            max={propObj.maximum as number | undefined}
            value={String(config[key] || '')}
            onChange={(e) => {
              let val: string | number = e.target.value;
              if (propObj.type === 'integer') val = parseInt(val);
              else if (propObj.type === 'number') val = parseFloat(val);
              onChange({
                ...config,
                [key]:
                  isNaN(Number(val)) && propObj.type !== 'string'
                    ? undefined
                    : val,
              });
            }}
          />
          {propObj.description ? (
            <p className="text-[11px] text-muted-foreground">
              {String(propObj.description)}
            </p>
          ) : null}
        </div>
      );
      return;
    }
  });

  // Split prompts: show "Events List prompts" directly under model,
  // keep all other prompts inside the Additional parameters group.
  const eventsPromptElements = promptSections
    .filter((p) => p.isEventsList)
    .map((p) => p.element);

  // Inside Additional parameters: "User prompts" first, then any other prompts.
  const orderedPromptElements = (() => {
    const nonEvents = promptSections.filter((p) => !p.isEventsList);
    if (nonEvents.length === 0) return [];
    const user = nonEvents.filter((p) => p.isUser);
    const others = nonEvents.filter((p) => !p.isUser);
    return [...user, ...others].map((p) => p.element);
  })();

  // Check if this is Transcript Generation pipeline
  const isTranscriptGeneration =
    processName?.toLowerCase().includes('vlm') ||
    processName?.toLowerCase().includes('transcript');

  // Check if there are any prompts to show
  const hasAnyPrompts =
    eventsPromptElements.length > 0 || orderedPromptElements.length > 0;

  return (
    <div className="space-y-6">
      {modelSection}

      {/* Prompts Configuration Header - Moved to top for better visibility */}
      {hasAnyPrompts && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Prompts Configuration
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatePromptDialogOpen(true)}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Prompt
            </Button>
          </div>
        </>
      )}

      {eventsPromptElements}
      {parameterSections}
      {otherSections}

      {orderedPromptElements.length > 0 && (
        <Accordion
          type="single"
          collapsible
          defaultValue="additional-params"
          className="border rounded-md"
        >
          <AccordionItem value="additional-params" className="border-0">
            <AccordionTrigger className="px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/50 transition-colors hover:no-underline">
              Additional parameters
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pl-1 pt-1 pb-4">
              {orderedPromptElements}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Create Prompt Dialog */}
      {hasAnyPrompts && (
        <CreatePromptDialog
          isOpen={isCreatePromptDialogOpen}
          onClose={() => setIsCreatePromptDialogOpen(false)}
          onPromptCreated={handlePromptCreated}
          processName={processName}
          showEventsListCategory={!isTranscriptGeneration}
        />
      )}
    </div>
  );
};

// Sub-component for configuring a single process
export const ProcessConfigItem = ({
  processHash,
  currentConfig,
  onConfigChange,
}: {
  processHash: string;
  currentConfig?: Record<string, unknown>;
  onConfigChange: (
    hash: string,
    config: Record<string, unknown>,
    meta: Record<string, unknown>
  ) => void;
}) => {
  const [getModels, { data, loading, error }] = useLazyQuery(
    GET_PROCESS_WITH_MODELS,
    {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    }
  );

  // Initialize state from currentConfig if available
  const [selectedModel, setSelectedModel] = useState<string>(
    (currentConfig?.model_hash as string | undefined) || ''
  );

  // Filter out model_hash and parameters from configValues as they are handled separately or derived
  const getInitialConfigValues = () => {
    if (!currentConfig) return {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { model_hash, parameters, ...rest } = currentConfig;
    return rest;
  };

  const [configValues, setConfigValues] = useState<Record<string, unknown>>(
    getInitialConfigValues()
  );
  const [promptMeta, setPromptMeta] = useState<Record<string, string>>({});

  // Note: promptMeta is repopulated by PromptSelectionField effects when components mount
  // so we don't need to complexly initialize it from the aggregated currentMeta string.

  useEffect(() => {
    getModels({ variables: { orgProcessHash: processHash } });
  }, [processHash, getModels]);

  const models = useMemo(
    () => data?.getProcessWithModels?.accessibleModels || [],
    [data]
  );

  const prompts = useMemo(
    () => data?.getProcessWithModels?.accessiblePrompts || [],
    [data]
  );

  const processName = data?.getProcessWithModels?.orgProcessName;

  const schema = data?.getProcessWithModels?.processParamSchema;

  const refetchPrompts = async () => {
    console.log(
      '[ProcessConfigItem.refetchPrompts] Calling getModels for processHash:',
      processHash?.substring(0, 8)
    );
    const result = await getModels({
      variables: { orgProcessHash: processHash },
    });
    console.log(
      '[ProcessConfigItem.refetchPrompts] Query completed, new prompts count:',
      result?.data?.getProcessWithModels?.accessiblePrompts?.length || 0
    );
  };

  // Log when prompts data changes (after refetch)
  useEffect(() => {
    if (prompts.length > 0) {
      console.log(
        '[ProcessConfigItem.prompts updated] Current prompts count:',
        prompts.length
      );
    }
  }, [prompts]);

  useEffect(() => {
    if (schema && Object.keys(configValues).length === 0) {
      const defaults = extractDefaultsFromSchema(schema);
      if (Object.keys(defaults).length > 0) {
        setConfigValues(defaults);
      }
    }
  }, [schema]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first model when models are loaded and none selected (match playground upload)
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const model = models[0] as Record<string, unknown>;
      setSelectedModel(model.modelHash as string);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    const config: Record<string, unknown> = {};
    const meta: Record<string, unknown> = {};

    if (selectedModel) {
      config.model_hash = selectedModel;
      const m = models.find(
        (m: Record<string, unknown>) => m.modelHash === selectedModel
      );
      if (m) {
        meta.modelName = m.modelName;
        config.parameters = extractDefaultParams(
          m.modelDefaultParams as Record<string, unknown>
        );
      }
    }

    // Merge other config values (prompts, scalar values)
    Object.entries(configValues).forEach(([key, val]) => {
      config[key] = val;
    });

    Object.entries(promptMeta).forEach(([promptKey, promptVersion]) => {
      if (promptVersion) {
        meta[promptKey + '_name'] = promptVersion;
      }
    });

    onConfigChange(processHash, config, meta);
  }, [
    selectedModel,
    configValues,
    promptMeta,
    processHash,
    onConfigChange,
    models,
  ]);

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
        Loading configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 text-destructive text-xs">
        Failed to load configuration: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProcessConfigurationForm
        schema={schema}
        models={models}
        prompts={prompts}
        config={{ ...configValues, model_hash: selectedModel }}
        processName={processName}
        onRefetchPrompts={refetchPrompts}
        onChange={(newConfig, newMeta) => {
          if ((newConfig.model_hash as string) !== selectedModel) {
            setSelectedModel(newConfig.model_hash as string);
          }
          // Separate model hash from other config values
          const { model_hash, parameters, ...rest } = newConfig;
          void model_hash; // unused
          void parameters; // unused
          setConfigValues(rest);
          if (newMeta) {
            setPromptMeta((prev) => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(newMeta).map(([k, v]) => [k, String(v)])
              ),
            }));
          }
        }}
      />
    </div>
  );
};
