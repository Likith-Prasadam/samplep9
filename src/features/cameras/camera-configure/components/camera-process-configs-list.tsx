import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Edit, Trash2, ChevronDown, Save, X } from 'lucide-react';
import {
  GET_CAM_PROCESS_CONFIGS,
  UPDATE_CAM_PROCESS_CONFIG,
  DELETE_CAM_PROCESS_CONFIG,
} from '@/graphql/camera-process-config-queries';
import {
  GET_PROCESS_CATALOG,
  GET_PROCESS_WITH_MODELS,
} from '@/graphql/workflow_queries';
import { toast } from 'sonner';
import type { ProcessConfig } from '../types';

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
}

interface CameraProcessConfigsListProps {
  camHash: string;
  onConfigSelect?: (config: ProcessConfig) => void;
  selectedConfigHash?: string;
}

export const CameraProcessConfigsList: React.FC<
  CameraProcessConfigsListProps
> = ({ camHash, onConfigSelect, selectedConfigHash }) => {
  const [editingConfigHash, setEditingConfigHash] = useState<string | null>(
    null
  );
  const [editingProcess, setEditingProcess] =
    useState<ProcessCatalogItem | null>(null);
  const [editingModel, setEditingModel] = useState<AccessibleModel | null>(
    null
  );
  const [showProcessDropdown, setShowProcessDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedProcessForEdit, setSelectedProcessForEdit] =
    useState<string>('');

  const { data, loading, error, refetch } = useQuery(GET_CAM_PROCESS_CONFIGS, {
    variables: { cam_hash: camHash },
    skip: !camHash,
  });

  // Fetch process catalog for editing
  const { data: catalogData, loading: catalogLoading } =
    useQuery(GET_PROCESS_CATALOG);

  // Fetch process details with models when editing
  const { data: processModelsData, loading: processModelsLoading } = useQuery(
    GET_PROCESS_WITH_MODELS,
    {
      variables: { orgProcessHash: selectedProcessForEdit },
      skip: !selectedProcessForEdit,
    }
  );

  const [updateConfig, { loading: updateLoading }] = useMutation(
    UPDATE_CAM_PROCESS_CONFIG,
    {
      onCompleted: () => {
        toast.success('Configuration updated successfully');
        setEditingConfigHash(null);
        refetch();
      },
      onError: (error) => {
        toast.error(`Error updating configuration: ${error.message}`);
      },
    }
  );

  const [deleteConfig, { loading: deleteLoading }] = useMutation(
    DELETE_CAM_PROCESS_CONFIG,
    {
      onCompleted: () => {
        toast.success('Configuration deleted successfully');
        refetch();
      },
      onError: (error) => {
        toast.error(`Error deleting configuration: ${error.message}`);
      },
    }
  );

  const configs: Array<ProcessConfig & Record<string, unknown>> =
    (data?.getCamProcessConfigs || []) as Array<
      ProcessConfig & Record<string, unknown>
    >;

  const processCatalog: ProcessCatalogItem[] =
    catalogData?.getProcessCatalog || [];
  const processWithModels: ProcessWithModelsData | undefined =
    processModelsData?.getProcessWithModels;

  const handleStartEdit = (config: ProcessConfig & Record<string, unknown>) => {
    setEditingConfigHash(config.camProcessConfigHash);
    setEditingProcess({
      orgProcessHash: config.orgProcessHash || '',
      orgProcessName: config.orgProcessName || '',
      orgProcessType: '',
    });
    setSelectedProcessForEdit(config.orgProcessHash || '');
    setEditingModel(null);
  };

  const handleSaveEdit = async () => {
    if (!editingConfigHash) return;

    try {
      await updateConfig({
        variables: {
          input: {
            camProcessConfigHash: editingConfigHash,
            isEnabled: true,
            processConfig: {
              orgProcessHash: editingProcess?.orgProcessHash || '',
              model_hash: editingModel?.modelHash || '',
            },
          },
        },
      });
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleDelete = (configHash: string) => {
    deleteConfig({
      variables: {
        cam_process_config_hash: configHash,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingConfigHash(null);
    setEditingProcess(null);
    setEditingModel(null);
    setSelectedProcessForEdit('');
    setShowProcessDropdown(false);
    setShowModelDropdown(false);
  };

  if (!camHash) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No camera selected
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading configurations: {error.message}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No process configurations found for this camera
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {configs.map((config: ProcessConfig & Record<string, unknown>) => {
        const isEditing = editingConfigHash === config.camProcessConfigHash;

        if (isEditing) {
          return (
            <Card
              key={config.camProcessConfigHash}
              className="border-primary/40 bg-primary/5"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Edit Process Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Configuration Info */}
                <div className="bg-background rounded-lg p-3 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Process
                    </p>
                    <p className="text-sm font-medium">
                      {config.orgProcessName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Status
                    </p>
                    <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                      {config.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Process Selection */}
                <div className="relative">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Select New Process
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowProcessDropdown(!showProcessDropdown)}
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
                          Loading...
                        </div>
                      ) : processCatalog.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No processes available
                        </div>
                      ) : (
                        <div style={{ maxHeight: '256px', overflowY: 'auto' }}>
                          {processCatalog.map((process) => (
                            <button
                              key={process.orgProcessHash}
                              type="button"
                              onClick={() => {
                                setEditingProcess(process);
                                setSelectedProcessForEdit(
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

                {/* Model Selection - shown when process is selected */}
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
                            Loading...
                          </div>
                        ) : processWithModels.accessibleModels.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No models available
                          </div>
                        ) : (
                          <div
                            style={{ maxHeight: '256px', overflowY: 'auto' }}
                          >
                            {processWithModels.accessibleModels.map((model) => (
                              <button
                                key={model.modelHash}
                                type="button"
                                onClick={() => {
                                  setEditingModel(model);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors border-l-4 ${
                                  editingModel?.modelHash === model.modelHash
                                    ? 'bg-primary/10 border-l-primary'
                                    : 'border-l-transparent'
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {model.modelName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {model.modelProvider} • {model.modelType}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Summary of Changes */}
                {editingProcess && editingModel && (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Changes to Apply:
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground">Process:</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {editingProcess.orgProcessName}
                        </Badge>
                      </p>
                      <p className="text-xs">
                        <span className="text-muted-foreground">Model:</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {editingModel.modelName}
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={!editingProcess || !editingModel || updateLoading}
                    className="flex-1"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={updateLoading}
                    variant="outline"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card
            key={config.camProcessConfigHash}
            className={`cursor-pointer transition-colors ${
              selectedConfigHash === config.camProcessConfigHash
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onConfigSelect?.(config)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {config.orgProcessName || 'Unnamed Process'}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono mt-1">
                    {config.camProcessConfigHash}
                  </CardDescription>
                </div>
                <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                  {config.isEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardHeader>
            {config.orgProcessHash && (
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-semibold">Process Hash:</span>{' '}
                  <span className="font-mono text-xs">
                    {config.orgProcessHash}
                  </span>
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(config);
                    }}
                    disabled={updateLoading || deleteLoading}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(config.camProcessConfigHash);
                    }}
                    disabled={updateLoading || deleteLoading}
                    size="sm"
                    variant="destructive"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
