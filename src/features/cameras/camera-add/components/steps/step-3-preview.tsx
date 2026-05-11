import React, { useEffect } from 'react';
import { useApolloClient } from '@apollo/client';

// UI Components
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// Icons
import { Settings2 } from 'lucide-react';

// GraphQL Queries & Mutations
import { GET_PROCESS_WITH_MODELS } from '@/graphql/workflow_queries';
import { GET_PROMPT_VERSIONS } from '@/graphql/prompt_mutations';

// Utils
import {
  toDisplayName,
  extractDefaultParams,
  formatConfigValue,
  formatReviewFieldLabel,
  extractDefaultsFromSchema,
} from '../../../../../components/pipeline-configuration/utils';

export interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  orgProcessDescription?: string;
}

export interface PromptItem {
  promptHash: string;
  promptName: string;
  promptType: string;
  parentPromptHash?: string | null;
  [key: string]: unknown;
}

export interface ModelItem {
  modelHash: string;
  modelName: string;
  modelDefaultParams?: Record<string, unknown>;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const ReviewPipelineItem = ({
  processName,
  config,
  meta,
}: {
  processName: string;
  config: Record<string, unknown>;
  meta: Record<string, unknown>;
}) => {
  const modelName = meta['modelName'];
  const promptName = meta['promptName'];
  const promptConfigs = Object.entries(config).filter(
    ([key]) => key.includes('prompt') && key.endsWith('_hash')
  );
  const otherConfig = Object.entries(config).filter(
    ([key]) =>
      key !== 'model_hash' &&
      key !== 'parameters' &&
      !key.endsWith('_hash') &&
      !key.includes('prompt')
  );

  return (
    <Accordion
      type="single"
      collapsible
      className="border rounded-xl bg-card shadow-sm overflow-hidden"
    >
      <AccordionItem value={processName} className="border-0">
        <AccordionTrigger className="flex items-center justify-between p-4 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-primary/10 text-primary">
              <Settings2 className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-foreground">
              {toDisplayName(processName)}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 border-t bg-background/50 space-y-4">
          {!!modelName && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Model
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">
                  Selected model
                </span>
                <span className="font-semibold text-foreground">
                  {String(modelName)}
                </span>
              </div>
            </div>
          )}

          {promptConfigs.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prompts
              </span>
              <div className="space-y-1">
                {promptConfigs.map(([key, val]) => {
                  const label = formatReviewFieldLabel(key);
                  const promptNameKey = key + '_name';
                  const displayValue = meta[promptNameKey]
                    ? String(meta[promptNameKey])
                    : formatConfigValue(key, val);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="font-medium text-foreground text-right">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!!promptName && promptConfigs.length === 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Prompts
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs text-muted-foreground">
                  Selected prompt
                </span>
                <span className="font-medium text-foreground text-right">
                  {String(promptName)}
                </span>
              </div>
            </div>
          )}

          {!!config.parameters &&
            typeof config.parameters === 'object' &&
            Object.keys(config.parameters as Record<string, unknown>).length >
              0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Parameters
                </span>
                <div className="space-y-1">
                  {Object.entries(
                    config.parameters as Record<string, unknown>
                  ).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-foreground text-right">
                        {formatConfigValue(key, val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {otherConfig.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Configuration
              </span>
              <div className="space-y-1">
                {otherConfig.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-xs text-muted-foreground">
                      {formatReviewFieldLabel(key)}
                    </span>
                    <span className="font-medium text-foreground text-right">
                      {formatConfigValue(key, val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

import { useFormContext } from 'react-hook-form';
import { usePipelineContext } from '../../context/pipeline-context';
import type { CameraFormValues } from '../../schema';

export const Step3Preview: React.FC<{
  setIsAutoPopulating: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setIsAutoPopulating }) => {
  const apolloClient = useApolloClient();
  const { watch } = useFormContext<CameraFormValues>();
  const formData = watch();

  const {
    processCatalog,
    selectedProcesses,
    processConfigs,
    processConfigMeta,
    setProcessConfigs,
    setProcessConfigMeta,
  } = usePipelineContext();

  useEffect(() => {
    (async () => {
      setIsAutoPopulating(true);
      try {
        for (const processHash of selectedProcesses) {
          const isConfigEmpty =
            !processConfigs[processHash] ||
            Object.keys(processConfigs[processHash]).length === 0;

          if (isConfigEmpty) {
            const process = processCatalog.find(
              (p) => p.orgProcessHash === processHash
            );
            if (!process) continue;

            try {
              const { data } = await apolloClient.query({
                query: GET_PROCESS_WITH_MODELS,
                variables: { orgProcessHash: processHash },
                fetchPolicy: 'cache-first',
              });
              const schema = data?.getProcessWithModels?.processParamSchema;
              const models = data?.getProcessWithModels?.accessibleModels || [];
              const prompts =
                data?.getProcessWithModels?.accessiblePrompts || [];

              console.log(`Fetched data for ${processHash}:`, {
                schema: !!schema,
                models: models.length,
                prompts: prompts.length,
              });

              let config: Record<string, unknown> = {};
              if (schema && typeof schema === 'object' && schema.properties) {
                if (typeof extractDefaultsFromSchema === 'function') {
                  config = extractDefaultsFromSchema(schema);
                }
              }

              if (models.length > 0 && !config.model_hash) {
                config.model_hash = models[0].modelHash;
              }

              const meta: Record<string, unknown> = {};
              if (config.model_hash) {
                const m = models.find(
                  (m: ModelItem) => m.modelHash === config.model_hash
                );
                if (m) {
                  meta.modelName = m.modelName;
                  if (m.modelDefaultParams) {
                    config.parameters = extractDefaultParams(
                      m.modelDefaultParams as Record<string, unknown>
                    );
                  }
                }
              }

              if (schema && typeof schema === 'object' && schema.properties) {
                const schemaProps = schema.properties as Record<
                  string,
                  unknown
                >;
                const usedPromptHashes = new Set<string>();

                const requiredPromptFields: Array<{
                  key: string;
                  promptKey: string;
                  rawPromptType: string;
                  requiredTypes: string[];
                }> = [];

                console.log(
                  `📋 Available prompts:`,
                  prompts.map((p: PromptItem) => ({
                    promptHash: p.promptHash,
                    promptName: p.promptName,
                    promptType: p.promptType,
                    parentPromptHash: p.parentPromptHash,
                    ...Object.keys(p).reduce(
                      (acc, k) => {
                        if (
                          k.includes('version') ||
                          k.includes('number') ||
                          k.includes('v')
                        ) {
                          acc[k] = (p as Record<string, unknown>)[k];
                        }
                        return acc;
                      },
                      {} as Record<string, unknown>
                    ),
                  }))
                );

                Object.entries(schemaProps).forEach(([key, prop]) => {
                  if (
                    key.startsWith('required_') &&
                    key.endsWith('_prompt_types')
                  ) {
                    const promptKey = key
                      .replace('required_', '')
                      .replace('_types', '_hash');
                    const rawPromptType = key
                      .replace('required_', '')
                      .replace('_prompt_types', '');
                    const propObj = prop as Record<string, unknown>;
                    const requiredTypes = (propObj.default as string[]) || [];

                    console.log(
                      `🔎 Found prompt field: ${promptKey}, requiredTypes:`,
                      requiredTypes
                    );

                    requiredPromptFields.push({
                      key,
                      promptKey,
                      rawPromptType,
                      requiredTypes,
                    });
                  }
                });

                requiredPromptFields.forEach(({ promptKey, requiredTypes }) => {
                  if (!config[promptKey] && prompts.length > 0) {
                    let selectedPrompt = null;

                    if (requiredTypes.length > 0) {
                      selectedPrompt = prompts.find((p: PromptItem) => {
                        if (usedPromptHashes.has(p.promptHash)) return false;

                        const promptType = (p.promptType as string) || '';
                        return requiredTypes.some(
                          (rt) => promptType === rt || promptType.startsWith(rt)
                        );
                      });
                    }

                    if (!selectedPrompt) {
                      selectedPrompt = prompts.find(
                        (p: PromptItem) => !usedPromptHashes.has(p.promptHash)
                      );
                    }

                    if (!selectedPrompt) {
                      selectedPrompt = prompts[0];
                    }

                    if (selectedPrompt) {
                      config[promptKey] = selectedPrompt.promptHash;
                      usedPromptHashes.add(selectedPrompt.promptHash);
                      meta[promptKey + '_fetching'] = true;
                    }
                  }
                });

                const versionFetches = requiredPromptFields
                  .filter(({ promptKey }) => {
                    const hasConfig = !!config[promptKey];
                    const isFetching = meta[promptKey + '_fetching'];
                    console.log(
                      `🔍 Checking ${promptKey}: hasConfig=${hasConfig}, isFetching=${isFetching}`
                    );
                    return config[promptKey] && meta[promptKey + '_fetching'];
                  })
                  .map(async ({ promptKey }) => {
                    const promptHash = config[promptKey] as string;
                    const selectedPrompt = prompts.find(
                      (p: PromptItem) => p.promptHash === promptHash
                    );

                    try {
                      console.log(`🔍 Fetching versions for ${promptKey}:`, {
                        promptHash,
                        promptName: (selectedPrompt as PromptItem | undefined)
                          ?.promptName,
                      });

                      const { data: versionsData } = await apolloClient.query({
                        query: GET_PROMPT_VERSIONS,
                        variables: {
                          parentPromptHash: promptHash,
                          page: 1,
                          itemsPerPage: 1000,
                        },
                        fetchPolicy: 'network-only',
                      });

                      const versions =
                        (versionsData?.getPromptVersions as
                          | Array<Record<string, unknown>>
                          | undefined) || [];
                      console.log(
                        `📊 Versions fetched for ${promptKey}:`,
                        versions.length,
                        'versions',
                        versions.map((v: Record<string, unknown>) => ({
                          hash: (v.promptHash as string | undefined)?.substring(
                            0,
                            8
                          ),
                          name: v.promptName,
                        }))
                      );

                      if (versions.length > 0) {
                        const reversedVersions = [...versions].reverse();
                        const latest = reversedVersions[0];
                        const versionNumber = reversedVersions.length;

                        config[promptKey] = latest.promptHash;
                        meta[promptKey + '_name'] =
                          `v${versionNumber} (Latest)`;
                        console.log(
                          `🎯 Auto-selected latest v${versionNumber}: ${(latest.promptHash as string).substring(0, 8)} for ${promptKey}`
                        );
                      } else {
                        meta[promptKey + '_name'] = 'v1';
                        console.log(
                          `⚠️ No versions found for ${promptKey}, using v1`
                        );
                      }
                      delete meta[promptKey + '_fetching'];
                    } catch (
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      _e
                    ) {
                      meta[promptKey + '_name'] = 'v1';
                      delete meta[promptKey + '_fetching'];
                    }
                  });

                if (versionFetches.length > 0) {
                  await Promise.all(versionFetches);
                }
              }

              console.log(`Final config for ${processHash}:`, {
                configKeys: Object.keys(config),
                metaKeys: Object.keys(meta),
              });

              setProcessConfigs((prev) => ({ ...prev, [processHash]: config }));
              setProcessConfigMeta((prev) => ({
                ...prev,
                [processHash]: meta,
              }));
            } catch (e) {
              console.error(
                `Failed to load config for process ${processHash}:`,
                e
              );
            }
          }
        }
      } finally {
        setIsAutoPopulating(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProcesses, processCatalog]);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Camera Details Preview */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Camera details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Camera name</p>
              <p className="font-medium text-foreground">
                {formData.cam_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Camera type</p>
              <p className="font-medium text-foreground">
                {formData.cam_type || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolution</p>
              <p className="font-medium text-foreground">
                {formData.cam_resolution || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IP address</p>
              <p className="font-medium text-foreground">
                {formData.cam_ip || '-'}
              </p>
            </div>
          </div>
        </section>

        {/* Multiple Process Configurations Preview */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Processing pipelines ({selectedProcesses.size})
          </h3>
          {selectedProcesses.size > 0 ? (
            <div className="space-y-4">
              {(() => {
                const pipelineOrder = (name: string): number => {
                  const n = String(name || '').toLowerCase();
                  if (n === 'event_detection') return 0;
                  if (n === 'vlm_inference') return 1;
                  if (n === 'video_preprocessing') return 2;
                  return 3;
                };
                const sorted = Array.from(selectedProcesses).sort(
                  (hashA, hashB) => {
                    const procA = processCatalog.find(
                      (p) => p.orgProcessHash === hashA
                    );
                    const procB = processCatalog.find(
                      (p) => p.orgProcessHash === hashB
                    );
                    return (
                      pipelineOrder(procA?.orgProcessName ?? '') -
                      pipelineOrder(procB?.orgProcessName ?? '')
                    );
                  }
                );
                return sorted.map((processHash) => {
                  const config = processConfigs[processHash] || {};
                  const meta = (processConfigMeta[processHash] || {}) as Record<
                    string,
                    unknown
                  >;
                  const process = processCatalog.find(
                    (p) => p.orgProcessHash === processHash
                  );
                  return (
                    <ReviewPipelineItem
                      key={processHash}
                      processName={process?.orgProcessName || processHash}
                      config={config}
                      meta={meta}
                    />
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No pipelines configured
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
