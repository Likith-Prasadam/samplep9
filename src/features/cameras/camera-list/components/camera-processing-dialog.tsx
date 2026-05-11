import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_CAMS_PROCESSING_INFO_QUERY } from '@/graphql/cameras_queries';
import type {
  GetCamsProcessingInfoResponse,
  GetCamsProcessingInfoVariables,
} from '@/graphql/cameras_queries';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, AlertCircle, Settings, Code } from 'lucide-react';

interface CameraProcessingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  camHash?: string;
}

export const CameraProcessingDialog: React.FC<CameraProcessingDialogProps> = ({
  open,
  onOpenChange,
  camHash,
}) => {
  const { data, loading, error } = useQuery<
    GetCamsProcessingInfoResponse,
    GetCamsProcessingInfoVariables
  >(GET_CAMS_PROCESSING_INFO_QUERY, {
    variables: { camHash: camHash || '' },
    skip: !camHash || !open,
  });

  const processingInfo = data?.getCamsProcessingInfo;
  const camera = processingInfo?.camera;
  const processConfigs = processingInfo?.processConfigs;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterDisplayParameters = (params?: Record<string, any>) => {
    if (!params) return [];

    return Object.entries(params).filter(
      ([key]) =>
        !key.toLowerCase().includes('selecteduserprompt') &&
        !key.toLowerCase().includes('selectedsystemprompt')
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Header */}
            {camera && (
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Processing Configuration
                </h2>
                <p className="text-sm text-muted-foreground">
                  Camera:{' '}
                  <span className="font-semibold">{camera.camName}</span>
                </p>
              </div>
            )}

            {/* Content */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Loading configuration...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-6">
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-destructive">Error</h3>
                    <p className="text-sm text-destructive/80 mt-1">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {processingInfo && camera && (
              <div className="space-y-4">
                {!processConfigs ? (
                  <div className="bg-muted/30 rounded-xl border border-border/50 p-8 text-center">
                    <Settings className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No process configurations available
                    </p>
                  </div>
                ) : (
                  <div className="-space-y-7">
                    {Object.entries(processConfigs).map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ([processName, config]: any) => {
                        const isResolved = !!config.resolved;

                        return (
                          <div key={processName} className=" overflow-hidden">
                            {/* Header */}
                            {isResolved &&
                              config.resolved?.provider &&
                              config.resolved?.model && (
                                <div className="p-4 flex items-center gap-3 border-b border-gray-950/10 dark:border-gray-100/10 bg-slate-300/20 dark:bg-slate-800/60">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <Code className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <h4 className="text-sm font-semibold capitalize">
                                      {processName.replace(/_/g, ' ')}
                                    </h4>
                                    {isResolved && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {config.resolved.provider} •{' '}
                                        {config.resolved.model}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Content */}
                            <div className="px-4 py-4 space-y-4 bg-muted/5">
                              {isResolved && (
                                <div>
                                  {/* Model Configuration */}
                                  {(config.resolved.provider ||
                                    config.resolved.model ||
                                    config.resolved.base_url) && (
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                                          Model Configuration
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {config.resolved.provider && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              Provider
                                            </p>
                                            <p className="text-xs">
                                              {config.resolved.provider}
                                            </p>
                                          </div>
                                        )}

                                        {config.resolved.model && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              Model
                                            </p>
                                            <p className="text-xs">
                                              {config.resolved.model}
                                            </p>
                                          </div>
                                        )}

                                        {config.resolved.base_url && (
                                          <div className="sm:col-span-2 bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              Base URL
                                            </p>
                                            <p className="text-xs font-mono break-all text-primary">
                                              {config.resolved.base_url}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Parameters Section */}
                                  {(() => {
                                    const filteredParams = config.resolved
                                      .parameters
                                      ? filterDisplayParameters(
                                          config.resolved.parameters
                                        )
                                      : [];
                                    if (filteredParams.length === 0)
                                      return null;
                                    return (
                                      <div className="mt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                                            Parameters
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                          {filteredParams.map(
                                            ([key, value]) => (
                                              <div key={key}>
                                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                                  {key.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs font-medium text-foreground">
                                                  {String(value)}
                                                </p>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Prompts Section */}
                                  {(config.resolved.system_prompt ||
                                    config.resolved.user_prompt) && (
                                    <div className="mt-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                                          Prompts
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {config.resolved.system_prompt && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              System Prompt
                                            </p>
                                            <p className="text-xs text-foreground line-clamp-2 bg-muted/20 p-2 rounded border border-gray-950/10 dark:border-gray-100/20">
                                              {config.resolved.system_prompt}
                                            </p>
                                          </div>
                                        )}

                                        {config.resolved.user_prompt && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              User Prompt
                                            </p>
                                            <p
                                              className="text-xs text-foreground bg-muted/20 p-2 rounded border border-gray-950/10 dark:border-gray-100/20"
                                              style={{
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                              }}
                                            >
                                              {config.resolved.user_prompt}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {!isResolved && (
                                <div>
                                  {(config.model_id ||
                                    config.system_prompt_id ||
                                    config.user_prompt_id) && (
                                    <>
                                      <div className="flex items-center gap-2 mb-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                                          Reference IDs
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {config.model_id && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              Model ID
                                            </p>
                                            <p className="text-xs font-mono text-foreground">
                                              {config.model_id}
                                            </p>
                                          </div>
                                        )}

                                        {config.system_prompt_id && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              System Prompt ID
                                            </p>
                                            <p className="text-xs font-mono text-foreground">
                                              {config.system_prompt_id}
                                            </p>
                                          </div>
                                        )}

                                        {config.user_prompt_id && (
                                          <div className="bg-background rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                            <p className="text-xs text-muted-foreground font-medium mb-2">
                                              User Prompt ID
                                            </p>
                                            <p className="text-xs font-mono text-foreground">
                                              {config.user_prompt_id}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}

                                  {config.parameters &&
                                    Object.keys(config.parameters).length >
                                      0 && (
                                      <div className="mt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                                            Parameters
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 rounded-lg p-3 border border-gray-950/10 dark:border-gray-100/20">
                                          {Object.entries(
                                            config.parameters
                                          ).map(([key, value]) => (
                                            <div key={key}>
                                              <p className="text-xs text-muted-foreground font-medium mb-1">
                                                {key.replace(/_/g, ' ')}
                                              </p>
                                              <p className="text-xs font-medium text-foreground">
                                                {String(value)}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
