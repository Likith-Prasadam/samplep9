import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Edit2,
  ChevronDown,
  Save,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form } from '@/components/ui/form';
import {
  UPDATE_CAM_PROCESS_CONFIG,
  DELETE_CAM_PROCESS_CONFIG,
  GET_CAM_PROCESS_CONFIGS,
  GET_CAM_PROCESS_CONFIG,
} from '@/graphql/camera-process-config-queries';
import {
  GET_PROCESS_CATALOG,
  GET_PROCESS_WITH_MODELS,
} from '@/graphql/workflow_queries';
import { ProcessConfigDisplay } from './components/process-config-display';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import { PromptSelectionField } from '@/components/pipeline-configuration/prompt-selection';
import { CreatePromptDialog } from '@/components/pipeline-configuration/create-prompt-dialog';

const configSchema = z.object({
  processConfig: z.record(z.string(), z.any()).optional(),
});

type ConfigFormData = z.infer<typeof configSchema>;

interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  orgProcessDescription?: string;
}

interface AccessibleModel {
  modelHash: string;
  modelName: string;
  modelType: string;
  modelProvider: string;
  modelIdentifier?: string;
}

interface ProcessWithModelsData {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  accessibleModels: AccessibleModel[];
  accessiblePrompts: PromptData[];
}

interface PromptData {
  promptHash: string;
  promptName: string;
  promptType: string;
  parentPromptHash?: string | null;
}

interface PromptHashes {
  systemPromptHash?: string;
  userPromptHash?: string;
  eventsListPromptHash?: string;
}

const CameraConfigurePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [configData, setConfigData] = useState<Record<string, unknown> | null>(
    null
  );
  const [configHashToFetch, setConfigHashToFetch] = useState<string>('');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedProcessHash, setSelectedProcessHash] = useState<string>('');
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [editingProcess, setEditingProcess] =
    useState<ProcessCatalogItem | null>(null);
  const [editingModel, setEditingModel] = useState<AccessibleModel | null>(
    null
  );
  const [editingPrompts, setEditingPrompts] = useState<PromptHashes>({
    systemPromptHash: '',
    userPromptHash: '',
    eventsListPromptHash: '',
  });
  const [isCreatePromptDialogOpen, setIsCreatePromptDialogOpen] =
    useState(false);

  // Use refs to track if we've already processed the queries
  const firstQueryProcessedRef = useRef(false);
  const secondQueryProcessedRef = useRef(false);

  const camera = location.state?.camera as Camera | undefined;

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      processConfig: {},
    },
  });

  // Handle opening update dialog - initialize with current process data
  const handleOpenUpdateDialog = () => {
    if (configData) {
      const currentProcessHash = configData.orgProcessHash as string;
      const currentProcessName = configData.orgProcessName as string;

      // Set current process as selected
      setSelectedProcessHash(currentProcessHash);
      setEditingProcess({
        orgProcessHash: currentProcessHash,
        orgProcessName: currentProcessName,
        orgProcessType: '',
        orgProcessDescription: '',
      });

      // Parse and set current model and prompt hashes
      let processConfig = configData.processConfig;
      if (typeof processConfig === 'string') {
        try {
          processConfig = JSON.parse(processConfig);
        } catch {
          processConfig = {};
        }
      }

      // Set current model
      const modelHash = (processConfig as Record<string, unknown>)
        ?.model_hash as string | undefined;
      if (modelHash) {
        // We'll set the full model object once processWithModels loads
        setEditingModel({ modelHash } as AccessibleModel);
      }

      const promptHashes = (processConfig as Record<string, unknown>)
        ?.prompt_hashes as Record<string, unknown> | undefined;

      if (promptHashes) {
        setEditingPrompts({
          systemPromptHash: (promptHashes.system_prompt_hash as string) || '',
          userPromptHash: (promptHashes.user_prompt_hash as string) || '',
          eventsListPromptHash:
            (promptHashes.events_list_prompt_hash as string) || '',
        });
      }
    }
    setShowUpdateDialog(true);
  };

  // First: Fetch all configs and get the first one's hash
  const {
    loading: configsLoading,
    error: configsError,
    data: configsData,
    refetch: refetchConfigs,
  } = useQuery(GET_CAM_PROCESS_CONFIGS, {
    variables: { cam_hash: camera?.cam_hash || '' },
    skip: !camera?.cam_hash,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Process first query data with useEffect
  useEffect(() => {
    // Process when we have new data and either haven't processed yet OR ref was reset for update
    if (configsData && !configsLoading && !firstQueryProcessedRef.current) {
      const configs = configsData?.getCamProcessConfigs || [];
      if (configs.length > 0) {
        const firstConfig = configs[0];
        setConfigHashToFetch(firstConfig.camProcessConfigHash as string);
        firstQueryProcessedRef.current = true;
      }
    }
  }, [configsData, configsLoading]);

  // Second: Fetch detailed config with processConfig
  const {
    loading: detailedLoading,
    error: detailedError,
    data: detailedData,
    refetch: refetchDetailedConfig,
  } = useQuery(GET_CAM_PROCESS_CONFIG, {
    variables: { cam_process_config_hash: configHashToFetch },
    skip: !configHashToFetch,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Process second query data with useEffect
  useEffect(() => {
    // Process when we have new data and either haven't processed yet OR ref was reset for update
    if (detailedData && !detailedLoading && !secondQueryProcessedRef.current) {
      const detailedConfig = detailedData?.getCamProcessConfig;
      if (detailedConfig) {
        // Parse processConfig if it's a string
        let parsedConfig = detailedConfig.processConfig;
        if (typeof parsedConfig === 'string') {
          try {
            parsedConfig = JSON.parse(parsedConfig);
          } catch {
            parsedConfig = {};
          }
        }

        // Set configData with parsed config
        setConfigData({
          ...detailedConfig,
          processConfig: parsedConfig,
        });

        form.reset({
          processConfig: parsedConfig || {},
        });
        secondQueryProcessedRef.current = true;
      }
    }
  }, [detailedData, detailedLoading, form]);

  // Fetch process catalog for update dialog
  const { data: catalogData, loading: catalogLoading } = useQuery(
    GET_PROCESS_CATALOG,
    {
      skip: !showUpdateDialog,
    }
  );

  // Fetch process details with models when updating
  const {
    data: processModelsData,
    loading: processModelsLoading,
    refetch: refetchProcessWithModels,
  } = useQuery(GET_PROCESS_WITH_MODELS, {
    variables: { orgProcessHash: selectedProcessHash },
    skip: !selectedProcessHash,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // When process models load, match and set the full current model object
  useEffect(() => {
    if (processModelsData?.getProcessWithModels && editingModel?.modelHash) {
      const models =
        processModelsData.getProcessWithModels.accessibleModels || [];
      const matchedModel = models.find(
        (m: AccessibleModel) => m.modelHash === editingModel.modelHash
      );
      if (matchedModel && !editingModel.modelName) {
        // Only update if we don't have the full model data yet
        setEditingModel(matchedModel);
      }
    }
  }, [processModelsData, editingModel]);

  // Update mutation
  const [updateConfig, { loading: updateLoading }] = useMutation(
    UPDATE_CAM_PROCESS_CONFIG,
    {
      onCompleted: async (data) => {
        console.log('Configuration updated:', data);

        // Reset refs to allow data reprocessing
        firstQueryProcessedRef.current = false;
        secondQueryProcessedRef.current = false;

        // Manually refetch with network-only to ensure fresh data
        try {
          await Promise.all([refetchConfigs(), refetchDetailedConfig()]);
          toast.success('Configuration updated successfully');
        } catch (error) {
          console.error('Refetch error:', error);
          toast.success('Configuration updated (view may need refresh)');
        }

        // Close update dialog if it was open
        setShowUpdateDialog(false);
        setSelectedProcessHash('');
        setEditingProcess(null);
        setEditingModel(null);
        setEditingPrompts({
          systemPromptHash: '',
          userPromptHash: '',
          eventsListPromptHash: '',
        });
        setShowProcessDropdown(false);
        setShowModelDropdown(false);
      },
      onError: (error) => {
        console.error('Update error:', error);
        toast.error(`Failed to update configuration: ${error.message}`);
      },
    }
  );

  // Delete mutation
  const [deleteConfig, { loading: deleteLoading }] = useMutation(
    DELETE_CAM_PROCESS_CONFIG,
    {
      onCompleted: () => {
        console.log('Configuration deleted');
        toast.success('Configuration deleted successfully');
        navigate('/cameras');
      },
      onError: (error) => {
        console.error('Delete error:', error);
        toast.error(`Failed to delete configuration: ${error.message}`);
      },
      refetchQueries: [
        {
          query: GET_CAM_PROCESS_CONFIGS,
          variables: { cam_hash: camera?.cam_hash || '' },
        },
      ],
      awaitRefetchQueries: true,
    }
  );

  const processCatalog: ProcessCatalogItem[] =
    catalogData?.getProcessCatalog || [];
  const processWithModels: ProcessWithModelsData | undefined =
    processModelsData?.getProcessWithModels;

  const handleUpdateConfiguration = async () => {
    if (!editingProcess || !editingModel || !configData) {
      toast.error('Please select process and model');
      return;
    }

    // Validate required prompts based on available prompts
    if (processWithModels?.accessiblePrompts) {
      const hasSystemPrompts = processWithModels.accessiblePrompts.some(
        (p) => p.promptType === 'system' || p.promptType?.includes('system')
      );
      const hasUserPrompts = processWithModels.accessiblePrompts.some(
        (p) => p.promptType === 'user' || p.promptType?.includes('user')
      );

      if (hasSystemPrompts && !editingPrompts.systemPromptHash) {
        toast.error('Please select a system prompt');
        return;
      }
      if (hasUserPrompts && !editingPrompts.userPromptHash) {
        toast.error('Please select a user prompt');
        return;
      }
    }

    // Validate required prompts based on available prompts
    if (processWithModels?.accessiblePrompts) {
      const hasSystemPrompts = processWithModels.accessiblePrompts.some(
        (p) => p.promptType === 'system' || p.promptType?.includes('system')
      );
      const hasUserPrompts = processWithModels.accessiblePrompts.some(
        (p) => p.promptType === 'user' || p.promptType?.includes('user')
      );

      if (hasSystemPrompts && !editingPrompts.systemPromptHash) {
        toast.error('Please select a system prompt');
        return;
      }
      if (hasUserPrompts && !editingPrompts.userPromptHash) {
        toast.error('Please select a user prompt');
        return;
      }
    }

    try {
      // Build processConfig with all fields at root level
      const processConfig: Record<string, unknown> = {
        orgProcessHash: editingProcess.orgProcessHash,
        model_hash: editingModel.modelHash,
      };

      // Add prompt hashes at root level
      if (editingPrompts.systemPromptHash) {
        processConfig.system_prompt_hash = editingPrompts.systemPromptHash;
      }
      if (editingPrompts.userPromptHash) {
        processConfig.user_prompt_hash = editingPrompts.userPromptHash;
      }
      if (editingPrompts.eventsListPromptHash) {
        processConfig.events_list_prompt_hash =
          editingPrompts.eventsListPromptHash;
      }

      await updateConfig({
        variables: {
          input: {
            camProcessConfigHash: configData.camProcessConfigHash,
            isEnabled: (configData.isEnabled as boolean) || true,
            processConfig: JSON.stringify(processConfig),
          },
        },
      });
      // Success handling and cleanup now done in onCompleted callback
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleCloseUpdateDialog = () => {
    setShowUpdateDialog(false);
    setSelectedProcessHash('');
    setEditingProcess(null);
    setEditingModel(null);
    setEditingPrompts({
      systemPromptHash: '',
      userPromptHash: '',
      eventsListPromptHash: '',
    });
    setShowProcessDropdown(false);
    setShowModelDropdown(false);
  };

  const handlePromptCreated = async (prompt: unknown) => {
    console.log('[handlePromptCreated] Prompt created successfully:', prompt);

    // Auto-select the newly created prompt
    if (prompt && typeof prompt === 'object' && prompt !== null) {
      const promptObj = prompt as {
        promptHash?: string;
        promptType?: string;
        promptName?: string;
      };

      if (promptObj.promptHash && promptObj.promptType) {
        // Extract category from promptType (e.g., "event_detection/_/user" -> "user")
        const parts = promptObj.promptType.split('/');
        const category = parts[parts.length - 1]; // Get last part (user, events_list, system, etc.)

        console.log('[handlePromptCreated] Auto-selecting prompt:', {
          category,
          promptHash: promptObj.promptHash,
          promptName: promptObj.promptName,
        });

        // Map category to editingPrompts field name
        const fieldMap: Record<string, keyof PromptHashes> = {
          user: 'userPromptHash',
          system: 'systemPromptHash',
          events_list: 'eventsListPromptHash',
        };

        const fieldName = fieldMap[category];
        if (fieldName) {
          setEditingPrompts((prev) => ({
            ...prev,
            [fieldName]: promptObj.promptHash,
          }));
        }
      }
    }

    // Refetch process with models to update accessible prompts
    if (selectedProcessHash && refetchProcessWithModels) {
      try {
        console.log('[handlePromptCreated] Refetching process with models...');
        await refetchProcessWithModels();
        console.log('[handlePromptCreated] Refetch completed successfully');
        toast.success('Prompt created and selected');
      } catch (error) {
        console.error('[handlePromptCreated] Refetch failed:', error);
        toast.error('Prompt created but failed to refresh list');
      }
    } else {
      toast.success('Prompt created and selected');
    }
  };

  const onSubmit = async (data: ConfigFormData) => {
    if (!configData) {
      toast.error('No configuration found');
      return;
    }

    const configHash = configData.camProcessConfigHash as string;
    if (!configHash) {
      toast.error('Configuration hash not found');
      return;
    }

    try {
      const processConfigString = JSON.stringify(data.processConfig || {});

      await updateConfig({
        variables: {
          input: {
            camProcessConfigHash: configHash,
            isEnabled: (configData.isEnabled as boolean) || false,
            processConfig: processConfigString,
          },
        },
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async () => {
    if (!configData) {
      toast.error('No configuration to delete');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this configuration?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteConfig({
        variables: {
          cam_process_config_hash: configData.camProcessConfigHash,
        },
      });
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <Header>
        <div className="flex items-center justify-between flex-1 px-4">
          <div className="flex items-center gap-4 flex-1">
            <SearchField />
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            <ConfigDrawer />
            <ProfileDropdown />
          </div>
        </div>
      </Header>

      <Main>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Section */}
          <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/cameras')}
                  className="h-9 w-9 p-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Configure Camera
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {camera?.cam_name || 'Unknown Camera'} â€¢ Process
                    Configuration
                  </p>
                </div>
                <Button
                  onClick={handleOpenUpdateDialog}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={updateLoading || deleteLoading || !configData}
                >
                  <Edit2 className="h-4 w-4" />
                  Update Process
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 overflow-y-auto">
            {configsLoading || detailedLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Loading configuration...
                  </p>
                </div>
              </div>
            ) : configsError || detailedError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-destructive mb-4">
                    Error loading configuration
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {configsError?.message || detailedError?.message}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/cameras')}
                  >
                    Go back
                  </Button>
                </div>
              </div>
            ) : !configData ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    No configuration found for this camera
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/cameras')}
                  >
                    Go back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 max-w-5xl mx-auto w-full">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Configuration Info Card */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {String(configData.orgProcessName) ||
                                'Process Configuration'}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              Configuration Details
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              configData.isEnabled ? 'default' : 'secondary'
                            }
                          >
                            {configData.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>

                    <Separator />

                    {/* Configuration Fields */}
                    <div>
                      <h2 className="text-lg font-semibold mb-4 tracking-tight">
                        Configuration Settings
                      </h2>
                      <ProcessConfigDisplay
                        processConfig={
                          (configData.processConfig as Record<
                            string,
                            unknown
                          >) || {}
                        }
                        isLoading={configsLoading}
                      />
                    </div>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        className="flex-1"
                        disabled={updateLoading || deleteLoading}
                      >
                        {updateLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Configuration'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="lg"
                        onClick={handleDelete}
                        disabled={deleteLoading || updateLoading}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/cameras')}
                        disabled={updateLoading || deleteLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </div>

          {/* Update Configuration Dialog */}
          {showUpdateDialog && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="sticky top-0 bg-background border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Edit Process Configuration
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Update process, model, and prompt settings
                      </CardDescription>
                    </div>
                    <button
                      onClick={handleCloseUpdateDialog}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </CardHeader>

                <div className="p-6 space-y-6">
                  {/* Process Selection */}
                  <div className="relative">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Process
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setShowProcessDropdown(!showProcessDropdown)
                      }
                      disabled={catalogLoading}
                      className="w-full px-4 py-2 text-left rounded-md border border-input bg-background hover:bg-accent transition-colors flex items-center justify-between disabled:opacity-50"
                    >
                      <span className="text-sm">
                        {editingProcess?.orgProcessName || 'Select a process'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${showProcessDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showProcessDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-20">
                        {catalogLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                            Loading processes...
                          </div>
                        ) : processCatalog.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No processes available
                          </div>
                        ) : (
                          <div
                            style={{ maxHeight: '256px', overflowY: 'auto' }}
                          >
                            {processCatalog.map((process) => (
                              <button
                                key={process.orgProcessHash}
                                type="button"
                                onClick={() => {
                                  setEditingProcess(process);
                                  setSelectedProcessHash(
                                    process.orgProcessHash
                                  );
                                  setShowProcessDropdown(false);
                                  setEditingModel(null);
                                }}
                                className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-l-4 ${
                                  editingProcess?.orgProcessHash ===
                                  process.orgProcessHash
                                    ? 'bg-primary/10 border-l-primary'
                                    : 'border-l-transparent'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {process.orgProcessName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {process.orgProcessType}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Model Selection */}
                  {processWithModels && (
                    <div className="relative">
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Select Model
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        disabled={processModelsLoading}
                        className="w-full px-4 py-2 text-left rounded-md border border-input bg-background hover:bg-accent transition-colors flex items-center justify-between disabled:opacity-50"
                      >
                        <span className="text-sm">
                          {editingModel?.modelName || 'Select a model'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {showModelDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-20">
                          {processModelsLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                              Loading models...
                            </div>
                          ) : processWithModels.accessibleModels.length ===
                            0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No models available for this process
                            </div>
                          ) : (
                            <div
                              style={{ maxHeight: '256px', overflowY: 'auto' }}
                            >
                              {processWithModels.accessibleModels.map(
                                (model) => (
                                  <button
                                    key={model.modelHash}
                                    type="button"
                                    onClick={() => {
                                      setEditingModel(model);
                                      setShowModelDropdown(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-l-4 ${
                                      editingModel?.modelHash ===
                                      model.modelHash
                                        ? 'bg-primary/10 border-l-primary'
                                        : 'border-l-transparent'
                                    }`}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {model.modelName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {model.modelProvider} â€¢{' '}
                                        {model.modelType}
                                      </p>
                                    </div>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prompt Selections */}
                  {processWithModels &&
                    processWithModels.accessiblePrompts &&
                    processWithModels.accessiblePrompts.length > 0 &&
                    (() => {
                      // Determine available prompt types from accessible prompts
                      const hasSystemPrompts =
                        processWithModels.accessiblePrompts.some(
                          (p) =>
                            p.promptType === 'system' ||
                            p.promptType?.includes('system')
                        );
                      const hasUserPrompts =
                        processWithModels.accessiblePrompts.some(
                          (p) =>
                            p.promptType === 'user' ||
                            p.promptType?.includes('user')
                        );
                      const hasEventsPrompts =
                        processWithModels.accessiblePrompts.some(
                          (p) =>
                            p.promptType === 'events_list' ||
                            p.promptType?.includes('events_list')
                        );

                      return (
                        <div className="space-y-4">
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold">
                                Prompts Configuration
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Select prompt templates and versions
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!editingProcess?.orgProcessName) {
                                  toast.error(
                                    'Please select a process before creating a prompt'
                                  );
                                  return;
                                }
                                setIsCreatePromptDialogOpen(true);
                              }}
                              className="h-8"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Create Prompt
                            </Button>
                          </div>

                          {/* System Prompt */}
                          {hasSystemPrompts && (
                            <PromptSelectionField
                              label="System Prompt"
                              requiredTypes={['system']}
                              accessiblePrompts={
                                processWithModels.accessiblePrompts as unknown as Record<
                                  string,
                                  unknown
                                >[]
                              }
                              value={editingPrompts.systemPromptHash || ''}
                              onChange={(val) =>
                                setEditingPrompts((prev) => ({
                                  ...prev,
                                  systemPromptHash: val,
                                }))
                              }
                            />
                          )}

                          {/* User Prompt */}
                          {hasUserPrompts && (
                            <PromptSelectionField
                              label="User Prompt"
                              requiredTypes={['user']}
                              accessiblePrompts={
                                processWithModels.accessiblePrompts as unknown as Record<
                                  string,
                                  unknown
                                >[]
                              }
                              value={editingPrompts.userPromptHash || ''}
                              onChange={(val) =>
                                setEditingPrompts((prev) => ({
                                  ...prev,
                                  userPromptHash: val,
                                }))
                              }
                            />
                          )}

                          {/* Events List Prompt */}
                          {hasEventsPrompts && (
                            <PromptSelectionField
                              label="Events List Prompt"
                              requiredTypes={['events_list']}
                              accessiblePrompts={
                                processWithModels.accessiblePrompts as unknown as Record<
                                  string,
                                  unknown
                                >[]
                              }
                              value={editingPrompts.eventsListPromptHash || ''}
                              onChange={(val) =>
                                setEditingPrompts((prev) => ({
                                  ...prev,
                                  eventsListPromptHash: val,
                                }))
                              }
                            />
                          )}
                        </div>
                      );
                    })()}

                  {/* Summary of Changes */}
                  {editingProcess && editingModel && (
                    <div className="bg-success/5 border border-success/20 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold">
                        Configuration Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Process:
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {editingProcess.orgProcessName}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Model:
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {editingModel.modelName}
                          </Badge>
                        </div>
                        {editingPrompts.systemPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              System Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.systemPromptHash.substring(0, 12)}
                              ...
                            </Badge>
                          </div>
                        )}
                        {editingPrompts.userPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              User Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.userPromptHash.substring(0, 12)}
                              ...
                            </Badge>
                          </div>
                        )}
                        {editingPrompts.eventsListPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Events List Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.eventsListPromptHash.substring(
                                0,
                                12
                              )}
                              ...
                            </Badge>
                          </div>
                        )}
                        {editingPrompts.systemPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              System Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.systemPromptHash.substring(0, 12)}
                              ...
                            </Badge>
                          </div>
                        )}
                        {editingPrompts.userPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              User Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.userPromptHash.substring(0, 12)}
                              ...
                            </Badge>
                          </div>
                        )}
                        {editingPrompts.eventsListPromptHash && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Events List Prompt:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {editingPrompts.eventsListPromptHash.substring(
                                0,
                                12
                              )}
                              ...
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleUpdateConfiguration}
                      disabled={
                        !editingProcess || !editingModel || updateLoading
                      }
                      className="flex-1"
                    >
                      {updateLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Configuration
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCloseUpdateDialog}
                      disabled={updateLoading}
                      variant="outline"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Create Prompt Dialog */}
          <CreatePromptDialog
            isOpen={isCreatePromptDialogOpen}
            onClose={() => setIsCreatePromptDialogOpen(false)}
            onPromptCreated={handlePromptCreated}
            processName={editingProcess?.orgProcessName || ''}
            showEventsListCategory={
              !editingProcess?.orgProcessName?.toLowerCase().includes('vlm') &&
              !editingProcess?.orgProcessName
                ?.toLowerCase()
                .includes('transcript')
            }
          />
        </div>
      </Main>
    </div>
  );
};

export default CameraConfigurePage;
