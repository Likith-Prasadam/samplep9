import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { ApolloError } from '@apollo/client';
import { Settings2 } from 'lucide-react';
import { usePipelineContext } from '../../context/pipeline-context';
import { ProcessConfigItem } from '../../../../../components/pipeline-configuration/process-config-item';
import { toDisplayName } from '../../../../../components/pipeline-configuration/utils';

interface Step2PipelinesProps {
  isProcessCatalogLoading: boolean;
  processCatalogError?: ApolloError;
}

export const Step2Pipelines: React.FC<Step2PipelinesProps> = ({
  isProcessCatalogLoading,
  processCatalogError,
}) => {
  const {
    processCatalog,
    expandedPipelines,
    togglePipelineExpand,
    processConfigs,
    updateProcessConfig,
  } = usePipelineContext();

  const sortedProcessCatalog = useMemo(() => {
    const score = (rawName: string) => {
      const name = String(rawName || '').toLowerCase();
      if (name === 'event_detection') return 0;
      if (name === 'vlm_inference') return 1;
      if (name === 'video_preprocessing') return 2;
      return 3;
    };

    return [...processCatalog].sort((a, b) => {
      const aName = String(a.orgProcessName || '').toLowerCase();
      const bName = String(b.orgProcessName || '').toLowerCase();
      const byScore = score(aName) - score(bName);
      if (byScore !== 0) return byScore;
      return toDisplayName(a.orgProcessName).localeCompare(
        toDisplayName(b.orgProcessName)
      );
    });
  }, [processCatalog]);

  return (
    <div className="space-y-4">
      {isProcessCatalogLoading && (
        <div className="py-12 text-center">
          <p className="text-sm italic text-muted-foreground">
            Loading pipelines...
          </p>
        </div>
      )}

      {!isProcessCatalogLoading && processCatalogError && (
        <div className="py-12 text-center">
          <p className="text-sm text-red-600">
            Failed to load pipelines. Please try again.
          </p>
        </div>
      )}

      {!isProcessCatalogLoading &&
        !processCatalogError &&
        processCatalog.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm italic text-muted-foreground">
              No pipelines are currently available.
            </p>
          </div>
        )}

      {!isProcessCatalogLoading &&
        !processCatalogError &&
        processCatalog.length > 0 && (
          <div className="space-y-3">
            {sortedProcessCatalog.map((process) => {
              const isExpanded = expandedPipelines.has(process.orgProcessHash);

              return (
                <Accordion
                  key={process.orgProcessHash}
                  type="single"
                  collapsible
                  value={isExpanded ? process.orgProcessHash : ''}
                  onValueChange={() => {
                    togglePipelineExpand(process.orgProcessHash);
                  }}
                  className="transition-all rounded-xl border border-border overflow-hidden bg-card shadow-sm"
                >
                  <AccordionItem
                    value={process.orgProcessHash}
                    className="border-0"
                  >
                    <AccordionTrigger className="flex items-center justify-between p-4 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                          <Settings2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-sm text-foreground">
                            {toDisplayName(process.orgProcessName)}
                          </span>
                          {process.orgProcessDescription && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {process.orgProcessDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="border-t border-border bg-muted/20 px-4 pb-4 pt-4">
                      <ProcessConfigItem
                        processHash={process.orgProcessHash}
                        currentConfig={processConfigs[process.orgProcessHash]}
                        onConfigChange={updateProcessConfig}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </div>
        )}
    </div>
  );
};
