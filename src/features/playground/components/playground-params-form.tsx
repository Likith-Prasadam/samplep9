/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  PlayCircle,
  ChevronDown,
  CircleCheck,
  CircleX,
  CircleGauge,
  AlertTriangle,
  Layers,
  Loader2,
  Settings2,
  Save,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import './mdx-editor.css';
import {
  useMutation,
  useQuery,
  useLazyQuery,
  useApolloClient,
} from '@apollo/client';
import {
  GET_BATCH_PROCESS_CONFIGS,
  GET_BATCH_PROCESS_CONFIG,
  UPDATE_BATCH_PROCESS_CONFIG,
  TOGGLE_BATCH_PROCESS_CONFIG,
  // DELETE_BATCH_PROCESS_CONFIG,
  GET_PROCESS_WITH_MODELS,
  GET_PROCESS_CATALOG,
  // CREATE_BATCH_PROCESS_CONFIG,
  CREATE_BATCH_PROCESS_CONFIG,
} from '@/graphql/batch_mutations';
import {
  GET_PROMPT_BY_HASH,
  GET_PROMPT_VERSIONS,
} from '@/graphql/workflow_queries';
import { GET_ACCESSIBLE_PROMPTS_BY_TYPES } from '@/graphql/prompt_mutations';
import { toast } from 'sonner';
import type { BatchVideo } from '../types/batch-analysis';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Notification } from '@/features/notifications/types/notifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Regex to filter out schema constraint keys before persisting a config.
// Note: we deliberately KEEP `parent_*_hash` entries on both CREATE and
// UPDATE. They are needed by downstream views (Video Details read-only
// view, re-analyze preview) to resolve the "vN (Latest)" label for each
// selected prompt. This mirrors live-configuration.tsx's behaviour.
const SCHEMA_CONSTRAINT_KEYS = /^required_.*_types$|^required_model_type$/;

export interface ModelParameters {
  temperature: number;
  topP: number;
  repetitionPenalty: number;
  maxTokens: number;
  user_prompt: string;
  stop_token_ids: [];
  system_prompt_blob_uri: string;
}

interface ModelParametersFormProps {
  isOpen: boolean;
  parameters?: ModelParameters;
  setParameters?: React.Dispatch<React.SetStateAction<ModelParameters | any>>;
  onClose: () => void;
  video: BatchVideo;
  processBatch: (video: BatchVideo, newParams?: any) => Promise<void>;
  notifications?: Notification[];
  viewedNotifications?: Set<string>;
  onDeleteSuccess?: (id: number) => void;
  username?: string;
  mode?: 'view' | 'reanalyze';
  onConfigSaved?: () => void;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCreatedAt = (dateString: string): string => {
  const date = new Date(dateString.replace(' ', 'T'));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear() % 100;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${month.toString().padStart(2, '0')}/${day
    .toString()
    .padStart(2, '0')}/${year.toString().padStart(2, '0')} at ${displayHours
    .toString()
    .padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

import {
  toDisplayName,
  toDisplayName as formatProcessName,
  extractDefaultsFromSchema,
} from '@/components/pipeline-configuration/utils';
import { ProcessConfigurationForm } from '@/components/pipeline-configuration/process-config-item';

const StatusBadge = ({ status }: { status: string }) => {
  let variant: 'default' | 'destructive' | 'secondary' | 'outline' = 'outline';
  let text = 'Pending';
  let icon: React.ReactNode;

  switch (status) {
    case 'completed':
      variant = 'default';
      text = 'Completed';
      icon = <CircleCheck className="w-3 h-3 mr-1" />;
      break;
    case 'failed':
      variant = 'destructive';
      text = 'Failed';
      icon = <CircleX className="w-3 h-3 mr-1" />;
      break;
    case 'processing':
      variant = 'secondary';
      text = 'Processing';
      icon = <CircleGauge className="w-3 h-3 mr-1 animate-spin" />;
      break;
    case 'queued':
      variant = 'secondary';
      text = 'Queued';
      icon = <CircleGauge className="w-3 h-3 mr-1" />;
      break;
    default:
      variant = 'outline';
      text = 'Pending';
      icon = <AlertTriangle className="w-3 h-3 mr-1" />;
  }

  return (
    <Badge
      variant={variant}
      className="absolute top-2 right-2 z-10 flex items-center"
    >
      {icon}
      {text}
    </Badge>
  );
};

const AddPipelineDialog = ({
  isOpen,
  onClose,
  batchHash,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  batchHash: string;
  onSuccess: () => void;
}) => {
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: catalogData, loading: catalogLoading } =
    useQuery(GET_PROCESS_CATALOG);
  const [getOptions, { data: optionsData, loading: optionsLoading }] =
    useLazyQuery(GET_PROCESS_WITH_MODELS, {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });
  const [createConfig] = useMutation(CREATE_BATCH_PROCESS_CONFIG);

  useEffect(() => {
    if (selectedProcess) {
      getOptions({ variables: { orgProcessHash: selectedProcess } });
      setLocalConfig({});
    }
  }, [selectedProcess, getOptions]);

  // Auto-select video_preprocessing as default
  useEffect(() => {
    if (isOpen && catalogData?.getProcessCatalog && !selectedProcess) {
      const defaultProc = catalogData.getProcessCatalog.find(
        (p: any) => p.orgProcessName === 'video_preprocessing'
      );
      if (defaultProc) {
        setSelectedProcess(defaultProc.orgProcessHash);
      }
    }
  }, [isOpen, catalogData, selectedProcess]);

  // Reset state when dialog closes to ensure default selection logic runs again on next open
  useEffect(() => {
    if (!isOpen) {
      setSelectedProcess('');
      setLocalConfig({});
    }
  }, [isOpen]);

  const models = useMemo(
    () => optionsData?.getProcessWithModels?.accessibleModels || [],
    [optionsData]
  );

  const prompts = useMemo(
    () => optionsData?.getProcessWithModels?.accessiblePrompts || [],
    [optionsData]
  );

  const schema = optionsData?.getProcessWithModels?.processParamSchema;
  const processName = optionsData?.getProcessWithModels?.orgProcessName;

  useEffect(() => {
    if (schema && Object.keys(localConfig).length === 0) {
      const defaults = extractDefaultsFromSchema(schema);
      if (Object.keys(defaults).length > 0) {
        setLocalConfig(defaults);
      }
    }
  }, [schema]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback to refetch prompts after creating a new one
  const handleRefetchPrompts = async () => {
    if (selectedProcess) {
      await getOptions({ variables: { orgProcessHash: selectedProcess } });
    }
  };

  const handleSave = async () => {
    if (!selectedProcess) return;

    // Basic validation: Check if we have selections for displayed prompts
    const missingFields: string[] = [];
    if (schema?.properties) {
      Object.entries(schema.properties).forEach(
        ([key, prop]: [string, any]) => {
          if (key === 'required_model_type' && !localConfig.model_hash) {
            missingFields.push('Model');
          }
          if (key.startsWith('required_') && key.endsWith('_prompt_types')) {
            const promptKey = key
              .replace('required_', '')
              .replace('_types', '_hash');
            if (!localConfig[promptKey]) {
              missingFields.push(prop.title || 'Prompt');
            }
          }
        }
      );
    }

    if (missingFields.length > 0) {
      toast.error(`Please select required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      // For CREATE operations: Filter out schema constraints only. We keep
      // `parent_*_hash` entries so downstream views can resolve which prompt
      // version was selected (same behaviour as UPDATE).
      const cleanConfig = Object.fromEntries(
        Object.entries(localConfig).filter(
          ([k]) => !SCHEMA_CONSTRAINT_KEYS.test(k)
        )
      );

      await createConfig({
        variables: {
          input: {
            batchHash: batchHash,
            orgProcessHash: selectedProcess,
            processConfig: cleanConfig,
            isEnabled: true,
          },
        },
      });
      toast.success('Pipeline added successfully');
      onSuccess();
      onClose();
      setSelectedProcess('');
      setLocalConfig({});
    } catch (e: any) {
      toast.error(`Failed to add pipeline: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Processing Pipeline
          </DialogTitle>
          <DialogDescription>
            Configure a new processing pipeline for this batch.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                Select Process
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex text-muted-foreground hover:text-foreground cursor-pointer shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      Choose a processing pipeline to add to this batch.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger>
                <SelectValue placeholder="Select a process..." />
              </SelectTrigger>
              <SelectContent>
                {catalogLoading ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  catalogData?.getProcessCatalog?.map((p: any) => (
                    <SelectItem key={p.orgProcessHash} value={p.orgProcessHash}>
                      {formatProcessName(p.orgProcessName)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProcess && (
            <div className="p-4 border rounded-lg bg-card/50 shadow-sm">
              {optionsLoading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading
                  options...
                </div>
              ) : (
                <ProcessConfigurationForm
                  schema={schema}
                  models={models}
                  prompts={prompts}
                  config={localConfig}
                  onChange={setLocalConfig}
                  processName={processName}
                  onRefetchPrompts={handleRefetchPrompts}
                />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Close without saving.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting || !selectedProcess}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Pipeline
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  Save and add this pipeline to the batch.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Compact prompt-version label resolved via GET_PROMPT_VERSIONS.
// Mirrors the ordering used by PromptSelectionField (newest first after reverse)
// so the label stays consistent with what the user picks from the dropdown.
const PromptVersionBadge = ({
  typeLabel,
  promptHash,
  parentPromptHash,
}: {
  typeLabel: string;
  promptHash: string;
  parentPromptHash: string;
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
    (data?.getPromptVersions as
      | Array<{ promptHash?: string; promptName?: string }>
      | undefined) || [];
  const versions = [...rawVersions].reverse();
  const idx = versions.findIndex((v) => v.promptHash === promptHash);
  const versionLabel =
    idx !== -1
      ? `v${versions.length - idx}${idx === 0 ? ' (Latest)' : ''}`
      : '';

  if (!versionLabel) return null;

  return (
    <Badge
      variant="outline"
      className="text-[10px] font-normal px-1.5 py-0 h-5 bg-background/60"
    >
      <span className="opacity-70 mr-1">{typeLabel}:</span>
      {versionLabel}
    </Badge>
  );
};

// Summarises all selected prompt versions for a pipeline config, rendered as a
// compact row of badges below the pipeline name (used in the collapsed header
// of PipelineConfigItem so users can see selections without expanding).
const PipelinePromptVersionsSummary = ({
  processName,
  processConfig,
}: {
  processName?: string;
  processConfig: Record<string, unknown> | null | undefined;
}) => {
  if (!processConfig) return null;

  const prompts: {
    type: string;
    rawType: string;
    promptHash: string;
    parentPromptHash: string;
  }[] = [];

  Object.entries(processConfig).forEach(([key, value]) => {
    if (!key.endsWith('_prompt_hash')) return;
    if (typeof value !== 'string' || !value) return;
    const rawType = key.replace(/_prompt_hash$/, '');
    const parentKey = `parent_${rawType}_hash`;
    const parentPromptHash = String(processConfig[parentKey] || value);
    prompts.push({
      type: toDisplayName(rawType),
      rawType,
      promptHash: String(value),
      parentPromptHash,
    });
  });

  if (prompts.length === 0) return null;

  // Match ordering used in ReviewPipelineItem for consistency.
  const nameLower = (processName || '').toLowerCase();
  const isEventDetection =
    nameLower.includes('event_detection') ||
    nameLower.includes('event detection');
  const isTranscriptGeneration =
    nameLower.includes('vlm_inference') || nameLower.includes('transcript');

  const getOrder = (rawType: string): number => {
    const type = rawType.toLowerCase();
    if (isEventDetection) {
      if (type.includes('events_list') || type.includes('events list'))
        return 0;
      if (type === 'user') return 1;
      if (type === 'system') return 2;
    } else if (isTranscriptGeneration) {
      if (type === 'user') return 0;
      if (type === 'system') return 1;
    }
    return 999;
  };

  const sortedPrompts = [...prompts].sort(
    (a, b) => getOrder(a.rawType) - getOrder(b.rawType)
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-10">
      {sortedPrompts.map((p) => (
        <PromptVersionBadge
          key={p.rawType}
          typeLabel={p.type}
          promptHash={p.promptHash}
          parentPromptHash={p.parentPromptHash}
        />
      ))}
    </div>
  );
};

const PipelineConfigItem = ({
  configSummary,
  onUpdate,
  isExpanded,
  onToggle,
  showToggle = true,
  variant = 'default',
  onSaved,
}: {
  configSummary: {
    batchProcessConfigHash: string;
    orgProcessHash: string;
    orgProcessName: string;
    isEnabled: boolean;
  };
  onUpdate: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  variant?: 'default' | 'simple';
  onSaved?: () => void;
}) => {
  const [localConfig, setLocalConfig] = useState<any>({});

  const [getDetails, { data: detailsData, loading: detailsLoading }] =
    useLazyQuery(GET_BATCH_PROCESS_CONFIG);
  const [getOptions, { data: optionsData, loading: optionsLoading }] =
    useLazyQuery(GET_PROCESS_WITH_MODELS, {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    });

  const [updateConfig, { loading: updating }] = useMutation(
    UPDATE_BATCH_PROCESS_CONFIG
  );
  const [toggleConfig, { loading: toggling }] = useMutation(
    TOGGLE_BATCH_PROCESS_CONFIG
  );

  // Always fetch config details so we can render a prompt-version summary in
  // the collapsed header. `useLazyQuery` defaults to cache-first so the
  // subsequent trigger on expansion simply reuses cached data.
  useEffect(() => {
    getDetails({
      variables: {
        batchProcessConfigHash: configSummary.batchProcessConfigHash,
      },
    });
  }, [configSummary.batchProcessConfigHash, getDetails]);

  useEffect(() => {
    if (isExpanded) {
      getOptions({
        variables: { orgProcessHash: configSummary.orgProcessHash },
      });
    }
  }, [isExpanded, configSummary.orgProcessHash, getOptions]);

  useEffect(() => {
    if (detailsData?.getBatchProcessConfig?.processConfig) {
      setLocalConfig(detailsData.getBatchProcessConfig.processConfig);
    }
  }, [detailsData]);

  const handleToggle = async (checked: boolean) => {
    try {
      await toggleConfig({
        variables: {
          batchProcessConfigHash: configSummary.batchProcessConfigHash,
          isEnabled: checked,
        },
      });
      onUpdate();
      toast.success(`Pipeline ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle pipeline');
    }
  };

  const handleSave = async () => {
    try {
      // For UPDATE operations: Filter out only schema constraints, but KEEP parent_*_hash fields
      // Parent hashes are sent to backend for UI tracking (to show which prompt version is selected)
      // This matches the pattern in live-configuration.tsx
      const SCHEMA_CONSTRAINT_KEYS_UPDATE =
        /^required_.*_types$|^required_model_type$/;
      const cleanConfig = Object.fromEntries(
        Object.entries(localConfig).filter(
          ([k]) => !SCHEMA_CONSTRAINT_KEYS_UPDATE.test(k)
        )
      );

      await updateConfig({
        variables: {
          input: {
            batchProcessConfigHash: configSummary.batchProcessConfigHash,
            processConfig: cleanConfig,
          },
        },
      });

      onUpdate();
      toast.success('Configuration updated');
      if (onSaved) {
        onSaved();
      }
    } catch {
      toast.error('Failed to update configuration');
    }
  };

  const models = optionsData?.getProcessWithModels?.accessibleModels || [];
  const prompts = optionsData?.getProcessWithModels?.accessiblePrompts || [];
  const schema = optionsData?.getProcessWithModels?.processParamSchema;
  const processName = optionsData?.getProcessWithModels?.orgProcessName;

  // Callback to refetch prompts after creating a new one
  const handleRefetchPrompts = async () => {
    if (configSummary.orgProcessHash) {
      await getOptions({
        variables: { orgProcessHash: configSummary.orgProcessHash },
      });
    }
  };

  const showHeader = variant === 'default';
  const showBody = variant === 'default' ? isExpanded : true;

  return (
    <div
      className={
        variant === 'default'
          ? 'border rounded-xl bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden'
          : 'space-y-6'
      }
    >
      {showHeader && (
        <div
          className="p-4 flex items-start justify-between cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
          onClick={onToggle}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-full ${configSummary.isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
              >
                <Settings2 className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm text-foreground">
                {formatProcessName(configSummary.orgProcessName)}
              </span>
            </div>
            <PipelinePromptVersionsSummary
              processName={configSummary.orgProcessName}
              processConfig={
                detailsData?.getBatchProcessConfig?.processConfig || localConfig
              }
            />
          </div>
          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {showToggle && (
              <>
                <Switch
                  checked={configSummary.isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={toggling}
                  className="data-[state=checked]:bg-primary"
                />
                <div className="h-4 w-px bg-border mx-1" />
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 rounded-full hover:bg-background"
              onClick={onToggle}
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>
        </div>
      )}

      {showBody && (
        <div
          className={
            variant === 'default'
              ? 'p-4 border-t bg-background/50 space-y-6 animate-in slide-in-from-top-2 duration-200'
              : 'space-y-6'
          }
        >
          {variant === 'default' && (
            <div className="flex items-center justify-between pb-2 border-b">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Configuration
              </h5>
            </div>
          )}

          {detailsLoading || optionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <ProcessConfigurationForm
                schema={schema}
                models={models}
                prompts={prompts}
                config={localConfig}
                onChange={(newConfig) => {
                  setLocalConfig(newConfig);
                }}
                processName={processName}
                onRefetchPrompts={handleRefetchPrompts}
              />

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updating}
                  className="min-w-[120px]"
                >
                  {updating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PipelinePreviewCard = ({
  configSummary,
  catalogPipelines,
}: {
  configSummary: {
    batchProcessConfigHash: string;
    orgProcessHash: string;
    orgProcessName: string;
    isEnabled: boolean;
  };
  catalogPipelines: any[];
}) => {
  const apolloClient = useApolloClient();
  const { data, loading } = useQuery(GET_BATCH_PROCESS_CONFIG, {
    variables: { batchProcessConfigHash: configSummary.batchProcessConfigHash },
    fetchPolicy: 'network-only',
  });
  const { data: optionsData, loading: optionsLoading } = useQuery(
    GET_PROCESS_WITH_MODELS,
    {
      variables: { orgProcessHash: configSummary.orgProcessHash },
      fetchPolicy: 'cache-first',
    }
  );

  const process = catalogPipelines.find(
    (p: any) => p.orgProcessHash === configSummary.orgProcessHash
  );
  const displayName = formatProcessName(
    (process?.orgProcessName as string | undefined) ||
      configSummary.orgProcessName
  );

  const processConfig = data?.getBatchProcessConfig?.processConfig as
    | Record<string, unknown>
    | undefined;

  const schema = optionsData?.getProcessWithModels?.processParamSchema as
    | Record<string, unknown>
    | undefined;
  const models =
    (optionsData?.getProcessWithModels?.accessibleModels as
      | any[]
      | undefined) ?? [];
  const prompts =
    (optionsData?.getProcessWithModels?.accessiblePrompts as
      | any[]
      | undefined) ?? [];
  const { data: accessibleByTypeData } = useQuery(
    GET_ACCESSIBLE_PROMPTS_BY_TYPES,
    {
      variables: {
        promptTypes: ['system', 'user', 'events_list'],
        itemsPerPage: 1000,
        page: 1,
      },
      fetchPolicy: 'cache-first',
    }
  );
  const accessibleByType = useMemo(
    () =>
      (accessibleByTypeData?.getAccessiblePromptsByTypes as
        | Array<{
            promptHash?: string;
            parentPromptHash?: string | null;
            promptType?: string;
          }>
        | undefined) || [],
    [accessibleByTypeData]
  );
  // In-card caches to avoid re-querying prompt versions repeatedly.
  const versionsByParentRef = useRef<
    Record<string, Array<{ promptHash?: string }>>
  >({});
  const versionLabelByPromptRef = useRef<Record<string, string>>({});
  const versionsByParentInFlightRef = useRef<
    Record<string, Promise<Array<{ promptHash?: string }>>>
  >({});

  const inferTypeToken = (
    pType?: string,
    fallbackLabel?: string
  ): 'system' | 'user' | 'events_list' => {
    const source = `${pType || ''} ${fallbackLabel || ''}`.toLowerCase();
    if (source.includes('events_list') || source.includes('events list')) {
      return 'events_list';
    }
    if (source.includes('system')) return 'system';
    return 'user';
  };

  const typeMatches = (pType?: string, requested?: string) => {
    if (!requested) return true;
    if (!pType) return false;
    return (
      pType === requested ||
      pType.startsWith(requested) ||
      pType.endsWith(requested) ||
      pType.includes(`/${requested}`) ||
      pType.includes(`__${requested}`)
    );
  };

  const PromptPreviewValue = ({
    promptHash,
    parentPromptHash,
    label,
  }: {
    promptHash: string;
    parentPromptHash?: string;
    label: string;
  }) => {
    const { data: pData, loading: pLoading } = useQuery(GET_PROMPT_BY_HASH, {
      variables: { promptHash },
      skip: !promptHash,
      fetchPolicy: 'cache-first',
    });

    const prompt = pData?.getPromptByHash as
      | {
          promptName?: string;
          promptContent?: string;
          promptType?: string;
        }
      | undefined;

    const promptName =
      (prompts.find((p: any) => p.promptHash === promptHash)?.promptName as
        | string
        | undefined) ||
      prompt?.promptName ||
      'Selected prompt';

    const promptTypeToken = inferTypeToken(prompt?.promptType, label);
    const derivedParentFromAccessible = accessibleByType.find(
      (p) => p.promptHash === promptHash
    )?.parentPromptHash;

    const [versionTag, setVersionTag] = useState('');
    const [versionsLoading, setVersionsLoading] = useState(false);

    useEffect(() => {
      let cancelled = false;
      const resolveVersionTag = async () => {
        if (!promptHash) {
          if (!cancelled) setVersionTag('');
          return;
        }
        const cachedLabel = versionLabelByPromptRef.current[promptHash];
        if (cachedLabel) {
          if (!cancelled) setVersionTag(cachedLabel);
          return;
        }
        setVersionsLoading(true);
        const resolveFromParent = async (parentHash: string) => {
          const cached = versionsByParentRef.current[parentHash];
          const raw = cached
            ? cached
            : (await (versionsByParentInFlightRef.current[parentHash] ||
                (versionsByParentInFlightRef.current[parentHash] = apolloClient
                  .query({
                    query: GET_PROMPT_VERSIONS,
                    variables: {
                      parentPromptHash: parentHash,
                      page: 1,
                      itemsPerPage: 1000,
                    },
                    fetchPolicy: 'cache-first',
                  })
                  .then(
                    (res) =>
                      (res.data?.getPromptVersions as
                        | Array<{ promptHash?: string }>
                        | undefined) || []
                  )
                  .finally(() => {
                    delete versionsByParentInFlightRef.current[parentHash];
                  })))) || [];
          if (!cached) {
            versionsByParentRef.current[parentHash] = raw;
          }
          if (raw.length === 0) return '';
          const ordered = [...raw].reverse();
          const idx = ordered.findIndex((pv) => pv.promptHash === promptHash);
          if (idx === -1) return '';
          return `v${ordered.length - idx}${idx === 0 ? ' (Latest)' : ''}`;
        };

        try {
          // 1) Direct candidates first (fast path)
          const candidates = [
            parentPromptHash,
            derivedParentFromAccessible as string | undefined,
            promptHash,
          ].filter(
            (v, i, arr): v is string =>
              typeof v === 'string' && !!v && arr.indexOf(v) === i
          );
          for (const c of candidates) {
            try {
              const tag = await resolveFromParent(c);
              if (tag) {
                versionLabelByPromptRef.current[promptHash] = tag;
                if (!cancelled) setVersionTag(tag);
                return;
              }
            } catch {
              // try next candidate
            }
          }

          // 2) Brute-force search over template parents from accessible list.
          // Prefer true parent hashes; only fall back to process prompts if the
          // accessible list is empty.
          const accessibleParents = accessibleByType
            .filter((p) => typeMatches(p?.promptType, promptTypeToken))
            .map(
              (p) =>
                (p.parentPromptHash as string | null | undefined) ||
                (p.promptHash as string | undefined)
            )
            .filter((v): v is string => typeof v === 'string' && !!v);
          const processPromptParents =
            accessibleParents.length === 0
              ? (prompts as Array<any>)
                  .filter((p) =>
                    typeMatches(p?.promptType as string, promptTypeToken)
                  )
                  .map((p) => p?.promptHash as string | undefined)
                  .filter((v): v is string => typeof v === 'string' && !!v)
              : [];
          const parentHashes = Array.from(
            new Set(
              [...accessibleParents, ...processPromptParents].filter(
                (v): v is string => typeof v === 'string' && !!v
              )
            )
          );
          for (const parent of parentHashes) {
            try {
              const tag = await resolveFromParent(parent);
              if (tag) {
                versionLabelByPromptRef.current[promptHash] = tag;
                if (!cancelled) setVersionTag(tag);
                return;
              }
            } catch {
              // continue searching
            }
          }

          if (!cancelled) setVersionTag('');
        } finally {
          if (!cancelled) setVersionsLoading(false);
        }
      };

      resolveVersionTag();
      return () => {
        cancelled = true;
      };
    }, [
      promptHash,
      parentPromptHash,
      derivedParentFromAccessible,
      promptTypeToken,
    ]);

    const content = String(prompt?.promptContent || '');
    const normalizePromptContent = (raw: string): string => {
      const trimmedRaw = raw.trim();
      if (!trimmedRaw) return raw;

      // Some prompt contents come back as JSON-encoded strings
      // (e.g. "\"line1\\nline2\""). Decode once for cleaner display.
      try {
        const parsed = JSON.parse(trimmedRaw) as unknown;
        if (typeof parsed === 'string') return parsed;
      } catch {
        // ignore parse failures; keep original content
      }
      return raw;
    };

    const formatStructuredPromptText = (raw: string): string => {
      if (!raw) return '';
      let text = raw.replace(/\r\n/g, '\n').trim();

      // If backend flattens multiline prompts into a single line with double
      // spaces, restore readable block breaks.
      text = text.replace(/ {2,}/g, '\n\n');

      // Ensure major section headers start on a fresh block.
      const sectionHeaders = [
        'IDENTITY AND PERSPECTIVE:',
        'DETECTION RULES:',
        'OUTPUT FORMAT:',
        'CONFIDENCE SCORING:',
        'TITLE AND DESCRIPTION GUIDELINES:',
        'STRICT CONSTRAINTS:',
      ];
      for (const header of sectionHeaders) {
        text = text.replace(
          new RegExp(`\\s*${header}\\s*`, 'g'),
          `\n\n${header}\n`
        );
      }

      // Split numbered rules onto separate lines.
      text = text.replace(/\s(\d+\.)\s/g, '\n$1 ');
      // Split hyphen bullets onto separate lines.
      text = text.replace(/\s-\s/g, '\n- ');

      // Display-only cleanup: template placeholders like {events_list},
      // {vlm_summary}, [thing] are valid prompt tokens but visually noisy in UI.
      // Convert them to angle-bracket placeholders for better readability.
      text = text.replace(/\{([^{}\n]+)\}/g, '<$1>');
      text = text.replace(/\[([^[\]\n]+)\]/g, '<$1>');

      // Clean up accidental 3+ blank lines.
      text = text.replace(/\n{3,}/g, '\n\n');
      return text.trim();
    };
    const normalizedContent = normalizePromptContent(content);
    const trimmed = normalizedContent.trim();
    const jsonParse = (() => {
      if (!trimmed) return { parsed: null as unknown, pretty: '' };

      // Try parse JSON (either direct JSON or escaped-JSON like {\"key\":\"value\"})
      const candidates: string[] = [trimmed];
      if (/\\"/.test(trimmed)) {
        candidates.push(trimmed.replace(/\\"/g, '"'));
      }

      for (const c of candidates) {
        try {
          const parsed = JSON.parse(c) as unknown;
          if (parsed && typeof parsed === 'object') {
            return { parsed, pretty: JSON.stringify(parsed, null, 2) };
          }
        } catch {
          // ignore
        }
      }

      return { parsed: null as unknown, pretty: trimmed };
    })();

    const prettyContent = jsonParse.pretty;
    const structuredPrettyContent = formatStructuredPromptText(prettyContent);

    const isSystemPrompt =
      label.toLowerCase().includes('system prompt') ||
      (prompt?.promptType || '').toLowerCase().includes('system_prompt');
    const isEventsList =
      (prompt?.promptType || '').toLowerCase().includes('events_list') ||
      label.toLowerCase().includes('events list');

    const events = isEventsList
      ? normalizedContent
          .replace(/\r\n/g, '\n')
          .replace(/\n/g, ',')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const renderSystemPrompt = (parsed: unknown) => {
      const root = parsed as Record<string, unknown> | null;
      if (!root || typeof root !== 'object') return null;

      const getString = (k: string) =>
        typeof root[k] === 'string' ? (root[k] as string) : '';

      const response =
        (root.Response as Record<string, unknown> | undefined) ?? null;

      const Section = ({
        title,
        children,
      }: {
        title: string;
        children: React.ReactNode;
      }) => (
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground">{title}</div>
          <div className="text-[11px] leading-relaxed text-foreground whitespace-pre-wrap wrap-break-word">
            {children}
          </div>
        </div>
      );

      const renderUnknown = (value: unknown, depth = 0): React.ReactNode => {
        if (depth > 4) return null;
        if (value == null) return null;
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return <span>{String(value)}</span>;
        }
        if (Array.isArray(value)) {
          return (
            <ul className="list-disc pl-5 space-y-1">
              {value.slice(0, 50).map((item, idx) => (
                <li key={idx}>{renderUnknown(item, depth + 1)}</li>
              ))}
            </ul>
          );
        }
        if (typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          return (
            <div className="space-y-2">
              {Object.entries(obj)
                .slice(0, 50)
                .map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <div className="text-[10px] font-medium text-muted-foreground">
                      {k}
                    </div>
                    <div className="text-[11px] text-foreground">
                      {renderUnknown(v, depth + 1)}
                    </div>
                  </div>
                ))}
            </div>
          );
        }
        return null;
      };

      const context = getString('Context');
      const objective = getString('Objective');
      const style = getString('Style');
      const tone = getString('Tone');
      const audience = getString('Audience');

      return (
        <div className="space-y-4">
          {context && <Section title="Context">{context}</Section>}
          {/* Intentionally hide Camera_Metadata in Playground preview to avoid mixing
              live camera concepts into batch (Playground) UX. */}
          {objective && <Section title="Objective">{objective}</Section>}
          {style && <Section title="Style">{style}</Section>}
          {tone && <Section title="Tone">{tone}</Section>}
          {audience && <Section title="Audience">{audience}</Section>}

          {response && (
            <details className="rounded-lg border bg-muted/10 p-3">
              <summary className="cursor-pointer text-xs font-semibold text-foreground">
                Response rules & format
              </summary>
              <div className="mt-3 text-[11px] text-foreground whitespace-pre-wrap wrap-break-word">
                {renderUnknown(response)}
              </div>
            </details>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="rounded-lg border bg-background/40 p-3 shadow-sm">
          {promptName && (
            <div className="mb-2 flex items-center justify-between gap-3">
              <Badge
                variant="secondary"
                className="text-[10px] font-medium px-2 py-0.5 h-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
              >
                {promptName}
              </Badge>
              {versionTag && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold px-2 py-0.5 h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 whitespace-nowrap"
                >
                  {versionTag}
                </Badge>
              )}
            </div>
          )}
          {versionsLoading && (
            <div className="text-[11px] text-muted-foreground">
              Loading version…
            </div>
          )}
          {pLoading ? (
            <div className="text-xs text-muted-foreground mt-2">Loading…</div>
          ) : isEventsList && events.length > 0 ? (
            <div className={isSystemPrompt ? '' : 'mt-2'}>
              <div className="flex flex-wrap gap-2">
                {events.map((e, idx) => (
                  <span
                    key={`${e}-${idx}`}
                    className="px-2 py-1 rounded-md border border-border bg-muted/20 text-xs text-foreground"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          ) : structuredPrettyContent ? (
            isSystemPrompt && jsonParse.parsed ? (
              <ScrollArea className="max-h-[55vh] overflow-hidden">
                {renderSystemPrompt(jsonParse.parsed) ?? (
                  <pre
                    className="text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word font-mono text-foreground overflow-x-hidden"
                    style={{
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {structuredPrettyContent}
                  </pre>
                )}
              </ScrollArea>
            ) : (
              <ScrollArea
                className={
                  isSystemPrompt
                    ? 'max-h-72 overflow-hidden'
                    : 'mt-2 max-h-56 overflow-hidden'
                }
              >
                <div
                  className="text-xs leading-relaxed whitespace-pre-wrap wrap-break-word text-foreground overflow-x-hidden"
                  style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {structuredPrettyContent}
                </div>
              </ScrollArea>
            )
          ) : (
            <div className="text-xs text-muted-foreground mt-2">
              No content.
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProcessConfigPreview = ({
    schema,
    // models,
    config,
    orgProcessName,
  }: {
    schema: any;
    models: any[];
    config: any;
    orgProcessName?: string;
  }) => {
    if (!schema?.properties) {
      return (
        <div className="text-xs text-muted-foreground">
          No schema available for preview.
        </div>
      );
    }

    const entries = Object.entries(schema.properties as Record<string, any>);
    const sortedEntries = entries.sort(([keyA], [keyB]) => {
      const score = (key: string) => {
        if (key === 'required_model_type') return 0;
        if (key.startsWith('required_') && key.endsWith('_prompt_types'))
          return 2;
        return 1;
      };
      return score(keyA) - score(keyB);
    });

    // const selectedModel =
    //   models.find((m: any) => m.modelHash === config?.model_hash) || null;

    const parameters = (config?.parameters ?? {}) as Record<string, unknown>;
    const hasParams =
      parameters &&
      typeof parameters === 'object' &&
      Object.keys(parameters).length > 0;

    // Extract key model parameters - check multiple naming conventions
    const temperature =
      parameters?.temperature ??
      parameters?.temperature_sampling ??
      config?.temperature ??
      config?.temperature_sampling ??
      null;
    const maxTokens =
      parameters?.maxTokens ??
      parameters?.max_tokens ??
      config?.maxTokens ??
      config?.max_tokens ??
      null;
    const topP =
      parameters?.topP ??
      parameters?.top_p ??
      config?.topP ??
      config?.top_p ??
      null;
    const repetitionPenalty =
      parameters?.repetitionPenalty ??
      parameters?.repetition_penalty ??
      config?.repetitionPenalty ??
      config?.repetition_penalty ??
      null;

    // Check if any params exist at all
    const allParams = {
      ...parameters,
      temperature,
      maxTokens,
      topP,
      repetitionPenalty,
    };
    const hasAnyParams = Object.values(allParams).some(
      (v) => v !== null && v !== undefined
    );

    const isVideoProcessing = orgProcessName === 'video_preprocessing';

    // Collect simple scalar config values into a compact, readable list
    const scalarOptions = sortedEntries
      .filter(([key, prop]) => {
        if (key === 'version' || key === 'required_model_type') return false;
        if (key === 'parameters') return false;
        if (key.startsWith('required_') && key.endsWith('_prompt_types')) {
          return false;
        }
        if (key === 'video_frames') return false;
        return (
          prop?.type === 'integer' ||
          prop?.type === 'number' ||
          prop?.type === 'string'
        );
      })
      .map(([key, prop]) => {
        const val = config?.[key];
        if (val === undefined || val === null || val === '') return null;
        const label = prop.title || key.replace(/_/g, ' ');
        return { key, label, value: val as unknown };
      })
      .filter(Boolean) as { key: string; label: string; value: unknown }[];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* {!isVideoProcessing && (
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground font-medium">
                Model
              </div>
              <div className="text-sm font-semibold text-foreground mt-1">
                {selectedModel?.modelName || 'â€”'}
              </div>
            </div>
          )} */}

          {/* Display key model parameters */}
          {!isVideoProcessing && hasAnyParams && (
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground font-medium">
                Model Parameters
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {temperature !== null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Temperature</span>
                    <span className="font-medium text-foreground">
                      {typeof temperature === 'number'
                        ? temperature.toFixed(2)
                        : temperature}
                    </span>
                  </div>
                )}
                {maxTokens !== null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Max Tokens</span>
                    <span className="font-medium text-foreground">
                      {maxTokens}
                    </span>
                  </div>
                )}
                {topP !== null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Top P</span>
                    <span className="font-medium text-foreground">
                      {typeof topP === 'number' ? topP.toFixed(3) : topP}
                    </span>
                  </div>
                )}
                {repetitionPenalty !== null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Repetition Penalty
                    </span>
                    <span className="font-medium text-foreground">
                      {typeof repetitionPenalty === 'number'
                        ? repetitionPenalty.toFixed(2)
                        : repetitionPenalty}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasParams && temperature === null && maxTokens === null && (
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground font-medium">
                Model parameters
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(parameters)
                  .filter(
                    ([k]) =>
                      ![
                        'temperature',
                        'temperature_sampling',
                        'max_tokens',
                        'maxTokens',
                        'top_p',
                        'topP',
                        'repetition_penalty',
                        'repetitionPenalty',
                      ].includes(k)
                  )
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground">
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedEntries.map(([key, prop]) => {
            if (key === 'version' || key === 'required_model_type') return null;
            if (key === 'parameters') return null;
            if (
              prop?.type === 'integer' ||
              prop?.type === 'number' ||
              prop?.type === 'string'
            ) {
              // Render scalar options in a consolidated card below
              return null;
            }

            if (key.startsWith('required_') && key.endsWith('_prompt_types')) {
              const promptKey = key
                .replace('required_', '')
                .replace('_types', '_hash');
              const parentKey = String(promptKey).replace(
                /_prompt_hash$/,
                '_hash'
              );
              const label = prop.title || key.replace(/_/g, ' ');
              const hash = String(config?.[promptKey] || '');
              const parentHash = String(config?.[`parent_${parentKey}`] || '');
              if (!hash) return null;
              return (
                <div key={key} className="col-span-full">
                  <PromptPreviewValue
                    promptHash={hash}
                    parentPromptHash={parentHash || undefined}
                    label={label}
                  />
                </div>
              );
            }

            if (key === 'video_frames') {
              const vf = config?.video_frames as
                | Record<string, unknown>
                | undefined;
              if (!vf) return null;
              return (
                <div key={key} className="col-span-full space-y-3">
                  <div className="text-xs text-muted-foreground font-medium">
                    {prop.title || 'Video frames'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(vf).map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-lg border bg-muted/10 p-3 flex justify-between items-center"
                      >
                        <span className="text-xs text-muted-foreground font-medium">
                          {k}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Display system_prompt_hash if it exists in config but wasn't already rendered by schema */}
          {(() => {
            const hasSystemPromptInSchema = sortedEntries.some(
              ([key]) =>
                key.startsWith('required_') &&
                key.endsWith('_prompt_types') &&
                key.includes('system')
            );
            const systemPromptHash = String(config?.system_prompt_hash || '');
            const systemPromptParentHash = String(
              config?.parent_system_hash || ''
            );
            if (!hasSystemPromptInSchema && systemPromptHash) {
              return (
                <div className="col-span-full">
                  <PromptPreviewValue
                    promptHash={systemPromptHash}
                    parentPromptHash={systemPromptParentHash || undefined}
                    label="System Prompt"
                  />
                </div>
              );
            }
            return null;
          })()}

          {scalarOptions.length > 0 &&
            (() => {
              // Separate chunk_duration and fps_processing_rate from other scalar options
              const chunkDurationOption = scalarOptions.find(
                (opt) =>
                  opt.key.toLowerCase().includes('chunk') &&
                  opt.key.toLowerCase().includes('duration')
              );
              const fpsProcessingRateOption = scalarOptions.find(
                (opt) =>
                  opt.key.toLowerCase().includes('fps') &&
                  opt.key.toLowerCase().includes('processing')
              );
              const otherOptions = scalarOptions.filter(
                (opt) =>
                  opt !== chunkDurationOption && opt !== fpsProcessingRateOption
              );

              return (
                <div className="col-span-full space-y-3">
                  <div className="text-xs text-muted-foreground font-medium">
                    Additional Parameters
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Chunk Duration */}
                    {chunkDurationOption && (
                      <div className="rounded-lg border bg-muted/10 p-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          Chunk Duration
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {String(chunkDurationOption.value)}
                        </span>
                      </div>
                    )}

                    {/* FPS Processing Rate */}
                    {fpsProcessingRateOption && (
                      <div className="rounded-lg border bg-muted/10 p-3 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          FPS Processing Rate
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {String(fpsProcessingRateOption.value)}
                        </span>
                      </div>
                    )}

                    {/* Other options */}
                    {otherOptions.map(({ key, label, value }) => (
                      <div
                        key={key}
                        className="rounded-lg border bg-muted/10 p-3 flex justify-between items-center"
                      >
                        <span className="text-xs text-muted-foreground font-medium">
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          {displayName}
        </div>
        <Badge
          variant={configSummary.isEnabled ? 'default' : 'outline'}
          className="text-xs"
        >
          {configSummary.isEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
      <div className="p-4">
        {loading || optionsLoading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading configurationâ€¦
          </div>
        ) : (
          <ProcessConfigPreview
            schema={schema}
            models={models}
            config={processConfig ?? {}}
            orgProcessName={configSummary.orgProcessName}
          />
        )}
      </div>
    </div>
  );
};

const ModelParametersForm: React.FC<ModelParametersFormProps> = ({
  isOpen,
  video,
  onClose,
  processBatch,
  username,
  mode = 'view',
  onConfigSaved,
}) => {
  const previewTabValue = 'preview';

  // const [deleteBatch] = useMutation(DELETE_BATCH);

  const [toggleConfig, { loading: toggling }] = useMutation(
    TOGGLE_BATCH_PROCESS_CONFIG
  );

  const {
    data: configsData,
    loading: configsLoading,
    refetch: refetchConfigs,
  } = useQuery(GET_BATCH_PROCESS_CONFIGS, {
    variables: { batchHash: video.batchHash },
    fetchPolicy: 'network-only',
  });

  const { data: catalogData } = useQuery(GET_PROCESS_CATALOG);
  // Note: createConfig/toggleBatchConfig/deleteConfig not used in re-analyze UI (pipelines fixed)
  // Note: createConfig/toggleBatchConfig/deleteConfig not used in re-analyze UI (pipelines fixed)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddPipelineOpen, setIsAddPipelineOpen] = useState(false);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [activeConfigHash, setActiveConfigHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showPreviewSection, setShowPreviewSection] = useState(false);

  const status = video.local_status || video.batchStatus || 'pending';
  const buttonText =
    status === 'pending'
      ? 'Process'
      : status === 'completed'
        ? 'Reprocess'
        : 'Configure & Process';

  const isReanalyze = mode === 'reanalyze';
  const isConfigMode = isReanalyze;

  const catalogPipelines = useMemo(
    () => catalogData?.getProcessCatalog ?? [],
    [catalogData]
  );
  const configuredPipelines = useMemo(
    () => configsData?.getBatchProcessConfigs ?? [],
    [configsData]
  );

  const getProcessOrder = (rawName?: string) => {
    const name = String(rawName || '').toLowerCase();
    if (
      name.includes('event_detection') ||
      name.includes('event-detection') ||
      name.includes('event detection')
    )
      return 0;
    if (
      name.includes('object_detection') ||
      name.includes('object-detection') ||
      name.includes('object detection') ||
      name.includes('yolo')
    )
      return 1;
    if (
      name.includes('video_preprocessing') ||
      name.includes('video-preprocessing') ||
      name.includes('video_processing') ||
      name.includes('video-processing') ||
      name.includes('video processing')
    )
      return 2;
    if (
      name.includes('vlm_inference') ||
      name.includes('vlm inference') ||
      name.includes('transcript')
    )
      return 3;
    return 999;
  };

  const orderedConfiguredPipelines = useMemo(() => {
    if (!configuredPipelines || configuredPipelines.length === 0) return [];

    return configuredPipelines
      .map((cfg: any, idx: number) => ({ cfg, idx }))
      .sort((a: { cfg: any; idx: number }, b: { cfg: any; idx: number }) => {
        const pa = catalogPipelines.find(
          (p: any) => p.orgProcessHash === a.cfg.orgProcessHash
        );
        const pb = catalogPipelines.find(
          (p: any) => p.orgProcessHash === b.cfg.orgProcessHash
        );
        const nameA = pa?.orgProcessName || '';
        const nameB = pb?.orgProcessName || '';
        const r = getProcessOrder(nameA) - getProcessOrder(nameB);
        return r !== 0 ? r : a.idx - b.idx;
      })
      .map((d: { cfg: any }) => d.cfg);
  }, [configuredPipelines, catalogPipelines]);

  const orderedCatalogPipelines = useMemo(() => {
    return [...catalogPipelines].sort(
      (a: any, b: any) =>
        getProcessOrder(a.orgProcessName) - getProcessOrder(b.orgProcessName)
    );
  }, [catalogPipelines]);

  const enabledPipelinesCount = configuredPipelines.filter(
    (c: any) => c.isEnabled !== false
  ).length;

  useEffect(() => {
    if (!isConfigMode) return;
    if (!activeConfigHash && orderedConfiguredPipelines.length > 0) {
      const firstEnabledOrFirst =
        orderedConfiguredPipelines.find((c: any) => c.isEnabled !== false) ||
        orderedConfiguredPipelines[0];
      const firstHash = firstEnabledOrFirst.batchProcessConfigHash;
      setActiveConfigHash(firstHash);
      if (!activeTab) {
        setActiveTab(firstHash);
      }
    }
  }, [activeConfigHash, activeTab, orderedConfiguredPipelines, isConfigMode]);

  // Only show notifications if video is not currently processing
  const handleProcess = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!video.id) {
        toast.error('Invalid video: missing ID', {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      await processBatch(video);
      onClose();
      // Stay on playground list; do not navigate to chat

      setIsSubmitting(false);
    } catch (error: unknown) {
      console.error('Error in form submission:', error);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle Apollo errors
        const apolloError = error as {
          message?: string;
          graphQLErrors?: Array<{ message: string }>;
        };
        if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
          errorMessage = apolloError.graphQLErrors
            .map((e) => e.message)
            .join(', ');
        } else if (apolloError.message) {
          errorMessage = apolloError.message;
        }
      }

      toast.error(`Error: ${errorMessage}`, {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
        duration: 3000,
      });
      setIsSubmitting(false);
    }
  };

  const goToPreview = () => {
    if (configuredPipelines.length === 0) {
      toast.error('No pipelines configured to preview.');
      return;
    }
    setShowPreviewSection(true);
    setActiveTab(previewTabValue);
  };

  const handleTogglePipeline = async (
    batchProcessConfigHash: string,
    checked: boolean
  ) => {
    try {
      await toggleConfig({
        variables: {
          batchProcessConfigHash,
          isEnabled: checked,
        },
      });
      refetchConfigs();
      toast.success(`Pipeline ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle pipeline');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {isReanalyze ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-primary" /> Re-analyze
                    Video
                  </>
                ) : (
                  video.batchName || 'Video Details'
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isReanalyze
                  ? 'Configure settings for re-analysis. Existing results will be replaced.'
                  : 'Manage video configuration and view details.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top section */}
          {isConfigMode ? (
            <div className="space-y-4">
              {/* Step 1: Video + pipeline overview */}
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                  1
                </span>
                <h3 className="text-lg font-semibold">Video & Pipelines</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-6 items-stretch">
                {/* Video preview */}
                <div className="md:col-span-2 relative rounded-lg overflow-hidden shadow-md bg-black">
                  {video.videoPresignedUrl || video.batchCloudStreamPath ? (
                    <video
                      src={
                        video.videoPresignedUrl || video.batchCloudStreamPath
                      }
                      className="w-full h-full max-h-[220px] object-contain bg-black"
                      controls
                    />
                  ) : (
                    <img
                      src={
                        video.thumbnailPresignedUrl ||
                        'https://placehold.co/600x340/000000/aaaaaa.png?text=Video+Preview'
                      }
                      alt="Video preview"
                      className="w-full h-full max-h-[220px] object-contain"
                    />
                  )}
                  <StatusBadge status={status} />
                  <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs text-foreground">
                    {formatDuration(video.duration || 0)}
                  </div>
                </div>

                {/* Pipeline summary cards - keep four boxes in a row */}
                <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {orderedCatalogPipelines.slice(0, 4).map((proc: any) => {
                    const processNameRaw = String(proc.orgProcessName || '');

                    const displayName = formatProcessName(processNameRaw);
                    const isEventDetection =
                      displayName === 'Event detection, vlm inference';

                    // Find the config for this process
                    const config = configuredPipelines.find(
                      (c: any) => c.orgProcessHash === proc.orgProcessHash
                    );
                    const isEnabled = config?.isEnabled !== false;

                    return (
                      <div
                        key={proc.orgProcessHash}
                        className="flex flex-col items-start justify-between rounded-xl border px-3 py-3 text-left bg-card h-full w-full min-w-0 border-primary/60 shadow-sm transition-colors"
                      >
                        <div className="text-sm font-medium leading-snug wrap-break-word whitespace-normal">
                          {displayName}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground text-left leading-snug wrap-break-word line-clamp-3">
                          {isEventDetection
                            ? 'Configure alerts and detections for this video.'
                            : 'Required for analysis'}
                        </div>
                        <div className="mt-3 flex items-center justify-between w-full text-[11px]">
                          <div className="inline-flex items-center gap-1">
                            {isEnabled ? (
                              <>
                                <CircleCheck className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  Enabled
                                </span>
                              </>
                            ) : (
                              <>
                                <CircleX className="w-3 h-3 text-destructive" />
                                <span className="text-destructive">
                                  Disabled
                                </span>
                              </>
                            )}
                          </div>
                          {config && (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) =>
                                handleTogglePipeline(
                                  config.batchProcessConfigHash,
                                  checked
                                )
                              }
                              disabled={toggling}
                              className="scale-75"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar - Show when processing */}
              {status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing...</span>
                    <span className="text-muted-foreground">
                      {video.progress != null && video.progress > 0
                        ? video.progress >= 60
                          ? 'Finalizing...'
                          : `${Math.round(video.progress)}%`
                        : 'Initializing...'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-full bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(
                          5,
                          Math.min(video.progress || 0, 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Tabs for pipeline configuration */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                      2
                    </span>
                    <h3 className="text-lg font-semibold">
                      Pipeline Configuration
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {enabledPipelinesCount} Selected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure each pipeline using the tabs below. Fork and edit
                  prompts just like in the upload form.
                </p>

                {configsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : configuredPipelines.length > 0 ? (
                  (() => {
                    const firstEnabledOrFirst =
                      orderedConfiguredPipelines.find(
                        (c: any) => c.isEnabled !== false
                      ) || orderedConfiguredPipelines[0];

                    const isConfigVisible = (config: any) => {
                      const process = catalogPipelines.find(
                        (p: any) => p.orgProcessHash === config.orgProcessHash
                      );
                      const rawName = process?.orgProcessName || 'Pipeline';
                      const lowered = String(rawName || '').toLowerCase();
                      const isEventDetection =
                        lowered.includes('event_detection') ||
                        lowered.includes('event-detection');

                      const isTranscriptGeneration =
                        lowered.includes('vlm_inference') ||
                        lowered.includes('vlm inference');

                      const isVideoProcessing =
                        lowered.includes('video_preprocessing') ||
                        lowered.includes('video-preprocessing') ||
                        lowered.includes('video_processing') ||
                        lowered.includes('video-processing') ||
                        lowered.includes('video processing');

                      if (
                        (isEventDetection ||
                          isTranscriptGeneration ||
                          isVideoProcessing) &&
                        config.isEnabled === false
                      ) {
                        return false;
                      }
                      return true;
                    };

                    const visibleTabs =
                      orderedConfiguredPipelines.filter(isConfigVisible);
                    const defaultTabHash =
                      visibleTabs.length > 0
                        ? visibleTabs[0].batchProcessConfigHash
                        : firstEnabledOrFirst?.batchProcessConfigHash;

                    let currentValue = activeTab ?? defaultTabHash;

                    if (activeTab) {
                      const activeConfig = orderedConfiguredPipelines.find(
                        (c: any) => c.batchProcessConfigHash === activeTab
                      );
                      if (activeConfig && !isConfigVisible(activeConfig)) {
                        currentValue = defaultTabHash;
                      }
                    }

                    return (
                      <Tabs
                        value={currentValue}
                        onValueChange={(value) => {
                          setActiveTab(value);
                          if (value !== previewTabValue) {
                            setActiveConfigHash(value);
                          }
                        }}
                        className="w-full"
                      >
                        <TabsList className="inline-flex gap-2 mb-3 flex-wrap">
                          {orderedConfiguredPipelines
                            .filter((config: any) => isConfigVisible(config))
                            .map((config: any) => {
                              const process = catalogPipelines.find(
                                (p: any) =>
                                  p.orgProcessHash === config.orgProcessHash
                              );
                              const rawName =
                                process?.orgProcessName || 'Pipeline';
                              const displayName = formatProcessName(rawName);

                              return (
                                <TabsTrigger
                                  key={config.batchProcessConfigHash}
                                  value={config.batchProcessConfigHash}
                                  className="px-3 py-1.5 text-xs"
                                  onClick={() =>
                                    setExpandedPipeline(
                                      config.batchProcessConfigHash
                                    )
                                  }
                                >
                                  {displayName}
                                </TabsTrigger>
                              );
                            })}

                          <TabsTrigger
                            value={previewTabValue}
                            className="px-3 py-1.5 text-xs"
                            disabled={
                              !showPreviewSection &&
                              activeTab !== previewTabValue
                            }
                          >
                            Preview
                          </TabsTrigger>
                        </TabsList>

                        {orderedConfiguredPipelines
                          .filter((config: any) => isConfigVisible(config))
                          .map((config: any) => (
                            <TabsContent
                              key={config.batchProcessConfigHash}
                              value={config.batchProcessConfigHash}
                              className="mt-0"
                            >
                              <PipelineConfigItem
                                configSummary={config}
                                isExpanded={true}
                                onToggle={() => {
                                  // Kept expanded inside tab
                                }}
                                onUpdate={() => {
                                  refetchConfigs();
                                }}
                                showToggle={false}
                                variant="simple"
                                onSaved={() => {
                                  refetchConfigs();
                                  onConfigSaved?.();
                                }}
                              />
                            </TabsContent>
                          ))}

                        <TabsContent value={previewTabValue} className="mt-0">
                          {showPreviewSection ? (
                            <div className="space-y-3">
                              <div className="bg-muted/30 p-4 rounded-lg border space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    Pipelines selected
                                  </span>
                                  <span className="font-medium">
                                    {enabledPipelinesCount}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {orderedConfiguredPipelines.filter(
                                  (config: any) =>
                                    isConfigVisible(config) &&
                                    config.isEnabled !== false
                                ).length > 0 ? (
                                  orderedConfiguredPipelines
                                    .filter(
                                      (config: any) =>
                                        isConfigVisible(config) &&
                                        config.isEnabled !== false
                                    )
                                    .map((config: any) => (
                                      <PipelinePreviewCard
                                        key={config.batchProcessConfigHash}
                                        configSummary={config}
                                        catalogPipelines={catalogPipelines}
                                      />
                                    ))
                                ) : (
                                  <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                                    No pipelines enabled. Enable pipelines to
                                    see preview.
                                  </div>
                                )}
                              </div>

                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                  This will permanently replace existing results
                                  for this video.
                                </AlertDescription>
                              </Alert>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                              Save configuration changes first to see a preview
                              summary here.
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    );
                  })()
                ) : configsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                    Loading configurations&hellip; Please wait.
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                    No pipelines configured.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Thumbnail */}
              <div className="relative rounded-lg overflow-hidden shadow-md bg-black/5 max-w-md mx-auto">
                <img
                  src={
                    video.thumbnailPresignedUrl ||
                    'https://placehold.co/600x340/000000/aaaaaa.png?text=Video+Thumbnail'
                  }
                  alt="Video thumbnail"
                  className="w-full h-auto max-h-[240px] object-contain"
                />
                <StatusBadge status={status} />
                <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs text-foreground">
                  {formatDuration(video.duration || 0)}
                </div>
              </div>

              {/* Progress Bar - Show when processing */}
              {status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing...</span>
                    <span className="text-muted-foreground">
                      {video.progress != null && video.progress > 0
                        ? video.progress >= 60
                          ? 'Finalizing...'
                          : `${Math.round(video.progress)}%`
                        : 'Initializing...'}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-full bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(
                          5,
                          Math.min(video.progress || 0, 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <span className="text-muted-foreground">Created</span>
                  <p>
                    {formatCreatedAt(
                      video.created_at || new Date().toISOString()
                    )}
                  </p>
                  <span className="text-muted-foreground">Duration</span>
                  <p>{formatDuration(video.duration || 0)}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-muted-foreground">Status</span>
                  <p className="capitalize">{status}</p>
                  <span className="text-muted-foreground">Owner</span>
                  <p>{username || 'Unknown'}</p>
                </div>
              </div>

              {/* Configured Pipelines (view mode) */}
              <div className="space-y-2">
                <div className="w-full flex items-center justify-between p-2 pb-0">
                  <span className="flex items-center font-medium">
                    <Layers className="mr-2 h-4 w-4" />
                    Configured Pipelines
                  </span>
                </div>

                <div className="p-2">
                  <div className="space-y-4">
                    {configsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : configuredPipelines.length > 0 ? (
                      <div className="space-y-3">
                        {orderedConfiguredPipelines.map((config: any) => (
                          <PipelineConfigItem
                            key={config.batchProcessConfigHash}
                            configSummary={config}
                            isExpanded={
                              expandedPipeline === config.batchProcessConfigHash
                            }
                            onToggle={() =>
                              setExpandedPipeline(
                                expandedPipeline ===
                                  config.batchProcessConfigHash
                                  ? null
                                  : config.batchProcessConfigHash
                              )
                            }
                            onUpdate={() => {
                              refetchConfigs();
                            }}
                            showToggle={false}
                            onSaved={() => {
                              refetchConfigs();
                              onConfigSaved?.();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                        No pipelines configured.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Action Buttons */}
        <DialogFooter className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex justify-end w-full">
            {isConfigMode ? (
              <div className="flex items-center gap-3">
                {activeTab === previewTabValue ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const firstHash =
                        configuredPipelines[0]?.batchProcessConfigHash;
                      if (firstHash) {
                        setActiveTab(firstHash);
                        setActiveConfigHash(firstHash);
                      }
                    }}
                    className="px-6 h-10 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={goToPreview}
                    disabled={configuredPipelines.length === 0}
                    className="px-6 h-10 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                  >
                    {isReanalyze ? 'Preview' : 'Preview'}
                    <PlayCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {activeTab === previewTabValue && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-6 h-10 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                    onClick={handleProcess}
                    disabled={isSubmitting || configuredPipelines.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Reprocessing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Save &amp; Reprocess
                      </>
                    )}
                  </Button>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="px-6 h-10 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                      >
                        Close
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Close this configuration.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleProcess}
                      disabled={isSubmitting || status === 'processing'}
                      className="px-6 h-10 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                    >
                      {isSubmitting || status === 'processing' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {buttonText} <PlayCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      {isSubmitting || status === 'processing'
                        ? 'Processing video with current configuration.'
                        : 'Run analysis with current configuration.'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <AddPipelineDialog
        isOpen={isAddPipelineOpen}
        onClose={() => setIsAddPipelineOpen(false)}
        batchHash={video.batchHash}
        onSuccess={() => refetchConfigs()}
      />
    </Dialog>
  );
};

export default ModelParametersForm;
