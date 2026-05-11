import { useState, useEffect, useMemo, type JSX } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
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
import { Cpu, Settings2, ChevronDown, Plus } from 'lucide-react';
import {
  GET_PROCESS_WITH_MODELS,
  GET_PROMPT_VERSIONS,
} from '@/graphql/workflow_queries';
import { PromptSelectionField } from './prompt-selection';
import { CreatePromptDialog } from './create-prompt-dialog';

import {
  toDisplayName,
  extractDefaultParams,
  extractDefaultsFromSchema,
  formatDisplayValue,
} from './utils';

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
    // FIRST: Refetch to update the dropdown options
    if (onRefetchPrompts) {
      await onRefetchPrompts();
    }

    // THEN: Auto-select the newly created prompt (after it's in the list)
    if (prompt && prompt.promptHash && prompt.promptType) {
      // Extract category from promptType (e.g., "event_detection/_/user" -> "user")
      const parts = prompt.promptType.split('/');
      const category = parts[parts.length - 1]; // Get last part (user, events_list, system, etc.)

      // Map category to config field name
      const fieldName = `${category}_prompt_hash`;

      // Update config to select the new prompt
      onChange(
        {
          ...config,
          [fieldName]: prompt.promptHash,
          [`parent_${String(fieldName).replace(/_prompt_hash$/, '_hash')}`]:
            prompt.parentPromptHash || prompt.promptHash,
        },
        { [fieldName]: prompt.promptName }
      );
    }

    toast.success('Prompt created and selected');
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

      const parentKey = String(promptKey).replace(/_prompt_hash$/, '_hash');
      const parentHashKey = `parent_${parentKey}`;
      const selectedParentHash = String(config[parentHashKey] || '');

      const element = (
        <PromptSelectionField
          key={key}
          label={label}
          requiredTypes={requiredTypes}
          accessiblePrompts={prompts}
          value={String(config[promptKey] || '')}
          selectedParentHash={selectedParentHash}
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

    // Handle oneOf options (dropdown)
    const propObj = prop as Record<string, unknown>;
    if (propObj.oneOf && Array.isArray(propObj.oneOf)) {
      parameterSections.push(
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium leading-none">
            {String(propObj.title || key)}
          </label>
          <Select
            value={String(config[key] || '')}
            onValueChange={(val) => {
              onChange({
                ...config,
                [key]: val,
              });
            }}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder={`Select ${propObj.title || key}...`} />
            </SelectTrigger>
            <SelectContent>
              {propObj.oneOf.map((option: Record<string, unknown>) => (
                <SelectItem
                  key={String(option.const)}
                  value={String(option.const)}
                >
                  {String(option.title || option.const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {propObj.description ? (
            <p className="text-[11px] text-muted-foreground">
              {String(propObj.description)}
            </p>
          ) : null}
        </div>
      );
      return;
    }

    // Simple scalar parameters (numbers / strings)
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
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!processName) {
                  toast.error(
                    'Process configuration is still loading. Please wait...'
                  );
                  return;
                }
                setIsCreatePromptDialogOpen(true);
              }}
              disabled={!processName}
              className="h-8"
              title={
                !processName
                  ? 'Please wait for process configuration to load'
                  : 'Create a new prompt template'
              }
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
  onRefetchPrompts,
}: {
  processHash: string;
  currentConfig?: Record<string, unknown>;
  onConfigChange: (
    hash: string,
    config: Record<string, unknown>,
    meta: Record<string, unknown>
  ) => void;
  onRefetchPrompts?: () => Promise<void>;
}) => {
  const [getModels, { data, loading, error }] = useLazyQuery(
    GET_PROCESS_WITH_MODELS,
    {
      // Prefer cache so upload flow does not refetch the same process twice (e.g. after
      // leaving Setup Configuration and returning). Explicit refetch uses network-only.
      fetchPolicy: 'cache-first',
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
    getModels({
      variables: { orgProcessHash: processHash },
      fetchPolicy: 'cache-first',
    });
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
    await getModels({
      variables: { orgProcessHash: processHash },
      fetchPolicy: 'network-only',
    });

    if (onRefetchPrompts) {
      // Allow parent to perform any additional refetching or cache updates
      await onRefetchPrompts();
    }
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

// Helper component that resolves a prompt version label (e.g. "v1 (Latest)")
// for a given prompt hash by fetching its sibling versions via the parent hash.
// Falls back to a provided name (typically the version display stored in meta).
const PromptVersionRow = ({
  typeLabel,
  promptHash,
  parentPromptHash,
  fallbackName,
}: {
  typeLabel: string;
  promptHash: string;
  parentPromptHash: string;
  fallbackName?: string;
}) => {
  const { data } = useQuery(GET_PROMPT_VERSIONS, {
    variables: {
      parentPromptHash: parentPromptHash || promptHash,
      page: 1,
      itemsPerPage: 1000,
    },
    skip: !(parentPromptHash || promptHash),
    fetchPolicy: 'cache-first',
  });

  const rawVersions =
    (data?.getPromptVersions as Record<string, unknown>[] | undefined) || [];
  // Reverse so newest is first (matches PromptSelectionField ordering)
  const versions = [...rawVersions].reverse();
  const idx = versions.findIndex(
    (v) => (v.promptHash as string | undefined) === promptHash
  );

  const versionDisplay =
    idx !== -1
      ? `v${versions.length - idx}${idx === 0 ? ' (Latest)' : ''}`
      : fallbackName || '-';

  return (
    <div className="flex gap-2">
      <span className="opacity-70 min-w-fit">{typeLabel} Prompts:</span>
      <span className="wrap-break-word">{versionDisplay}</span>
    </div>
  );
};

export const ReviewPipelineItem = ({
  processName,
  config,
  meta,
}: {
  processName: string;
  config: Record<string, unknown>;
  meta: Record<string, unknown>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const modelName = meta['modelName'];

  // Build the prompts list primarily from `config` (the source of truth) so
  // that selected versions always display — even if the meta["*_name"] entry
  // hasn't been populated yet (e.g. on first render before user interaction).
  // We fall back to meta values when the config-driven lookup isn't available.
  const prompts: {
    type: string;
    rawType: string;
    promptHash: string;
    parentPromptHash: string;
    fallbackName?: string;
  }[] = [];

  const seenRawTypes = new Set<string>();
  Object.entries(config).forEach(([key, value]) => {
    if (!key.endsWith('_prompt_hash')) return;
    if (typeof value !== 'string' || !value) return;

    const rawType = key.replace(/_prompt_hash$/, '');
    const parentKey = `parent_${rawType}_hash`;
    const parentPromptHash = String(config[parentKey] || value);

    seenRawTypes.add(rawType);
    prompts.push({
      type: toDisplayName(rawType),
      rawType,
      promptHash: String(value),
      parentPromptHash,
      fallbackName: meta[`${key}_name`] as string | undefined,
    });
  });

  // Preserve backward-compat: if some meta["*_name"] entries describe prompts
  // that aren't present in config (edge cases), surface them as fallbacks too.
  Object.entries(meta).forEach(([key, value]) => {
    if (
      !key.endsWith('_name') ||
      key.startsWith('model') ||
      typeof value !== 'string' ||
      !value
    ) {
      return;
    }
    const promptKeyWithoutName = key.replace(/_name$/, '');
    const rawType = promptKeyWithoutName.replace(/_prompt_hash$/, '');
    if (seenRawTypes.has(rawType)) return;

    prompts.push({
      type: toDisplayName(rawType),
      rawType,
      promptHash: '',
      parentPromptHash: '',
      fallbackName: value,
    });
  });

  // Sort prompts based on process type
  const sortedPrompts = [...prompts].sort((a, b) => {
    const isEventDetection =
      processName?.toLowerCase().includes('event_detection') ||
      processName?.toLowerCase().includes('event detection');

    const isTranscriptGeneration =
      processName?.toLowerCase().includes('vlm_inference') ||
      processName?.toLowerCase().includes('transcript');

    const getPromptOrder = (rawType: string): number => {
      const type = rawType.toLowerCase();

      if (isEventDetection) {
        // Event Detection: events_list (0) -> user (1) -> system (2)
        if (type.includes('events_list') || type.includes('events list'))
          return 0;
        if (type === 'user') return 1;
        if (type === 'system') return 2;
      } else if (isTranscriptGeneration) {
        // Transcript Generation: user (0) -> system (1)
        if (type === 'user') return 0;
        if (type === 'system') return 1;
      }

      // Default: keep original order
      return 999;
    };

    return getPromptOrder(a.rawType) - getPromptOrder(b.rawType);
  });

  const otherConfig = Object.entries(config).filter(
    ([key]) =>
      key !== 'model_hash' && key !== 'parameters' && !key.endsWith('_hash')
  );

  return (
    <div className="border rounded-md bg-background overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-sm">
          {toDisplayName(processName)}
        </span>
        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {isOpen && (
        <div className="p-3 border-t bg-muted/20 text-xs space-y-3">
          {!!modelName && (
            <div className="grid grid-cols-3 gap-4">
              <span className="text-muted-foreground font-medium">Model:</span>
              <span className="col-span-2 wrap-break-word">
                {String(modelName)}
              </span>
            </div>
          )}

          {sortedPrompts.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <span className="text-muted-foreground font-medium">
                Prompts:
              </span>
              <div className="col-span-2 space-y-2">
                {sortedPrompts.map((prompt, idx) =>
                  prompt.promptHash ? (
                    <PromptVersionRow
                      key={`${prompt.rawType}-${idx}`}
                      typeLabel={prompt.type}
                      promptHash={prompt.promptHash}
                      parentPromptHash={prompt.parentPromptHash}
                      fallbackName={prompt.fallbackName}
                    />
                  ) : (
                    <div
                      key={`${prompt.rawType}-${idx}`}
                      className="flex gap-2"
                    >
                      <span className="opacity-70 min-w-fit">
                        {prompt.type} Prompts:
                      </span>
                      <span className="wrap-break-word">
                        {prompt.fallbackName || '-'}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {!!config.parameters &&
            typeof config.parameters === 'object' &&
            Object.keys(config.parameters as Record<string, unknown>).length >
              0 && (
              <div className="grid grid-cols-3 gap-4">
                <span className="text-muted-foreground font-medium">
                  Parameters:
                </span>
                <div className="col-span-2 space-y-2">
                  {Object.entries(
                    config.parameters as Record<string, unknown>
                  ).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="opacity-70 min-w-fit">{key}:</span>
                      <span className="wrap-break-word">
                        {formatDisplayValue(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {otherConfig.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <span className="text-muted-foreground font-medium">Config:</span>
              <div className="col-span-2 space-y-2">
                {otherConfig.map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="opacity-70 capitalize min-w-fit">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span
                      className="wrap-break-word"
                      title={formatDisplayValue(val)}
                    >
                      {formatDisplayValue(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!modelName &&
            sortedPrompts.length === 0 &&
            (!config.parameters ||
              Object.keys(config.parameters as Record<string, unknown>)
                .length === 0) &&
            otherConfig.length === 0 && (
              <div className="text-muted-foreground italic">
                Default Configuration
              </div>
            )}
        </div>
      )}
    </div>
  );
};
