export interface LiveConfigurationProps {
  camera?: Camera | null;
  batch?: { batch_hash: string; batch_name?: string } | null;
  onModelHashChange?: (modelHash: string) => void;
  configType?: 'camera' | 'batch';
}

export interface ConfigData {
  configHash: string; // Can be camProcessConfigHash or batch config id
  configType: 'camera' | 'batch';
  processConfig: Record<string, unknown>;
  configStatus?: string;
}

export interface ModelData {
  modelHash?: string;
  modelName: string;
  modelType: string;
  modelIdentifier: string;
  modelProvider: string;
  modelDefaultParams?: Record<string, unknown>;
  baseUrl: string;
  accessLevel?: string;
  apiKeyRef?: string;
}

export interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  orgProcessDescription?: string;
}

export interface AccessibleModel {
  modelHash: string;
  modelName: string;
  modelType: string;
  modelProvider: string;
  modelIdentifier?: string;
  modelDefaultParams?: Record<string, unknown>;
}

export interface PromptData {
  promptContent: string;
  promptDescription?: string;
  promptHash: string;
  promptName: string;
  promptType?: string;
  refPromptKey?: string;
}

export interface ProcessWithModelsData {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: string;
  orgProcessDescription?: string;
  processParamSchema?: Record<string, unknown>;
  accessibleModels: AccessibleModel[];
  accessiblePrompts: Array<{
    promptHash: string;
    promptName: string;
    promptDescription?: string;
    promptType?: string;
  }>;
}

export interface ConfigFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processConfig?: Record<string, any>;
  selectedProcessHash?: string;
  selectedModelHash?: string;
  temperature?: number;
  maxTokens?: number;
}

import type { Camera } from '@/features/cameras/camera-list/types/cameras';
