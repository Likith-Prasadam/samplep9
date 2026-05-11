/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLazyQuery } from '@apollo/client';
import { ChevronDown, Loader2, Settings2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GET_PROCESS_WITH_MODELS } from '@/graphql/workflow_queries';
import ProcessConfigurationForm from './process-configuration-form';

// Helper function to format display names
const toDisplayName = (raw: string | null | undefined) => {
  if (!raw) return '';
  const overrides: Record<string, string> = {
    event_detection: 'Event detection',
    video_preprocessing: 'Video Processing',
    vlm_inference: 'Transcript Generation',
  };
  if (overrides[raw]) return overrides[raw];

  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

interface ProcessConfigItemProps {
  processHash: string;
  processName: string;
  processDescription?: string;
  currentConfig?: Record<string, any>;
  currentMeta?: Record<string, any>;
  onConfigChange: (
    hash: string,
    config: Record<string, any>,
    meta: any
  ) => void;
  extractDefaultParams: (params: any) => any;
  extractDefaultsFromSchema: (schema: any) => any;
}

const ProcessConfigItem: React.FC<ProcessConfigItemProps> = ({
  processHash,
  processName,
  processDescription,
  currentConfig,
  onConfigChange,
  extractDefaultParams,
  extractDefaultsFromSchema,
}) => {
  const [getModels, { data, loading }] = useLazyQuery(GET_PROCESS_WITH_MODELS);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>(
    currentConfig?.model_hash || ''
  );
  const hasInitializedRef = useRef(false);

  const getInitialConfigValues = () => {
    if (!currentConfig) return {};
    const { model_hash, parameters, ...rest } = currentConfig;
    return rest;
  };

  const [configValues, setConfigValues] = useState<Record<string, any>>(
    getInitialConfigValues()
  );
  const [promptMeta, setPromptMeta] = useState<Record<string, string>>({});

  // Fetch models only once when component mounts or processHash changes
  useEffect(() => {
    if (!hasInitializedRef.current || processHash) {
      getModels({ variables: { orgProcessHash: processHash } });
      hasInitializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processHash]); // Only depend on processHash, not getModels

  const models = useMemo(
    () => data?.getProcessWithModels?.accessibleModels || [],
    [data]
  );
  const prompts = useMemo(
    () => data?.getProcessWithModels?.accessiblePrompts || [],
    [data]
  );
  const schema = data?.getProcessWithModels?.processParamSchema;
  const onConfigChangeRef = useRef(onConfigChange);

  // Update ref when onConfigChange changes, but don't trigger effects
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    if (schema && Object.keys(configValues).length === 0) {
      const defaults = extractDefaultsFromSchema(schema);
      if (Object.keys(defaults).length > 0) {
        setConfigValues(defaults);
      }
    }
  }, [schema, extractDefaultsFromSchema]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const config: Record<string, any> = {};
    const meta: Record<string, any> = {};

    if (selectedModel) {
      config.model_hash = selectedModel;
      const m = models.find((m: any) => m.modelHash === selectedModel);
      if (m) {
        meta.modelName = m.modelName;
        config.parameters = extractDefaultParams(m.modelDefaultParams);
      }
    }

    Object.entries(configValues).forEach(([key, val]) => {
      config[key] = val;
    });

    const promptNames = Object.values(promptMeta).filter(Boolean).join(', ');
    if (promptNames) meta.promptName = promptNames;

    // Use the ref instead of the function prop to avoid infinite loops
    onConfigChangeRef.current(processHash, config, meta);
  }, [selectedModel, configValues, promptMeta, processHash, models]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Loading configuration...
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-full bg-primary/10 text-primary">
            <Settings2 className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm text-foreground">
            {toDisplayName(processName)}
          </span>
          {processDescription && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{processDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-8 w-8 rounded-full hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 border-t bg-background/50 space-y-6 animate-in slide-in-from-top-2 duration-200">
          <ProcessConfigurationForm
            schema={schema}
            models={models}
            prompts={prompts}
            config={{ ...configValues, model_hash: selectedModel }}
            onChange={(newConfig, newMeta) => {
              if (newConfig.model_hash !== selectedModel) {
                setSelectedModel(newConfig.model_hash);
              }
              const { model_hash, parameters, ...rest } = newConfig;
              setConfigValues(rest);
              if (newMeta) {
                setPromptMeta((prev) => ({ ...prev, ...newMeta }));
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProcessConfigItem;
