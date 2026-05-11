import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { PipelineContext } from './pipeline-context';
import type { ProcessCatalogItem } from './pipeline-context';

export const PipelineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [processCatalog, setProcessCatalog] = useState<ProcessCatalogItem[]>(
    []
  );
  const [selectedProcesses, setSelectedProcesses] = useState<Set<string>>(
    new Set()
  );
  const [processConfigs, setProcessConfigs] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [processConfigMeta, setProcessConfigMeta] = useState<
    Record<string, unknown>
  >({});
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(
    new Set()
  );

  const toggleProcessSelection = useCallback((hash: string) => {
    setSelectedProcesses((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
        // Automatically expand the newly selected pipeline
        setExpandedPipelines((prevExpanded) => {
          const nextExpanded = new Set(prevExpanded);
          nextExpanded.add(hash);
          return nextExpanded;
        });
      }
      return next;
    });
  }, []);

  const updateProcessConfig = useCallback(
    (
      hash: string,
      config: Record<string, unknown>,
      meta: Record<string, unknown>
    ) => {
      setProcessConfigs((prev) => ({ ...prev, [hash]: config }));
      setProcessConfigMeta((prev) => ({ ...prev, [hash]: meta }));
    },
    []
  );

  const togglePipelineExpand = useCallback((hash: string) => {
    setExpandedPipelines((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  }, []);

  return (
    <PipelineContext.Provider
      value={{
        processCatalog,
        setProcessCatalog,
        selectedProcesses,
        setSelectedProcesses,
        processConfigs,
        setProcessConfigs,
        processConfigMeta,
        setProcessConfigMeta,
        expandedPipelines,
        setExpandedPipelines,
        toggleProcessSelection,
        updateProcessConfig,
        togglePipelineExpand,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};
