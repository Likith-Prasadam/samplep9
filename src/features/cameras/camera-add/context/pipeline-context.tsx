import { createContext, useContext } from 'react';

export interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  orgProcessDescription?: string;
}

export interface PipelineContextValue {
  processCatalog: ProcessCatalogItem[];
  setProcessCatalog: React.Dispatch<React.SetStateAction<ProcessCatalogItem[]>>;
  selectedProcesses: Set<string>;
  setSelectedProcesses: React.Dispatch<React.SetStateAction<Set<string>>>;
  processConfigs: Record<string, Record<string, unknown>>;
  setProcessConfigs: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, unknown>>>
  >;
  processConfigMeta: Record<string, unknown>;
  setProcessConfigMeta: React.Dispatch<
    React.SetStateAction<Record<string, unknown>>
  >;
  expandedPipelines: Set<string>;
  setExpandedPipelines: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleProcessSelection: (hash: string) => void;
  updateProcessConfig: (
    hash: string,
    config: Record<string, unknown>,
    meta: Record<string, unknown>
  ) => void;
  togglePipelineExpand: (hash: string) => void;
}

export const PipelineContext = createContext<PipelineContextValue | undefined>(
  undefined
);

export const usePipelineContext = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error(
      'usePipelineContext must be used within a PipelineProvider'
    );
  }
  return context;
};
