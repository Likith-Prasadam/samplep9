/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CircleCheck, Info, Cpu, Settings2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreatePromptDialog } from '@/components/pipeline-configuration/create-prompt-dialog';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  UPDATE_CAM_PROCESS_CONFIG,
  GET_CAM_PROCESS_CONFIGS,
  GET_CAM_PROCESS_CONFIG,
} from '@/graphql/camera-process-config-queries';
import {
  GET_ORG_MODEL_BY_HASH,
  GET_PROCESS_WITH_MODELS,
  GET_PROMPT_BY_HASH,
} from '@/graphql/workflow_queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  configSchema,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from './utils/configuration-schema';
import {
  // @ts-expect-error - May be needed for future update functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  extractDefaultParams,
  parseProcessConfig,
  extractPromptHashFromConfig,
} from './utils/configuration-utils';
import { PromptSelectionField } from '@/components/pipeline-configuration/prompt-selection';
import { toDisplayName } from '@/components/pipeline-configuration/utils';
import type {
  LiveConfigurationProps,
  ConfigData,
  ModelData,
  PromptData,
  ProcessWithModelsData,
  AccessibleModel,
  ConfigFormData,
} from './types/configuration-types';

const LiveConfiguration: React.FC<LiveConfigurationProps> = ({
  camera = null,
  batch = null,
  onModelHashChange,
  configType: propConfigType,
}) => {
  // Helper function to determine process priority for sorting
  // Event detection: 0, Object detection: 1, Video processing: 2, Transcript generation: 3
  const getProcessPriority = (processName: string): number => {
    const lowerName = processName.toLowerCase();
    if (
      lowerName.includes('event_detection') ||
      lowerName.includes('event detection')
    )
      return 0;
    if (
      lowerName.includes('object_detection') ||
      lowerName.includes('object detection') ||
      lowerName.includes('yolo')
    )
      return 1;
    if (
      lowerName.includes('video_preprocessing') ||
      lowerName.includes('video_processing') ||
      lowerName.includes('video processing') ||
      lowerName.includes('video')
    )
      return 2;
    if (lowerName.includes('vlm_inference') || lowerName.includes('transcript'))
      return 3;
    if (lowerName.includes('event')) return 0;
    if (lowerName.includes('object') || lowerName.includes('yolo')) return 1;
    if (lowerName.includes('transcript') || lowerName.includes('vlm')) return 3;
    return 999; // Unknown processes go last
  };

  // Determine configuration type
  const configType = propConfigType || (batch ? 'batch' : 'camera');
  const entity = configType === 'batch' ? batch : camera;
  const entityHash =
    configType === 'batch' ? batch?.batch_hash : camera?.cam_hash;
  const entityName =
    configType === 'batch' ? batch?.batch_name : camera?.cam_name;

  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [, setModelData] = useState<ModelData | null>(null);
  const [, setPromptData] = useState<PromptData | null>(null);
  // @ts-expect-error - Prompt data used for state management but not displayed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [systemPromptData, setSystemPromptData] = useState<PromptData | null>(
    null
  );
  // @ts-expect-error - Prompt data used for state management but not displayed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userPromptData, setUserPromptData] = useState<PromptData | null>(null);
  // @ts-expect-error - Prompt data used for state management but not displayed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [eventsListPromptData, setEventsListPromptData] =
    useState<PromptData | null>(null);
  const [configHashToFetch, setConfigHashToFetch] = useState<string>('');
  const [modelHashToFetch, setModelHashToFetch] = useState<string>('');
  const [promptHashToFetch, setPromptHashToFetch] = useState<string>('');
  const [allConfigs, setAllConfigs] = useState<ConfigData[]>([]);
  const [selectedProcessHash, setSelectedProcessHash] = useState<string>('');
  const [selectedModelHash, setSelectedModelHash] = useState<string>('');
  const [selectedPromptHash, setSelectedPromptHash] = useState<string>('');
  const [selectedPrompts, setSelectedPrompts] = useState<{
    systemPromptHash?: string;
    userPromptHash?: string;
    eventsListPromptHash?: string;
    parentSystemHash?: string;
    parentUserHash?: string;
    parentEventsListHash?: string;
  }>({});
  const [currentProcessName, setCurrentProcessName] = useState<string>('');
  const [, setCurrentPromptName] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(1000);
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);

  // Parameter constraints from model schema
  const [paramConstraints, setParamConstraints] = useState<{
    temperature: { min: number; max: number };
    max_tokens: { min: number; max: number };
    width: { min: number; max: number };
    height: { min: number; max: number };
  }>({
    temperature: { min: 0, max: 2 },
    max_tokens: { min: 1, max: 10000 },
    width: { min: 1, max: 4096 },
    height: { min: 1, max: 4096 },
  });
  const [processWithModels, setProcessWithModels] =
    useState<ProcessWithModelsData | null>(null);
  const [expandedConfigHash, setExpandedConfigHash] = useState<string | null>(
    null
  );
  const [enabledConfigs, setEnabledConfigs] = useState<Set<string>>(new Set());
  const [isSwitchingPipeline, setIsSwitchingPipeline] = useState(false);
  const [isCreatePromptDialogOpen, setIsCreatePromptDialogOpen] =
    useState(false);
  // Holds editable values for schema-driven scalar/dropdown fields (e.g. object detection)
  const [schemaFieldValues, setSchemaFieldValues] = useState<
    Record<string, unknown>
  >({});

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      processConfig: {},
      selectedProcessHash: '',
      selectedModelHash: '',
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
    },
  });

  // Extract parameter constraints from model schema (like camera-add)
  const extractParamConstraints = React.useCallback(
    (modelDefaultParams: Record<string, unknown>) => {
      const newConstraints = {
        temperature: { min: 0, max: 2 },
        max_tokens: { min: 1, max: 10000 },
        width: { min: 1, max: 4096 },
        height: { min: 1, max: 4096 },
      };

      if (modelDefaultParams && 'properties' in modelDefaultParams) {
        const properties = modelDefaultParams.properties as Record<
          string,
          Record<string, unknown>
        >;

        // Extract temperature constraints
        if (properties.temperature) {
          const tempMin = properties.temperature.minimum as number | undefined;
          const tempMax = properties.temperature.maximum as number | undefined;
          if (tempMin !== undefined) newConstraints.temperature.min = tempMin;
          if (tempMax !== undefined) newConstraints.temperature.max = tempMax;
        }

        // Extract max_tokens constraints
        if (properties.max_tokens) {
          const tokensMin = properties.max_tokens.minimum as number | undefined;
          const tokensMax = properties.max_tokens.maximum as number | undefined;
          if (tokensMin !== undefined)
            newConstraints.max_tokens.min = tokensMin;
          if (tokensMax !== undefined)
            newConstraints.max_tokens.max = tokensMax;
        }

        // Extract width/height if present in schema
        if (properties.width) {
          const widthMin = properties.width.minimum as number | undefined;
          const widthMax = properties.width.maximum as number | undefined;
          if (widthMin !== undefined) newConstraints.width.min = widthMin;
          if (widthMax !== undefined) newConstraints.width.max = widthMax;
        }

        if (properties.height) {
          const heightMin = properties.height.minimum as number | undefined;
          const heightMax = properties.height.maximum as number | undefined;
          if (heightMin !== undefined) newConstraints.height.min = heightMin;
          if (heightMax !== undefined) newConstraints.height.max = heightMax;
        }
      }

      setParamConstraints(newConstraints);
    },
    []
  );

  // Track which queries have been processed to avoid infinite loops
  const detailedConfigProcessedRef = useRef(false);
  const modelDataProcessedRef = useRef(false);

  // Removed catalog query as per simplified UI requirements

  // Fetch process details with models when updating
  const [
    fetchProcessWithModels,
    {
      loading: processWithModelsLoading,
      data: processWithModelsData,
      error: processWithModelsError,
    },
  ] = useLazyQuery(GET_PROCESS_WITH_MODELS, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
  });

  // Process models and prompts data with useEffect
  useEffect(() => {
    console.log('[useEffect: processWithModelsData]', {
      hasData: !!processWithModelsData,
      isLoading: processWithModelsLoading,
      promptsCount:
        processWithModelsData?.getProcessWithModels?.accessiblePrompts
          ?.length || 0,
      prompts:
        processWithModelsData?.getProcessWithModels?.accessiblePrompts?.map(
          (p: any) => ({
            name: p.promptName,
            type: p.promptType,
            hash: p.promptHash?.substring(0, 8),
          })
        ) || [],
    });

    if (processWithModelsData && !processWithModelsLoading) {
      const process = processWithModelsData?.getProcessWithModels;
      if (process) {
        console.log('[Processing new processWithModels data]', {
          processName: process.orgProcessName,
          modelsCount: process.accessibleModels?.length,
          promptsCount: process.accessiblePrompts?.length,
          promptDetails: process.accessiblePrompts?.map((p: any) => ({
            name: p.promptName,
            type: p.promptType,
          })),
        });

        // Always set the processWithModels - this will trigger re-renders
        setProcessWithModels(process);

        // Pre-populate model selection from current config
        if (!selectedModelHash && configData?.processConfig) {
          const currentModelHash = (
            configData.processConfig as Record<string, unknown>
          )?.model_hash as string;
          if (currentModelHash) {
            const matchedModel = process.accessibleModels.find(
              (m: AccessibleModel) => m.modelHash === currentModelHash
            );
            if (matchedModel) {
              setSelectedModelHash(currentModelHash);
            }
          }
        }

        // If current model hash exists, find and display its details from the process data
        if (selectedModelHash) {
          const matchedModel = process.accessibleModels.find(
            (m: AccessibleModel) => m.modelHash === selectedModelHash
          );
          if (matchedModel) {
            // Update model data with matched details
            setModelData({
              modelHash: matchedModel.modelHash,
              modelName: matchedModel.modelName,
              modelType: matchedModel.modelType,
              modelIdentifier: matchedModel.modelIdentifier || '',
              modelProvider: matchedModel.modelProvider,
              modelDefaultParams: matchedModel.modelDefaultParams,
              baseUrl: '', // Will be fetched separately if needed
            });
          }
        }

        // If current prompt hash exists, find and display its details from the process data
        if (selectedPromptHash && process.accessiblePrompts) {
          type PromptType = {
            promptHash: string;
            promptName: string;
            promptDescription?: string;
            promptType?: string;
          };
          const matchedPrompt: PromptType | undefined =
            process.accessiblePrompts.find(
              (p: PromptType) => p.promptHash === selectedPromptHash
            );
          if (matchedPrompt) {
            setCurrentPromptName(matchedPrompt.promptName);
          }
        }

        // Fetch system and user prompt names from process data
        if (process.accessiblePrompts) {
          type PromptType = {
            promptHash: string;
            promptName: string;
            promptDescription?: string;
            promptType?: string;
          };

          // Look up system prompt
          if (selectedPrompts.systemPromptHash) {
            const systemPrompt = process.accessiblePrompts.find(
              (p: PromptType) =>
                p.promptHash === selectedPrompts.systemPromptHash
            );
            // Prompt found - no action needed as state is already set
            if (systemPrompt) {
              // Available for future use
            }
          }

          // Look up user prompt
          if (selectedPrompts.userPromptHash) {
            const userPrompt = process.accessiblePrompts.find(
              (p: PromptType) => p.promptHash === selectedPrompts.userPromptHash
            );
            // Prompt found - no action needed as state is already set
            if (userPrompt) {
              // Available for future use
            }
          }
        }
      }
    }
  }, [
    processWithModelsData,
    processWithModelsLoading,
    selectedModelHash,
    selectedPromptHash,
    selectedPrompts,
    configData,
  ]);

  // Trigger refetch when selected process hash changes in edit mode
  const fetchProcessWithModelsRef = useRef(fetchProcessWithModels);

  useEffect(() => {
    fetchProcessWithModelsRef.current = fetchProcessWithModels;
  }, [fetchProcessWithModels]);

  // Reset processWithModels only when switching processes or explicit need
  useEffect(() => {
    if (selectedProcessHash) {
      fetchProcessWithModelsRef
        .current({ variables: { orgProcessHash: selectedProcessHash } })
        .then((result) => {
          const process = result.data?.getProcessWithModels;
          if (process) {
            setProcessWithModels(process);

            // Match and set prompt details if prompt hash is selected
            if (selectedPromptHash && process.accessiblePrompts) {
              const matchedPrompt = process.accessiblePrompts.find(
                (p: Record<string, unknown>) =>
                  p.promptHash === selectedPromptHash
              );
              if (matchedPrompt) {
                setCurrentPromptName(matchedPrompt.promptName as string);
              }
            }
          }
        })
        .catch(() => {
          // Refetch error silently handled
        });
    }
    // Only depend on selectedProcessHash
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProcessHash]);

  // First: Fetch all configs - uses same query but different parameters
  const {
    loading: configsLoading,
    data: configsData,
    refetch: refetchAllConfigs,
  } = useQuery(GET_CAM_PROCESS_CONFIGS, {
    variables: { cam_hash: entityHash || '' },
    skip: !entityHash,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Process all configs data with useEffect
  useEffect(() => {
    if (configsData && !configsLoading) {
      const configs = configsData?.getCamProcessConfigs || [];
      setAllConfigs(configs);

      // All pipelines are enabled by default; user cannot deselect
      const initialEnabledConfigs = new Set<string>();
      configs.forEach((config: Record<string, unknown>) => {
        const configId = (config.camProcessConfigHash ||
          config.config_id) as string;
        initialEnabledConfigs.add(configId);
      });
      setEnabledConfigs(initialEnabledConfigs);

      // Auto-select first enabled config if none is selected (prioritize event detection)
      if (initialEnabledConfigs.size > 0) {
        const configToUse =
          expandedConfigHash ||
          configs.find((config: any) =>
            initialEnabledConfigs.has(config.camProcessConfigHash)
          )?.camProcessConfigHash;

        if (configToUse) {
          const enabledConfigsArray = configs.filter((config: any) =>
            initialEnabledConfigs.has(config.camProcessConfigHash)
          );

          const sortedEnabledConfigs = enabledConfigsArray.sort(
            (a: any, b: any) => {
              return (
                getProcessPriority(a.orgProcessName || '') -
                getProcessPriority(b.orgProcessName || '')
              );
            }
          );

          const selectedId =
            expandedConfigHash || sortedEnabledConfigs[0]?.camProcessConfigHash;
          if (selectedId) {
            const shouldReloadSelectedConfig =
              selectedId !== configHashToFetch ||
              !configData ||
              configData.configHash !== selectedId;

            setExpandedConfigHash(selectedId);

            if (shouldReloadSelectedConfig) {
              setConfigHashToFetch(selectedId);
              setIsSwitchingPipeline(true);
              setSchemaFieldValues({});
            } else {
              // Keep UI interactive when refetch returns same selected config.
              setIsSwitchingPipeline(false);
            }
          }
        }
      }
    }
  }, [
    configsData,
    configsLoading,
    expandedConfigHash,
    configHashToFetch,
    configData,
  ]);

  // Second: Fetch detailed config with processConfig (only when expanded)
  const {
    loading: detailedLoading,
    data: detailedData,
    refetch: refetchDetailedConfig,
  } = useQuery(GET_CAM_PROCESS_CONFIG, {
    variables: { cam_process_config_hash: configHashToFetch },
    skip: !configHashToFetch,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Reset processing flag when config hash changes
  useEffect(() => {
    detailedConfigProcessedRef.current = false;
  }, [configHashToFetch]);

  // Process detailed config data with useEffect
  useEffect(() => {
    // Process when we have new data and either haven't processed yet OR ref was reset for update
    if (
      detailedData &&
      !detailedLoading &&
      !detailedConfigProcessedRef.current
    ) {
      const detailedConfig = detailedData?.getCamProcessConfig;
      if (detailedConfig) {
        const parsedConfig: Record<string, unknown> = parseProcessConfig(
          detailedConfig.processConfig
        );

        const configDataObj: ConfigData = {
          configHash: detailedConfig.camProcessConfigHash,
          configType: configType,
          processConfig: parsedConfig || {},
        };
        setConfigData(configDataObj);

        // Extract and store process name (from top level) and model hash (from processConfig)
        const processName = (detailedConfig?.orgProcessName as string) || '';
        const processHash =
          (detailedConfig?.orgProcessHash as string) ||
          (parsedConfig?.orgProcessHash as string) ||
          '';
        const modelHash = parsedConfig?.model_hash || parsedConfig?.modelHash;
        // Model and prompt names extracted from config
        const promptName = (parsedConfig?.promptName as string) || '';

        setCurrentProcessName(processName);

        setCurrentPromptName(promptName);
        setSelectedProcessHash(processHash);

        // Extract temperature and max_tokens for form inputs
        const params = parsedConfig?.parameters as
          | Record<string, unknown>
          | undefined;
        const extractedTemperature =
          (parsedConfig?.temperature as number) ||
          (params?.temperature as number) ||
          0.7;
        const extractedMaxTokens =
          (parsedConfig?.max_tokens as number) ||
          (params?.max_tokens as number) ||
          1000;

        // Extract width and height from video_frames (only if present in config)
        const videoFrames = parsedConfig?.video_frames as
          | Record<string, unknown>
          | undefined;
        if (videoFrames) {
          const extractedWidth = (videoFrames?.width as number) || 1920;
          const extractedHeight = (videoFrames?.height as number) || 1080;
          setWidth(extractedWidth);
          setHeight(extractedHeight);
        }

        setTemperature(extractedTemperature);
        setMaxTokens(extractedMaxTokens);
        form.setValue('temperature', extractedTemperature);
        form.setValue('maxTokens', extractedMaxTokens);

        if (modelHash && typeof modelHash === 'string') {
          setModelHashToFetch(modelHash);
          setSelectedModelHash(modelHash);
          // Emit the model hash to parent component for use in chat
          onModelHashChange?.(modelHash);

          // Extract parameter constraints from model schema
          const matchedModel = processWithModels?.accessibleModels?.find(
            (m) => m.modelHash === modelHash
          );
          if (matchedModel?.modelDefaultParams) {
            extractParamConstraints(matchedModel.modelDefaultParams);
          }
        }

        // Extract and fetch prompt data - look for any prompt hash in the config
        const selectedPromptHash = extractPromptHashFromConfig(parsedConfig);
        if (selectedPromptHash) {
          setPromptHashToFetch(selectedPromptHash);
          setSelectedPromptHash(selectedPromptHash);
        }

        // Clear any existing prompt data before loading new configuration
        // This prevents prompts from one process appearing in another
        setSystemPromptData(null);
        setUserPromptData(null);
        setEventsListPromptData(null);

        // Extract all prompt hashes from config and populate selectedPrompts state
        // This ensures the UI shows the correct saved prompt versions after refetch
        const configPromptHashes = {
          systemPromptHash: (parsedConfig?.system_prompt_hash as string) || '',
          userPromptHash: (parsedConfig?.user_prompt_hash as string) || '',
          eventsListPromptHash:
            (parsedConfig?.events_list_prompt_hash as string) || '',
          parentSystemHash: (parsedConfig?.parent_system_hash as string) || '',
          parentUserHash: (parsedConfig?.parent_user_hash as string) || '',
          parentEventsListHash:
            (parsedConfig?.parent_events_list_hash as string) || '',
        };

        // Always set the prompt hashes from backend config to show correct versions in UI
        setSelectedPrompts(configPromptHashes);

        // Seed schema-driven fields (e.g. object detection: frame_skip, yolo_model_id)
        // from the saved processConfig so the UI shows the stored values
        setSchemaFieldValues({ ...(parsedConfig || {}) });

        form.reset({
          processConfig: parsedConfig || {},
        });

        detailedConfigProcessedRef.current = true;
        setIsSwitchingPipeline(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    detailedData,
    detailedLoading,
    configType,
    form,
    fetchProcessWithModels,
    onModelHashChange,
    extractParamConstraints,
  ]);

  // Third: Fetch model data by hash - combines with process model data
  const { data: modelByHashData } = useQuery(GET_ORG_MODEL_BY_HASH, {
    variables: { modelHash: modelHashToFetch },
    skip: !modelHashToFetch,
  });

  // Process model data with useEffect
  useEffect(() => {
    // Process when we have new data and either haven't processed yet OR ref was reset for update
    if (modelByHashData && !detailedLoading && !modelDataProcessedRef.current) {
      const model = modelByHashData?.getOrgModelByHash;
      if (model) {
        // Merge with existing model data from process if available
        setModelData((prevData) => ({
          ...prevData,
          ...model,
          modelHash: model.modelHash || prevData?.modelHash,
          modelName: model.modelName || prevData?.modelName || '',
          modelType: model.modelType || prevData?.modelType || '',
          modelProvider: model.modelProvider || prevData?.modelProvider || '',
          modelIdentifier:
            model.modelIdentifier || prevData?.modelIdentifier || '',
          modelDefaultParams:
            model.modelDefaultParams || prevData?.modelDefaultParams,
          baseUrl: model.baseUrl || prevData?.baseUrl || '',
          accessLevel: model.accessLevel || prevData?.accessLevel,
          apiKeyRef: model.apiKeyRef || prevData?.apiKeyRef,
        }));
        // Update current model name for display

        modelDataProcessedRef.current = true;
      }
    }
  }, [modelByHashData, detailedLoading]);

  // Fourth: Fetch all prompt data by hash
  const { data: promptByHashData } = useQuery(GET_PROMPT_BY_HASH, {
    variables: { promptHash: promptHashToFetch },
    skip: !promptHashToFetch,
  });

  const { data: systemPromptByHashData } = useQuery(GET_PROMPT_BY_HASH, {
    variables: { promptHash: selectedPrompts.systemPromptHash || '' },
    skip: !selectedPrompts.systemPromptHash,
  });

  const { data: userPromptByHashData } = useQuery(GET_PROMPT_BY_HASH, {
    variables: { promptHash: selectedPrompts.userPromptHash || '' },
    skip: !selectedPrompts.userPromptHash,
  });

  const { data: eventsListPromptByHashData } = useQuery(GET_PROMPT_BY_HASH, {
    variables: { promptHash: selectedPrompts.eventsListPromptHash || '' },
    skip: !selectedPrompts.eventsListPromptHash,
  });

  // Process prompt data with useEffect
  useEffect(() => {
    if (promptByHashData && !detailedLoading) {
      const prompt = promptByHashData?.getPromptByHash;
      if (prompt) {
        setPromptData({
          promptContent: prompt.promptContent || '',
          promptDescription: prompt.promptDescription,
          promptHash: prompt.promptHash || '',
          promptName: prompt.promptName || '',
          promptType: prompt.promptType,
          refPromptKey: prompt.refPromptKey,
        });
        // Update current prompt name for display
        setCurrentPromptName(prompt.promptName || '');
      }
    }
  }, [promptByHashData, detailedLoading]);

  // Process system prompt data
  useEffect(() => {
    if (systemPromptByHashData && !detailedLoading) {
      const prompt = systemPromptByHashData?.getPromptByHash;
      if (prompt) {
        setSystemPromptData({
          promptContent: prompt.promptContent || '',
          promptDescription: prompt.promptDescription,
          promptHash: prompt.promptHash || '',
          promptName: prompt.promptName || '',
          promptType: prompt.promptType,
          refPromptKey: prompt.refPromptKey,
        });
      }
    } else if (!selectedPrompts.systemPromptHash) {
      // Clear system prompt data when hash is not present
      setSystemPromptData(null);
    }
  }, [
    systemPromptByHashData,
    detailedLoading,
    selectedPrompts.systemPromptHash,
  ]);

  // Process user prompt data
  useEffect(() => {
    if (userPromptByHashData && !detailedLoading) {
      const prompt = userPromptByHashData?.getPromptByHash;
      if (prompt) {
        setUserPromptData({
          promptContent: prompt.promptContent || '',
          promptDescription: prompt.promptDescription,
          promptHash: prompt.promptHash || '',
          promptName: prompt.promptName || '',
          promptType: prompt.promptType,
          refPromptKey: prompt.refPromptKey,
        });
      }
    } else if (!selectedPrompts.userPromptHash) {
      // Clear user prompt data when hash is not present
      setUserPromptData(null);
    }
  }, [userPromptByHashData, detailedLoading, selectedPrompts.userPromptHash]);

  // Process events list prompt data
  useEffect(() => {
    if (eventsListPromptByHashData && !detailedLoading) {
      const prompt = eventsListPromptByHashData?.getPromptByHash;
      if (prompt) {
        setEventsListPromptData({
          promptContent: prompt.promptContent || '',
          promptDescription: prompt.promptDescription,
          promptHash: prompt.promptHash || '',
          promptName: prompt.promptName || '',
          promptType: prompt.promptType,
          refPromptKey: prompt.refPromptKey,
        });
      }
    } else if (!selectedPrompts.eventsListPromptHash) {
      // Clear events list prompt data when hash is not present
      setEventsListPromptData(null);
    }
  }, [
    eventsListPromptByHashData,
    detailedLoading,
    selectedPrompts.eventsListPromptHash,
  ]);

  // Update mutation
  const [updateConfig, { loading: updateLoading }] = useMutation(
    UPDATE_CAM_PROCESS_CONFIG,
    {
      onCompleted: async () => {
        // Reset state for re-processing updated data
        detailedConfigProcessedRef.current = false;
        modelDataProcessedRef.current = false;

        // Manually refetch with network-only to ensure fresh data
        try {
          await Promise.all([
            refetchAllConfigs(),
            configHashToFetch ? refetchDetailedConfig() : Promise.resolve(),
            selectedProcessHash
              ? fetchProcessWithModelsRef.current({
                  variables: { orgProcessHash: selectedProcessHash },
                })
              : Promise.resolve(),
          ]);
          toast.success('Configuration updated successfully');
        } catch {
          toast.success('Configuration updated (view may need refresh)');
        } finally {
          // Guard against stale local switching state on repeated save cycles.
          setIsSwitchingPipeline(false);
        }

        // Keep processWithModels and configData for continuous editing
      },
      onError: (error) => {
        toast.error(`Error updating configuration: ${error.message}`);
      },
    }
  );

  // Removed delete mutation as per simplified UI requirements

  // Removed create/delete handlers as per simplified UI requirements

  // Removed add configuration handlers as per simplified UI requirements

  const isLoading = configsLoading || detailedLoading;
  // Consider process-with-models as loading when:
  // - The lazy query is actively fetching, OR
  // - We have a process hash (config loaded) but processWithModels hasn't been set yet.
  // Use processWithModels (not processWithModelsData) since processWithModelsData can
  // be stale from a previous tab's fetch while processWithModels is reset on tab switch.
  const isProcessWithModelsLoading =
    !processWithModelsError &&
    (processWithModelsLoading || (!!selectedProcessHash && !processWithModels));

  // When a model is selected, fetch its full details and merge with process data
  React.useEffect(() => {
    if (selectedModelHash && processWithModels) {
      const matchedModel = processWithModels.accessibleModels.find(
        (m) => m.modelHash === selectedModelHash
      );
      if (matchedModel) {
        // Update model data with matched model from process
        setModelData({
          modelHash: matchedModel.modelHash,
          modelName: matchedModel.modelName,
          modelType: matchedModel.modelType,
          modelIdentifier: matchedModel.modelIdentifier || '',
          modelProvider: matchedModel.modelProvider,
          modelDefaultParams: matchedModel.modelDefaultParams,
          baseUrl: '',
        });

        // Extract parameter constraints from model schema
        if (matchedModel.modelDefaultParams) {
          extractParamConstraints(matchedModel.modelDefaultParams);
        }

        // Optionally fetch additional baseUrl details
        setModelHashToFetch(selectedModelHash);
      }
    }
  }, [selectedModelHash, processWithModels, extractParamConstraints]);

  // When a prompt is selected, fetch its full details
  React.useEffect(() => {
    if (selectedPromptHash) {
      setPromptHashToFetch(selectedPromptHash);
    }
  }, [selectedPromptHash]);

  // Compute prompt type availability
  const hasSystemPrompts = useMemo(() => {
    return (
      processWithModels?.accessiblePrompts?.some(
        (p: any) =>
          p.promptType === 'system' || p.promptType?.includes('system')
      ) || false
    );
  }, [processWithModels]);

  const hasUserPrompts = useMemo(() => {
    return (
      processWithModels?.accessiblePrompts?.some(
        (p: any) => p.promptType === 'user' || p.promptType?.includes('user')
      ) || false
    );
  }, [processWithModels]);

  const hasEventsPrompts = useMemo(() => {
    return (
      processWithModels?.accessiblePrompts?.some(
        (p: any) =>
          p.promptType === 'events_list' || p.promptType?.includes('events')
      ) || false
    );
  }, [processWithModels]);

  // Helper to render events list prompts section (always visible)
  const renderEventsListPromptsSection = () => {
    console.log('[renderEventsListPromptsSection]', {
      hasAccessiblePrompts: !!processWithModels?.accessiblePrompts,
      promptsCount: processWithModels?.accessiblePrompts?.length || 0,
      hasEventsPrompts,
      currentProcessName,
    });

    if (
      !processWithModels?.accessiblePrompts ||
      processWithModels.accessiblePrompts.length === 0
    ) {
      return null;
    }

    // Check if current pipeline is Transcript Generation (which doesn't use events list)
    const isTranscriptGeneration =
      currentProcessName.toLowerCase().includes('vlm') ||
      currentProcessName.toLowerCase().includes('transcript');

    return (
      <>
        {/* Prompts Section Header with Create Button */}
        <div className="flex items-center justify-between mb-3 pt-2 border-t border-border">
          <label className="text-sm font-medium text-foreground">
            Prompts Configuration
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!currentProcessName) {
                toast.error('Please select a process before creating a prompt');
                return;
              }
              setIsCreatePromptDialogOpen(true);
            }}
            className="gap-2 h-8"
          >
            <Plus className="w-4 h-4" />
            Create Prompt
          </Button>
        </div>

        {/* Only show Events List Prompt for pipelines that support it (not Transcript Generation) */}
        {hasEventsPrompts && !isTranscriptGeneration && (
          <div className="space-y-2">
            <PromptSelectionField
              label="Events List Prompt"
              requiredTypes={['events_list']}
              accessiblePrompts={processWithModels.accessiblePrompts as any[]}
              value={selectedPrompts.eventsListPromptHash || ''}
              selectedParentHash={selectedPrompts.parentEventsListHash || ''}
              onChange={(val: string, meta?: Record<string, unknown>) => {
                setSelectedPrompts((prev) => ({
                  ...prev,
                  eventsListPromptHash: val,
                  parentEventsListHash:
                    (meta?.parentPromptHash as string) ||
                    prev.parentEventsListHash ||
                    '',
                }));
              }}
            />
          </div>
        )}
      </>
    );
  };

  // Helper to render prompts section (system and user only)
  const renderPromptsSection = () => {
    console.log('[renderPromptsSection]', {
      hasAccessiblePrompts: !!processWithModels?.accessiblePrompts,
      promptsCount: processWithModels?.accessiblePrompts?.length || 0,
      prompts:
        processWithModels?.accessiblePrompts?.map((p: any) => ({
          name: p.promptName,
          type: p.promptType,
          hash: p.promptHash?.substring(0, 8),
        })) || [],
      hasSystemPrompts,
      hasUserPrompts,
    });

    if (
      !processWithModels?.accessiblePrompts ||
      processWithModels.accessiblePrompts.length === 0
    ) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* System Prompt */}
        {hasSystemPrompts && (
          <>
            <PromptSelectionField
              label="System Prompt"
              requiredTypes={['system']}
              accessiblePrompts={processWithModels.accessiblePrompts as any[]}
              value={selectedPrompts.systemPromptHash || ''}
              selectedParentHash={selectedPrompts.parentSystemHash || ''}
              onChange={(val: string, meta?: Record<string, unknown>) => {
                setSelectedPrompts((prev) => ({
                  ...prev,
                  systemPromptHash: val,
                  parentSystemHash:
                    (meta?.parentPromptHash as string) ||
                    prev.parentSystemHash ||
                    '',
                }));
              }}
            />
            {hasUserPrompts && <Separator />}
          </>
        )}

        {/* User Prompt */}
        {hasUserPrompts && (
          <PromptSelectionField
            label="User Prompt"
            requiredTypes={['user']}
            accessiblePrompts={processWithModels.accessiblePrompts as any[]}
            value={selectedPrompts.userPromptHash || ''}
            selectedParentHash={selectedPrompts.parentUserHash || ''}
            onChange={(val: string, meta?: Record<string, unknown>) => {
              setSelectedPrompts((prev) => ({
                ...prev,
                userPromptHash: val,
                parentUserHash:
                  (meta?.parentPromptHash as string) ||
                  prev.parentUserHash ||
                  '',
              }));
            }}
          />
        )}
      </div>
    );
  };

  // Handler for when a new prompt is created
  // Refetch process with models to update accessiblePrompts list
  const handlePromptCreated = async (newPrompt?: any) => {
    console.log(
      '[handlePromptCreated] Prompt created, refetching accessible prompts',
      {
        newPromptHash: newPrompt?.promptHash?.substring(0, 8),
        newPromptType: newPrompt?.promptType,
        selectedProcessHash: selectedProcessHash?.substring(0, 8),
      }
    );

    try {
      // When a new prompt is created, it's added to the org's prompt library
      // Only GET_PROCESS_WITH_MODELS needs to be refetched to show the new prompt in UI
      // Config details don't change, so no need to refetch configs
      if (selectedProcessHash) {
        const result = await fetchProcessWithModels({
          variables: { orgProcessHash: selectedProcessHash },
        });

        console.log('[handlePromptCreated] Refetch completed', {
          promptsCount:
            result?.data?.getProcessWithModels?.accessiblePrompts?.length || 0,
        });

        // Auto-select the newly created prompt in the appropriate dropdown
        if (newPrompt?.promptHash && newPrompt?.promptType) {
          const promptType = (newPrompt.promptType as string).toLowerCase();
          const promptHash = newPrompt.promptHash as string;

          console.log('[handlePromptCreated] Auto-selecting new prompt', {
            promptHash: promptHash.substring(0, 8),
            promptType,
          });

          // Determine which prompt field to update based on the prompt type
          // The promptType can be a fully qualified path like "process/_/system" or just "system"
          if (promptType.includes('system') || promptType.endsWith('system')) {
            setSelectedPrompts((prev) => ({
              ...prev,
              systemPromptHash: promptHash,
              parentSystemHash: promptHash, // New templates are their own parent
            }));
            console.log('[handlePromptCreated] Set as system prompt');
          } else if (
            promptType.includes('user') ||
            promptType.endsWith('user')
          ) {
            setSelectedPrompts((prev) => ({
              ...prev,
              userPromptHash: promptHash,
              parentUserHash: promptHash, // New templates are their own parent
            }));
            console.log('[handlePromptCreated] Set as user prompt');
          } else if (
            promptType.includes('events_list') ||
            promptType.includes('eventslist')
          ) {
            setSelectedPrompts((prev) => ({
              ...prev,
              eventsListPromptHash: promptHash,
              parentEventsListHash: promptHash, // New templates are their own parent
            }));
            console.log('[handlePromptCreated] Set as events list prompt');
          }

          toast.success('New prompt created and selected');
        } else {
          // Show success message after refetch completes
          toast.success('New prompt is now available for selection');
        }
      } else {
        console.warn('[handlePromptCreated] selectedProcessHash not available');
        toast.error('Could not refresh prompts list - please reload the page');
      }
    } catch (error) {
      console.error('Error in handlePromptCreated:', error);
      toast.error('Failed to refresh prompts list');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background border rounded-lg">
      <CreatePromptDialog
        isOpen={isCreatePromptDialogOpen}
        onClose={() => {
          setIsCreatePromptDialogOpen(false);
        }}
        onPromptCreated={handlePromptCreated}
        processName={currentProcessName}
        showEventsListCategory={
          !(
            currentProcessName.toLowerCase().includes('vlm') ||
            currentProcessName.toLowerCase().includes('transcript')
          )
        }
      />
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {!entity ? (
          <Card>
            <CardHeader>
              <CardTitle>
                No {configType === 'batch' ? 'Batch' : 'Camera'} Selected
              </CardTitle>
              <CardDescription>
                Please select {configType === 'batch' ? 'a batch' : 'a camera'}{' '}
                to configure.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : allConfigs.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Configuration Found</CardTitle>
              <CardDescription>
                No process configuration exists for this {configType}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            {/* Configuration Header */}
            <Card>
              <CardHeader>
                <CardTitle>{entityName}</CardTitle>
                <CardDescription>
                  Configure processing pipelines for this {configType}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Pipelines Configuration */}
            <div className="space-y-6 p-2">
              {/* Step 1: Process Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    1
                  </span>
                  <h3 className="text-lg font-semibold">Pipelines</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {allConfigs
                    .slice()
                    .sort((a: any, b: any) => {
                      return (
                        getProcessPriority(a.orgProcessName || '') -
                        getProcessPriority(b.orgProcessName || '')
                      );
                    })
                    .map((config) => {
                      const configRecord = config as unknown as Record<
                        string,
                        unknown
                      >;
                      const configId =
                        configRecord.camProcessConfigHash as string;
                      const processName =
                        toDisplayName(
                          configRecord.orgProcessName as string | undefined
                        ) || 'Process Configuration';
                      const isExpanded = expandedConfigHash === configId;

                      // Determine description based on process type
                      const getDescription = (name: string) => {
                        if (name === 'Event Detection') {
                          return 'Configure alerts and detections for this camera.';
                        } else if (name === 'Video Preprocessing') {
                          return 'Required preprocessing for analysis.';
                        } else if (name.includes('Inference')) {
                          return 'AI model inference processing.';
                        }
                        return 'Required for analysis';
                      };

                      return (
                        <div
                          key={configId}
                          className={`flex flex-col items-start justify-between rounded-xl border px-3 py-3 text-left bg-card min-w-[140px] border-primary/60 shadow-sm transition-all ${
                            isExpanded
                              ? 'shadow-lg ring-2 ring-primary/20'
                              : 'shadow-sm'
                          }`}
                        >
                          <div className="w-full">
                            <div className="text-sm font-medium leading-snug break-words whitespace-normal text-foreground">
                              {processName}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground text-left leading-snug break-words line-clamp-3">
                              {getDescription(processName)}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between w-full text-[11px]">
                            <div className="inline-flex items-center gap-1">
                              <CircleCheck className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Enabled
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Step 2: Tabs Section - Only show if there are enabled configs */}
              {enabledConfigs.size > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        2
                      </span>
                      <h3 className="text-lg font-semibold">
                        Pipeline Configuration
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {enabledConfigs.size} Selected
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure each pipeline using the tabs below. Edit models,
                    prompts, and parameters.
                  </p>

                  <Tabs
                    value={expandedConfigHash || ''}
                    onValueChange={(value) => {
                      if (value !== expandedConfigHash) {
                        setIsSwitchingPipeline(true);
                        setExpandedConfigHash(value);
                        setConfigHashToFetch(value);
                        setConfigData(null);
                        setModelData(null);
                        setPromptData(null);
                        setSystemPromptData(null);
                        setUserPromptData(null);
                        setEventsListPromptData(null);
                        setCurrentProcessName('');
                        setCurrentPromptName('');
                        setModelHashToFetch('');
                        setPromptHashToFetch('');
                        // Reset editable parameters to defaults
                        setTemperature(0.7);
                        setMaxTokens(1000);
                        setWidth(1920);
                        setHeight(1080);
                        setSelectedModelHash('');
                        setSelectedPrompts({
                          systemPromptHash: '',
                          userPromptHash: '',
                          eventsListPromptHash: '',
                          parentSystemHash: '',
                          parentUserHash: '',
                          parentEventsListHash: '',
                        });
                        // Reset processWithModels to clear old prompts
                        setProcessWithModels(null);
                        setSelectedProcessHash('');
                        detailedConfigProcessedRef.current = false;
                        modelDataProcessedRef.current = false;
                      }
                    }}
                    className="w-full"
                  >
                    <TabsList className="inline-flex gap-2 mb-3 flex-wrap">
                      {allConfigs
                        .filter((config: any) =>
                          enabledConfigs.has(
                            (config as any).camProcessConfigHash
                          )
                        )
                        .sort((a: any, b: any) => {
                          return (
                            getProcessPriority(a.orgProcessName || '') -
                            getProcessPriority(b.orgProcessName || '')
                          );
                        })
                        .map((config) => {
                          const configRecord = config as unknown as Record<
                            string,
                            unknown
                          >;
                          const configId =
                            configRecord.camProcessConfigHash as string;
                          const processName =
                            toDisplayName(
                              configRecord.orgProcessName as string | undefined
                            ) || 'Process';

                          return (
                            <TabsTrigger
                              key={configId}
                              value={configId}
                              className="px-3 py-1.5 text-xs"
                            >
                              {processName}
                            </TabsTrigger>
                          );
                        })}
                    </TabsList>

                    {allConfigs
                      .filter((config: any) =>
                        enabledConfigs.has((config as any).camProcessConfigHash)
                      )
                      .sort((a: any, b: any) => {
                        return (
                          getProcessPriority(a.orgProcessName || '') -
                          getProcessPriority(b.orgProcessName || '')
                        );
                      })
                      .map((config) => {
                        const configRecord = config as unknown as Record<
                          string,
                          unknown
                        >;
                        const configId =
                          configRecord.camProcessConfigHash as string;

                        return (
                          <TabsContent
                            key={configId}
                            value={configId}
                            className="mt-0"
                          >
                            <div className="p-5 pl-0 pr-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                              {detailedLoading ||
                              isSwitchingPipeline ||
                              !configData ||
                              configData.configHash !== configId ||
                              isProcessWithModelsLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                                  <span className="text-sm text-muted-foreground">
                                    Loading details...
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <div className="space-y-4 mt-1">
                                      {/* Model Selection Section */}
                                      {processWithModels?.accessibleModels &&
                                        processWithModels.accessibleModels
                                          .length > 0 && (
                                          <div className="space-y-2">
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                              <Cpu className="w-4 h-4 text-primary" />
                                              Select Model
                                            </label>
                                            <Select
                                              value={selectedModelHash}
                                              onValueChange={(value) => {
                                                setSelectedModelHash(value);
                                              }}
                                            >
                                              <SelectTrigger className="w-full bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300">
                                                <SelectValue placeholder="Select a model..." />
                                              </SelectTrigger>
                                              <SelectContent
                                                position="popper"
                                                sideOffset={5}
                                                align="start"
                                                className="w-full bg-background text-foreground border-border max-h-[300px] overflow-y-auto"
                                              >
                                                {processWithModels.accessibleModels.map(
                                                  (model: AccessibleModel) => (
                                                    <SelectItem
                                                      key={model.modelHash}
                                                      value={model.modelHash}
                                                    >
                                                      {model.modelName}
                                                    </SelectItem>
                                                  )
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}

                                      {renderEventsListPromptsSection()}

                                      {/* Conditional rendering based on pipeline type */}
                                      {(() => {
                                        const processNameLower =
                                          currentProcessName.toLowerCase();
                                        const isVideoProcessing =
                                          processNameLower.includes('video') ||
                                          processNameLower.includes(
                                            'preprocessing'
                                          );

                                        // Schema-only pipeline: has processParamSchema fields
                                        // but no accessible models or prompts
                                        const paramSchema =
                                          processWithModels?.processParamSchema as
                                            | {
                                                properties?: Record<
                                                  string,
                                                  {
                                                    type?: string;
                                                    title?: string;
                                                    default?: unknown;
                                                    minimum?: number;
                                                    maximum?: number;
                                                    $ref?: string;
                                                    description?: string;
                                                    oneOf?: {
                                                      const: string;
                                                      title: string;
                                                    }[];
                                                  }
                                                >;
                                                $defs?: Record<
                                                  string,
                                                  {
                                                    properties?: Record<
                                                      string,
                                                      {
                                                        type?: string;
                                                        title?: string;
                                                        default?: unknown;
                                                        minimum?: number;
                                                        maximum?: number;
                                                        description?: string;
                                                      }
                                                    >;
                                                  }
                                                >;
                                              }
                                            | undefined;
                                        const schemaProperties = Object.entries(
                                          paramSchema?.properties || {}
                                        ).filter(([k]) => k !== 'version');
                                        const isSchemaOnlyPipeline =
                                          schemaProperties.length > 0 &&
                                          (processWithModels?.accessibleModels
                                            ?.length ?? 0) === 0 &&
                                          (processWithModels?.accessiblePrompts
                                            ?.length ?? 0) === 0;

                                        if (isSchemaOnlyPipeline) {
                                          return (
                                            <>
                                              <Separator />
                                              <div className="space-y-4">
                                                {schemaProperties.map(
                                                  ([fieldKey, fieldDef]) => {
                                                    const label =
                                                      fieldDef.title ||
                                                      fieldKey;
                                                    const currentVal =
                                                      schemaFieldValues[
                                                        fieldKey
                                                      ] ??
                                                      fieldDef.default ??
                                                      '';

                                                    if (
                                                      fieldDef.oneOf &&
                                                      fieldDef.oneOf.length > 0
                                                    ) {
                                                      return (
                                                        <div
                                                          key={fieldKey}
                                                          className="space-y-2"
                                                        >
                                                          <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                            {label}
                                                          </label>
                                                          <Select
                                                            value={String(
                                                              currentVal
                                                            )}
                                                            onValueChange={(
                                                              v
                                                            ) =>
                                                              setSchemaFieldValues(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [fieldKey]: v,
                                                                })
                                                              )
                                                            }
                                                          >
                                                            <SelectTrigger className="w-full bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300">
                                                              <SelectValue
                                                                placeholder={`Select ${label}...`}
                                                              />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              {fieldDef.oneOf.map(
                                                                (opt) => (
                                                                  <SelectItem
                                                                    key={
                                                                      opt.const
                                                                    }
                                                                    value={
                                                                      opt.const
                                                                    }
                                                                  >
                                                                    {opt.title}
                                                                  </SelectItem>
                                                                )
                                                              )}
                                                            </SelectContent>
                                                          </Select>
                                                        </div>
                                                      );
                                                    }

                                                    // Nested object via $ref (e.g. video_frames → VideoFramesSchema)
                                                    if (fieldDef.$ref) {
                                                      const defName =
                                                        fieldDef.$ref
                                                          .split('/')
                                                          .pop();
                                                      const def = defName
                                                        ? paramSchema?.$defs?.[
                                                            defName
                                                          ]
                                                        : undefined;
                                                      if (!def?.properties)
                                                        return null;

                                                      const subProps =
                                                        def.properties;

                                                      return (
                                                        <div
                                                          key={fieldKey}
                                                          className="space-y-3 p-4 border rounded-lg bg-muted/20"
                                                        >
                                                          <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                            <Settings2 className="w-4 h-4 text-primary" />
                                                            Video Frames
                                                            Configuration
                                                          </label>
                                                          <div className="grid grid-cols-2 gap-4">
                                                            {subProps.width && (
                                                              <div className="space-y-1.5">
                                                                <label className="text-xs text-muted-foreground font-medium">
                                                                  Width
                                                                  {(subProps
                                                                    .width
                                                                    .minimum !==
                                                                    undefined ||
                                                                    subProps
                                                                      .width
                                                                      .maximum !==
                                                                      undefined) && (
                                                                    <span className="ml-1 opacity-70">
                                                                      (
                                                                      {subProps
                                                                        .width
                                                                        .minimum ??
                                                                        ''}{' '}
                                                                      –{' '}
                                                                      {subProps
                                                                        .width
                                                                        .maximum ??
                                                                        ''}
                                                                      )
                                                                    </span>
                                                                  )}
                                                                </label>
                                                                <Input
                                                                  type="number"
                                                                  className="h-9 bg-background text-foreground border-border"
                                                                  placeholder={String(
                                                                    subProps
                                                                      .width
                                                                      .default ??
                                                                      500
                                                                  )}
                                                                  min={
                                                                    subProps
                                                                      .width
                                                                      .minimum
                                                                  }
                                                                  max={
                                                                    subProps
                                                                      .width
                                                                      .maximum
                                                                  }
                                                                  value={width}
                                                                  onChange={(
                                                                    e
                                                                  ) => {
                                                                    const val =
                                                                      parseInt(
                                                                        e.target
                                                                          .value
                                                                      );
                                                                    if (
                                                                      !isNaN(
                                                                        val
                                                                      )
                                                                    )
                                                                      setWidth(
                                                                        val
                                                                      );
                                                                  }}
                                                                />
                                                              </div>
                                                            )}
                                                            {subProps.height && (
                                                              <div className="space-y-1.5">
                                                                <label className="text-xs text-muted-foreground font-medium">
                                                                  Height
                                                                  {(subProps
                                                                    .height
                                                                    .minimum !==
                                                                    undefined ||
                                                                    subProps
                                                                      .height
                                                                      .maximum !==
                                                                      undefined) && (
                                                                    <span className="ml-1 opacity-70">
                                                                      (
                                                                      {subProps
                                                                        .height
                                                                        .minimum ??
                                                                        ''}{' '}
                                                                      –{' '}
                                                                      {subProps
                                                                        .height
                                                                        .maximum ??
                                                                        ''}
                                                                      )
                                                                    </span>
                                                                  )}
                                                                </label>
                                                                <Input
                                                                  type="number"
                                                                  className="h-9 bg-background text-foreground border-border"
                                                                  placeholder={String(
                                                                    subProps
                                                                      .height
                                                                      .default ??
                                                                      400
                                                                  )}
                                                                  min={
                                                                    subProps
                                                                      .height
                                                                      .minimum
                                                                  }
                                                                  max={
                                                                    subProps
                                                                      .height
                                                                      .maximum
                                                                  }
                                                                  value={height}
                                                                  onChange={(
                                                                    e
                                                                  ) => {
                                                                    const val =
                                                                      parseInt(
                                                                        e.target
                                                                          .value
                                                                      );
                                                                    if (
                                                                      !isNaN(
                                                                        val
                                                                      )
                                                                    )
                                                                      setHeight(
                                                                        val
                                                                      );
                                                                  }}
                                                                />
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    }

                                                    return (
                                                      <div
                                                        key={fieldKey}
                                                        className="space-y-2"
                                                      >
                                                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                          {label}
                                                          {(fieldDef.minimum !==
                                                            undefined ||
                                                            fieldDef.maximum !==
                                                              undefined) && (
                                                            <span className="text-xs text-muted-foreground font-normal">
                                                              (
                                                              {fieldDef.minimum ??
                                                                ''}
                                                              {fieldDef.minimum !==
                                                                undefined &&
                                                                fieldDef.maximum !==
                                                                  undefined &&
                                                                ' – '}
                                                              {fieldDef.maximum ??
                                                                ''}
                                                              )
                                                            </span>
                                                          )}
                                                        </label>
                                                        <Input
                                                          type="number"
                                                          value={Number(
                                                            currentVal
                                                          )}
                                                          min={fieldDef.minimum}
                                                          max={fieldDef.maximum}
                                                          step={1}
                                                          onChange={(e) => {
                                                            const parsed =
                                                              parseInt(
                                                                e.target.value
                                                              );
                                                            if (!isNaN(parsed))
                                                              setSchemaFieldValues(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [fieldKey]:
                                                                    parsed,
                                                                })
                                                              );
                                                          }}
                                                          className="h-9 bg-background text-foreground border-border"
                                                        />
                                                      </div>
                                                    );
                                                  }
                                                )}
                                              </div>
                                            </>
                                          );
                                        }

                                        if (!isVideoProcessing) {
                                          // Event Detection and Transcript Generation pipelines
                                          return (
                                            <>
                                              {/* Additional Parameters - Collapsible Section */}
                                              <Separator />
                                              <Accordion
                                                type="single"
                                                collapsible
                                              >
                                                <AccordionItem value="additional-params">
                                                  <AccordionTrigger className="px-3 py-2 text-left text-sm font-medium border text-foreground hover:bg-muted/50 transition-colors hover:no-underline">
                                                    Additional Parameters
                                                  </AccordionTrigger>
                                                  <AccordionContent className="space-y-4 pt-2">
                                                    {renderPromptsSection()}

                                                    {(hasSystemPrompts ||
                                                      hasUserPrompts) && (
                                                      <Separator />
                                                    )}

                                                    {/* Temperature with Slider */}
                                                    <div className="space-y-2">
                                                      <label className="text-sm font-medium leading-none flex items-center">
                                                        Temperature
                                                        <TooltipProvider>
                                                          <Tooltip
                                                            delayDuration={200}
                                                          >
                                                            <TooltipTrigger
                                                              asChild
                                                            >
                                                              <Info className="w-3 h-3 inline ml-1 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                                                              Controls
                                                              randomness in the
                                                              model's output.{' '}
                                                              <br /> Lower
                                                              values make output
                                                              more
                                                              deterministic,
                                                              higher values more
                                                              random.
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                      </label>
                                                      <div
                                                        className="flex items-center gap-4"
                                                        style={{
                                                          touchAction: 'none',
                                                        }}
                                                        onPointerDown={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                        onTouchStart={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                        onTouchMove={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                      >
                                                        <Slider
                                                          min={
                                                            paramConstraints
                                                              .temperature.min
                                                          }
                                                          max={
                                                            paramConstraints
                                                              .temperature.max
                                                          }
                                                          step={0.01}
                                                          value={[temperature]}
                                                          onValueChange={(
                                                            value
                                                          ) =>
                                                            setTemperature(
                                                              value[0]
                                                            )
                                                          }
                                                          className="flex-1 text-teal-500"
                                                        />
                                                        <Input
                                                          type="number"
                                                          value={temperature}
                                                          onChange={(e) => {
                                                            const val =
                                                              parseFloat(
                                                                e.target.value
                                                              );
                                                            if (!isNaN(val))
                                                              setTemperature(
                                                                val
                                                              );
                                                          }}
                                                          className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border h-9"
                                                          step={0.01}
                                                          min={
                                                            paramConstraints
                                                              .temperature.min
                                                          }
                                                          max={
                                                            paramConstraints
                                                              .temperature.max
                                                          }
                                                        />
                                                      </div>
                                                    </div>

                                                    {/* Max Tokens with Slider */}
                                                    <div className="space-y-2">
                                                      <label className="text-sm font-medium leading-none flex items-center">
                                                        Max Tokens
                                                        <TooltipProvider>
                                                          <Tooltip
                                                            delayDuration={200}
                                                          >
                                                            <TooltipTrigger
                                                              asChild
                                                            >
                                                              <Info className="w-3 h-3 inline ml-1 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                                                              The maximum number
                                                              of tokens the
                                                              model can generate
                                                              in one response.
                                                            </TooltipContent>
                                                          </Tooltip>
                                                        </TooltipProvider>
                                                      </label>
                                                      <div
                                                        className="flex items-center gap-4"
                                                        style={{
                                                          touchAction: 'none',
                                                        }}
                                                        onPointerDown={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                        onTouchStart={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                        onTouchMove={(e) =>
                                                          e.stopPropagation()
                                                        }
                                                      >
                                                        <Slider
                                                          min={
                                                            paramConstraints
                                                              .max_tokens.min
                                                          }
                                                          max={
                                                            paramConstraints
                                                              .max_tokens.max
                                                          }
                                                          step={100}
                                                          value={[maxTokens]}
                                                          onValueChange={(
                                                            value
                                                          ) =>
                                                            setMaxTokens(
                                                              value[0]
                                                            )
                                                          }
                                                          className="flex-1 text-teal-500"
                                                        />
                                                        <Input
                                                          type="number"
                                                          value={maxTokens}
                                                          onChange={(e) => {
                                                            const val =
                                                              parseInt(
                                                                e.target.value
                                                              );
                                                            if (!isNaN(val))
                                                              setMaxTokens(val);
                                                          }}
                                                          className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border h-9"
                                                          step={100}
                                                          min={
                                                            paramConstraints
                                                              .max_tokens.min
                                                          }
                                                          max={
                                                            paramConstraints
                                                              .max_tokens.max
                                                          }
                                                        />
                                                      </div>
                                                    </div>

                                                    {/* Only show width/height for event detection and transcript generation if available */}
                                                    {(() => {
                                                      const processConfig =
                                                        configData?.processConfig as
                                                          | Record<
                                                              string,
                                                              unknown
                                                            >
                                                          | undefined;
                                                      const hasVideoFrames =
                                                        processConfig?.video_frames !==
                                                        undefined;

                                                      if (!hasVideoFrames)
                                                        return null;

                                                      return (
                                                        <>
                                                          <Separator />
                                                          <div className="space-y-3">
                                                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                              <Settings2 className="w-4 h-4 text-primary" />
                                                              Video Frames
                                                              Configuration
                                                            </label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                              <div className="space-y-1.5">
                                                                <label className="text-xs text-muted-foreground font-medium">
                                                                  Width
                                                                  <span className="ml-1 opacity-70">
                                                                    (
                                                                    {
                                                                      paramConstraints
                                                                        .width
                                                                        .min
                                                                    }{' '}
                                                                    -{' '}
                                                                    {paramConstraints.width.max.toLocaleString()}
                                                                    )
                                                                  </span>
                                                                </label>
                                                                <Input
                                                                  type="number"
                                                                  step="1"
                                                                  min={
                                                                    paramConstraints
                                                                      .width.min
                                                                  }
                                                                  max={
                                                                    paramConstraints
                                                                      .width.max
                                                                  }
                                                                  value={width}
                                                                  onChange={(
                                                                    e
                                                                  ) =>
                                                                    setWidth(
                                                                      parseInt(
                                                                        e.target
                                                                          .value
                                                                      ) || 1920
                                                                    )
                                                                  }
                                                                  className="h-9 bg-background"
                                                                  placeholder="1920"
                                                                />
                                                              </div>
                                                              <div className="space-y-1.5">
                                                                <label className="text-xs text-muted-foreground font-medium">
                                                                  Height
                                                                  <span className="ml-1 opacity-70">
                                                                    (
                                                                    {
                                                                      paramConstraints
                                                                        .height
                                                                        .min
                                                                    }{' '}
                                                                    -{' '}
                                                                    {paramConstraints.height.max.toLocaleString()}
                                                                    )
                                                                  </span>
                                                                </label>
                                                                <Input
                                                                  type="number"
                                                                  step="1"
                                                                  min={
                                                                    paramConstraints
                                                                      .height
                                                                      .min
                                                                  }
                                                                  max={
                                                                    paramConstraints
                                                                      .height
                                                                      .max
                                                                  }
                                                                  value={height}
                                                                  onChange={(
                                                                    e
                                                                  ) =>
                                                                    setHeight(
                                                                      parseInt(
                                                                        e.target
                                                                          .value
                                                                      ) || 1080
                                                                    )
                                                                  }
                                                                  className="h-9 bg-background"
                                                                  placeholder="1080"
                                                                />
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </>
                                                      );
                                                    })()}
                                                  </AccordionContent>
                                                </AccordionItem>
                                              </Accordion>
                                            </>
                                          );
                                        } else {
                                          // Video Processing pipeline - show all controls directly without collapsible section
                                          return (
                                            <>
                                              <Separator />

                                              {/* System and User Prompts */}
                                              {renderPromptsSection()}

                                              {(hasSystemPrompts ||
                                                hasUserPrompts) && (
                                                <Separator />
                                              )}

                                              {/* Temperature with Slider */}
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none flex items-center">
                                                  Temperature
                                                  <TooltipProvider>
                                                    <Tooltip
                                                      delayDuration={200}
                                                    >
                                                      <TooltipTrigger asChild>
                                                        <Info className="w-3 h-3 inline ml-1 text-muted-foreground cursor-help" />
                                                      </TooltipTrigger>
                                                      <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                                                        Controls randomness in
                                                        the model's output.{' '}
                                                        <br /> Lower values make
                                                        output more
                                                        deterministic, higher
                                                        values more random.
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                </label>
                                                <div
                                                  className="flex items-center gap-4"
                                                  style={{
                                                    touchAction: 'none',
                                                  }}
                                                  onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  onTouchStart={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  onTouchMove={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <Slider
                                                    min={
                                                      paramConstraints
                                                        .temperature.min
                                                    }
                                                    max={
                                                      paramConstraints
                                                        .temperature.max
                                                    }
                                                    step={0.01}
                                                    value={[temperature]}
                                                    onValueChange={(value) =>
                                                      setTemperature(value[0])
                                                    }
                                                    className="flex-1 text-teal-500"
                                                  />
                                                  <Input
                                                    type="number"
                                                    value={temperature}
                                                    onChange={(e) => {
                                                      const val = parseFloat(
                                                        e.target.value
                                                      );
                                                      if (!isNaN(val))
                                                        setTemperature(val);
                                                    }}
                                                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border h-9"
                                                    step={0.01}
                                                    min={
                                                      paramConstraints
                                                        .temperature.min
                                                    }
                                                    max={
                                                      paramConstraints
                                                        .temperature.max
                                                    }
                                                  />
                                                </div>
                                              </div>

                                              {/* Max Tokens with Slider */}
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium leading-none flex items-center">
                                                  Max Tokens
                                                  <TooltipProvider>
                                                    <Tooltip
                                                      delayDuration={200}
                                                    >
                                                      <TooltipTrigger asChild>
                                                        <Info className="w-3 h-3 inline ml-1 text-muted-foreground cursor-help" />
                                                      </TooltipTrigger>
                                                      <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                                                        The maximum number of
                                                        tokens the model can
                                                        generate in one
                                                        response.
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                </label>
                                                <div
                                                  className="flex items-center gap-4"
                                                  style={{
                                                    touchAction: 'none',
                                                  }}
                                                  onPointerDown={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  onTouchStart={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                  onTouchMove={(e) =>
                                                    e.stopPropagation()
                                                  }
                                                >
                                                  <Slider
                                                    min={
                                                      paramConstraints
                                                        .max_tokens.min
                                                    }
                                                    max={
                                                      paramConstraints
                                                        .max_tokens.max
                                                    }
                                                    step={100}
                                                    value={[maxTokens]}
                                                    onValueChange={(value) =>
                                                      setMaxTokens(value[0])
                                                    }
                                                    className="flex-1 text-teal-500"
                                                  />
                                                  <Input
                                                    type="number"
                                                    value={maxTokens}
                                                    onChange={(e) => {
                                                      const val = parseInt(
                                                        e.target.value
                                                      );
                                                      if (!isNaN(val))
                                                        setMaxTokens(val);
                                                    }}
                                                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border h-9"
                                                    step={100}
                                                    min={
                                                      paramConstraints
                                                        .max_tokens.min
                                                    }
                                                    max={
                                                      paramConstraints
                                                        .max_tokens.max
                                                    }
                                                  />
                                                </div>
                                              </div>

                                              {/* Video Frames Configuration */}
                                              {(() => {
                                                const processConfig =
                                                  configData?.processConfig as
                                                    | Record<string, unknown>
                                                    | undefined;
                                                const hasVideoFrames =
                                                  processConfig?.video_frames !==
                                                  undefined;

                                                if (!hasVideoFrames)
                                                  return null;

                                                return (
                                                  <>
                                                    <Separator />
                                                    <div className="space-y-3">
                                                      <label className="text-sm font-medium leading-none flex items-center gap-2">
                                                        <Settings2 className="w-4 h-4 text-primary" />
                                                        Video Frames
                                                        Configuration
                                                      </label>
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                          <label className="text-xs text-muted-foreground font-medium">
                                                            Width
                                                            <span className="ml-1 opacity-70">
                                                              (
                                                              {
                                                                paramConstraints
                                                                  .width.min
                                                              }{' '}
                                                              -{' '}
                                                              {paramConstraints.width.max.toLocaleString()}
                                                              )
                                                            </span>
                                                          </label>
                                                          <Input
                                                            type="number"
                                                            step="1"
                                                            min={
                                                              paramConstraints
                                                                .width.min
                                                            }
                                                            max={
                                                              paramConstraints
                                                                .width.max
                                                            }
                                                            value={width}
                                                            onChange={(e) =>
                                                              setWidth(
                                                                parseInt(
                                                                  e.target.value
                                                                ) || 1920
                                                              )
                                                            }
                                                            className="h-9 bg-background"
                                                            placeholder="1920"
                                                          />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                          <label className="text-xs text-muted-foreground font-medium">
                                                            Height
                                                            <span className="ml-1 opacity-70">
                                                              (
                                                              {
                                                                paramConstraints
                                                                  .height.min
                                                              }{' '}
                                                              -{' '}
                                                              {paramConstraints.height.max.toLocaleString()}
                                                              )
                                                            </span>
                                                          </label>
                                                          <Input
                                                            type="number"
                                                            step="1"
                                                            min={
                                                              paramConstraints
                                                                .height.min
                                                            }
                                                            max={
                                                              paramConstraints
                                                                .height.max
                                                            }
                                                            value={height}
                                                            onChange={(e) =>
                                                              setHeight(
                                                                parseInt(
                                                                  e.target.value
                                                                ) || 1080
                                                              )
                                                            }
                                                            className="h-9 bg-background"
                                                            placeholder="1080"
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </>
                                                );
                                              })()}
                                            </>
                                          );
                                        }
                                      })()}

                                      {/* Save Button */}
                                      <Button
                                        onClick={async () => {
                                          if (!configData) {
                                            toast.error(
                                              'No configuration selected'
                                            );
                                            return;
                                          }

                                          const hasModels =
                                            processWithModels?.accessibleModels &&
                                            processWithModels.accessibleModels
                                              .length > 0;
                                          if (hasModels && !selectedModelHash) {
                                            toast.error(
                                              'Please select a model'
                                            );
                                            return;
                                          }

                                          try {
                                            // Short-circuit if nothing changed
                                            const currentConfig =
                                              (configData.processConfig as
                                                | Record<string, any>
                                                | undefined) || {};
                                            const currentParams =
                                              (currentConfig.parameters as
                                                | {
                                                    temperature?: number;
                                                    max_tokens?: number;
                                                  }
                                                | undefined) || {};
                                            const currentVideoFrames =
                                              (currentConfig.video_frames as
                                                | {
                                                    width?: number;
                                                    height?: number;
                                                  }
                                                | undefined) || {};

                                            const schemaFieldsChanged =
                                              Object.entries(
                                                schemaFieldValues
                                              ).some(
                                                ([k, v]) =>
                                                  k !== 'version' &&
                                                  String(v) !==
                                                    String(
                                                      currentConfig[k] ?? ''
                                                    )
                                              );

                                            const hasChanges =
                                              schemaFieldsChanged ||
                                              (selectedModelHash || '') !==
                                                (currentConfig.model_hash ||
                                                  '') ||
                                              (selectedPrompts.systemPromptHash ||
                                                '') !==
                                                (currentConfig.system_prompt_hash ||
                                                  '') ||
                                              (selectedPrompts.userPromptHash ||
                                                '') !==
                                                (currentConfig.user_prompt_hash ||
                                                  '') ||
                                              (selectedPrompts.eventsListPromptHash ||
                                                '') !==
                                                (currentConfig.events_list_prompt_hash ||
                                                  '') ||
                                              Number(maxTokens) !==
                                                Number(
                                                  currentParams.max_tokens ??
                                                    DEFAULT_MAX_TOKENS
                                                ) ||
                                              Number(temperature) !==
                                                Number(
                                                  currentParams.temperature ??
                                                    DEFAULT_TEMPERATURE
                                                ) ||
                                              Number(width) !==
                                                Number(
                                                  currentVideoFrames.width ??
                                                    width
                                                ) ||
                                              Number(height) !==
                                                Number(
                                                  currentVideoFrames.height ??
                                                    height
                                                );

                                            if (!hasChanges) {
                                              toast.info('No changes made');
                                              return;
                                            }

                                            // Build the correct payload structure matching camera-add format
                                            const configToUpdate: Record<
                                              string,
                                              any
                                            > = {};

                                            // Copy existing fields from backend config (excluding metadata and fields we'll rebuild)
                                            Object.entries(
                                              configData.processConfig || {}
                                            ).forEach(([key, value]) => {
                                              // Skip metadata fields that shouldn't be sent back, and fields we'll rebuild
                                              if (
                                                key === 'parameters' ||
                                                key === 'temperature' ||
                                                key === 'max_tokens' ||
                                                key === 'modelType' ||
                                                key === 'modelName' ||
                                                key === 'modelIdentifier' ||
                                                key === 'modelProvider' ||
                                                key === 'video_frames' ||
                                                key === 'model_hash' ||
                                                key === 'system_prompt_hash' ||
                                                key === 'user_prompt_hash' ||
                                                key ===
                                                  'events_list_prompt_hash' ||
                                                key === 'parent_system_hash' ||
                                                key === 'parent_user_hash' ||
                                                key ===
                                                  'parent_events_list_hash' ||
                                                key === 'version' ||
                                                key === 'prompt_hash' ||
                                                key === 'prompt_hashes'
                                              ) {
                                                return;
                                              }
                                              configToUpdate[key] = value;
                                            });

                                            // Merge any user-edited schema-driven fields (e.g. object detection params)
                                            Object.entries(
                                              schemaFieldValues
                                            ).forEach(([key, val]) => {
                                              if (
                                                key !== 'version' &&
                                                key !== 'parameters'
                                              ) {
                                                configToUpdate[key] = val;
                                              }
                                            });

                                            // Add model hash at root level
                                            if (selectedModelHash) {
                                              configToUpdate.model_hash =
                                                selectedModelHash;
                                            }

                                            // Add prompt hashes at root level
                                            if (
                                              selectedPrompts.systemPromptHash
                                            ) {
                                              configToUpdate.system_prompt_hash =
                                                selectedPrompts.systemPromptHash;
                                            }
                                            if (
                                              selectedPrompts.userPromptHash
                                            ) {
                                              configToUpdate.user_prompt_hash =
                                                selectedPrompts.userPromptHash;
                                            }
                                            if (
                                              selectedPrompts.eventsListPromptHash
                                            ) {
                                              configToUpdate.events_list_prompt_hash =
                                                selectedPrompts.eventsListPromptHash;
                                            }

                                            if (
                                              selectedPrompts.parentSystemHash
                                            ) {
                                              configToUpdate.parent_system_hash =
                                                selectedPrompts.parentSystemHash;
                                            }
                                            if (
                                              selectedPrompts.parentUserHash
                                            ) {
                                              configToUpdate.parent_user_hash =
                                                selectedPrompts.parentUserHash;
                                            }
                                            if (
                                              selectedPrompts.parentEventsListHash
                                            ) {
                                              configToUpdate.parent_events_list_hash =
                                                selectedPrompts.parentEventsListHash;
                                            }

                                            // Nest temperature and max_tokens inside parameters object
                                            configToUpdate.parameters = {
                                              max_tokens: maxTokens,
                                              temperature: temperature,
                                            };

                                            // Only include video_frames if the current pipeline uses it
                                            const processConfig =
                                              configData.processConfig as
                                                | Record<string, unknown>
                                                | undefined;
                                            const hasVideoFrames =
                                              processConfig?.video_frames !==
                                              undefined;
                                            const processNameLower =
                                              currentProcessName.toLowerCase();
                                            const isVideoProcessing =
                                              processNameLower.includes(
                                                'video'
                                              ) ||
                                              processNameLower.includes(
                                                'preprocessing'
                                              );

                                            if (
                                              hasVideoFrames ||
                                              isVideoProcessing
                                            ) {
                                              configToUpdate.video_frames = {
                                                width: width,
                                                height: height,
                                              };
                                            }

                                            await updateConfig({
                                              variables: {
                                                input: {
                                                  camProcessConfigHash:
                                                    configData.configHash,
                                                  processConfig: configToUpdate,
                                                },
                                              },
                                            });
                                          } catch {
                                            toast.error(
                                              'Failed to update configuration'
                                            );
                                          }
                                        }}
                                        disabled={updateLoading}
                                        className="w-full"
                                        size="sm"
                                      >
                                        {updateLoading ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          'Save Configuration'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </TabsContent>
                        );
                      })}
                  </Tabs>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveConfiguration;
