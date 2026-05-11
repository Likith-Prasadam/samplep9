/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  GET_CAM_PROCESS_CONFIGS,
  GET_PROCESS_CATALOG,
} from '@/graphql/workflow_queries';
import { CREATE_CAM_PROCESS_CONFIG } from '@/graphql/workflow_mutations';
import CameraProcessConfigItem from './camera-process-config-item';
import AddCameraProcessDialog from './add-camera-process-dialog';

interface CameraConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camHash: string;
  camName?: string;
}

export const CameraConfigDrawer: React.FC<CameraConfigDrawerProps> = ({
  open,
  onOpenChange,
  camHash,
  camName,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);

  const {
    data: configsData,
    loading: configsLoading,
    error: configsError,
    refetch: refetchConfigs,
  } = useQuery(GET_CAM_PROCESS_CONFIGS, {
    variables: { cam_hash: camHash },
    fetchPolicy: 'network-only',
    skip: !open, // Only fetch when drawer is open
  });

  const { data: catalogData, loading: catalogLoading } = useQuery(
    GET_PROCESS_CATALOG,
    {
      skip: !open,
    }
  );

  const [createConfig] = useMutation(CREATE_CAM_PROCESS_CONFIG);

  const handleAddProcess = useCallback(
    async (processHash: string, configInput: any) => {
      try {
        await createConfig({
          variables: {
            input: {
              cam_hash: camHash,
              process_hash: processHash,
              model_hash: configInput.model_hash,
              prompt_hashes: configInput.prompt_hashes,
              parameters: configInput.parameters || {},
              is_enabled: true,
            },
          },
        });
        toast.success('Process configuration added');
        refetchConfigs();
        setIsAddDialogOpen(false);
      } catch (error) {
        console.error('Error adding process config:', error);
        toast.error('Failed to add process configuration');
      }
    },
    [camHash, createConfig, refetchConfigs]
  );

  const configs = configsData?.configurations?.get_cam_process_configs || [];
  const catalog = catalogData?.getProcessCatalog || [];

  // Filter out already configured processes
  const availableProcesses = catalog.filter(
    (p: any) => !configs.some((c: any) => c.process_hash === p.orgProcessHash)
  );

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Process Configurations</DrawerTitle>
            <DrawerDescription>
              Manage processing pipelines for {camName || 'this camera'}
            </DrawerDescription>
          </DrawerHeader>

          <Tabs defaultValue="configured" className="flex-1">
            <TabsList className="w-full grid w-full grid-cols-2">
              <TabsTrigger value="configured">
                Configured ({configs.length})
              </TabsTrigger>
              <TabsTrigger value="add">Add Pipeline</TabsTrigger>
            </TabsList>

            {/* Configured Processes Tab */}
            <TabsContent value="configured" className="p-6 space-y-4">
              {configsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : configsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load configurations: {configsError.message}
                  </AlertDescription>
                </Alert>
              ) : configs.length > 0 ? (
                <div className="space-y-3">
                  {configs.map((config: any) => (
                    <CameraProcessConfigItem
                      key={config.config_id}
                      configSummary={config}
                      isExpanded={expandedConfig === config.config_id}
                      onToggle={() =>
                        setExpandedConfig(
                          expandedConfig === config.config_id
                            ? null
                            : config.config_id
                        )
                      }
                      onUpdate={() => {
                        refetchConfigs();
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No pipelines configured. Add one to get started.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Add Pipeline Tab */}
            <TabsContent value="add" className="p-6">
              {catalogLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : availableProcesses.length > 0 ? (
                <div className="space-y-4">
                  {availableProcesses.map((process: any) => (
                    <AddCameraProcessDialog
                      key={process.orgProcessHash}
                      process={process}
                      onAdd={(configInput) =>
                        handleAddProcess(process.orgProcessHash, configInput)
                      }
                      trigger={
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">
                              {process.orgProcessName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {process.orgProcessDescription ||
                                process.orgProcessType}
                            </div>
                          </div>
                        </Button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    All available pipelines are already configured.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>

      {/* Add Process Dialog */}
      <AddCameraProcessDialog
        process={null}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProcess}
        trigger={null}
      />
    </>
  );
};

export default CameraConfigDrawer;
