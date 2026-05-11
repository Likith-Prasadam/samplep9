/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { ChevronDown, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  GET_PROCESS_WITH_MODELS,
  GET_CAM_PROCESS_CONFIG,
} from '@/graphql/workflow_queries';
import {
  UPDATE_CAM_PROCESS_CONFIG,
  TOGGLE_CAM_PROCESS_CONFIG,
  DELETE_CAM_PROCESS_CONFIG,
} from '@/graphql/workflow_mutations';

interface CameraProcessConfigItemProps {
  configSummary: {
    config_id: string;
    cam_hash: string;
    process_hash: string;
    process_details?: { process_name: string; process_type: string };
    is_enabled: boolean;
  };
  onUpdate: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const CameraProcessConfigItem: React.FC<
  CameraProcessConfigItemProps
> = ({ configSummary, onUpdate, isExpanded, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<any>({});

  const [getDetails, { data: detailsData, loading: detailsLoading }] =
    useLazyQuery(GET_CAM_PROCESS_CONFIG);
  const [getOptions, { data: optionsData, loading: optionsLoading }] =
    useLazyQuery(GET_PROCESS_WITH_MODELS);

  const [updateConfig, { loading: updating }] = useMutation(
    UPDATE_CAM_PROCESS_CONFIG
  );
  const [toggleConfig, { loading: toggling }] = useMutation(
    TOGGLE_CAM_PROCESS_CONFIG
  );
  const [deleteConfig, { loading: deleting }] = useMutation(
    DELETE_CAM_PROCESS_CONFIG
  );

  useEffect(() => {
    if (isExpanded) {
      // Fetch detailed config
      getDetails({
        variables: {
          config_id: configSummary.config_id,
        },
      });
      // Fetch available models and prompts
      getOptions({
        variables: { orgProcessHash: configSummary.process_hash },
      });
    }
  }, [isExpanded, configSummary, getDetails, getOptions]);

  // Load detailed config into local state
  useEffect(() => {
    if (detailsData?.configurations?.get_cam_process_config) {
      const config = detailsData.configurations.get_cam_process_config;
      setLocalConfig({
        model_hash: config.model_hash,
        prompt_hashes: config.prompt_hashes,
        parameters: config.parameters || {},
      });
    }
  }, [detailsData]);

  const handleToggle = async (checked: boolean) => {
    try {
      await toggleConfig({
        variables: {
          config_id: configSummary.config_id,
          enabled: checked,
        },
      });
      onUpdate();
      toast.success(`Pipeline ${checked ? 'enabled' : 'disabled'}`);
    } catch (e) {
      console.error('Toggle error:', e);
      toast.error('Failed to toggle pipeline');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig({
        variables: {
          config_id: configSummary.config_id,
        },
      });
      onUpdate();
      toast.success('Pipeline removed');
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to remove pipeline');
    }
  };

  const handleSave = async () => {
    try {
      await updateConfig({
        variables: {
          config_id: configSummary.config_id,
          input: {
            cam_hash: configSummary.cam_hash,
            process_hash: configSummary.process_hash,
            model_hash: localConfig.model_hash,
            prompt_hashes: localConfig.prompt_hashes,
            parameters: localConfig.parameters,
            is_enabled: configSummary.is_enabled,
          },
        },
      });
      setIsEditing(false);
      onUpdate();
      toast.success('Configuration updated');
    } catch (e) {
      console.error('Update error:', e);
      toast.error('Failed to update configuration');
    }
  };

  const models = optionsData?.getProcessWithModels?.accessibleModels || [];
  const processName =
    configSummary.process_details?.process_name || 'Unknown Process';

  return (
    <div className="border rounded-xl bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-1.5 rounded-full ${
              configSummary.is_enabled
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Settings2 className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm text-foreground">
            {processName}
          </span>
        </div>
        <div
          className="flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            checked={configSummary.is_enabled}
            onCheckedChange={handleToggle}
            disabled={toggling}
            className="data-[state=checked]:bg-primary"
          />
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8 rounded-full hover:bg-background"
            onClick={onToggle}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t bg-background/50 space-y-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configuration
            </h5>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remove Pipeline
            </Button>
          </div>

          {detailsLoading || optionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {models.find(
                    (m: any) => m.model_hash === localConfig.model_hash
                  )?.model_name || 'Not selected'}
                </div>
              </div>

              {/* Parameters Display */}
              {localConfig.parameters &&
                Object.keys(localConfig.parameters).length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parameters</label>
                    <div className="space-y-2">
                      {Object.entries(localConfig.parameters).map(
                        ([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className="flex justify-between p-2 bg-muted/30 rounded-lg text-sm"
                          >
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Actions */}
              {isEditing ? (
                <div className="flex gap-2 pt-4 border-t">
                  <Button size="sm" onClick={handleSave} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Edit Configuration
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraProcessConfigItem;
