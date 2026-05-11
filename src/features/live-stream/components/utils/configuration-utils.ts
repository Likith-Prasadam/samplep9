import { DEFAULT_MODEL_PARAMS } from './configuration-schema';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const extractDefaultParams = (modelParams: any) => {
  if (!modelParams) return DEFAULT_MODEL_PARAMS;

  // Check if it's a schema with properties (JSON Schema format)
  if (modelParams.properties && typeof modelParams.properties === 'object') {
    const defaults: Record<string, any> = {};
    Object.entries(modelParams.properties).forEach(
      ([key, value]: [string, any]) => {
        if (value && typeof value === 'object' && value.default !== undefined) {
          defaults[key] = value.default;
        }
      }
    );
    return Object.keys(defaults).length > 0 ? defaults : DEFAULT_MODEL_PARAMS;
  }

  // Assume it's a direct key-value pair object
  return modelParams;
};

export const extractDefaultsFromSchema = (schema: any) => {
  if (!schema?.properties) return {};
  const defaults: Record<string, any> = {};

  Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    }

    if (prop.$ref && schema.$defs) {
      const defName = prop.$ref.split('/').pop();
      const def = schema.$defs[defName];
      if (def?.properties) {
        const nestedDefaults: Record<string, any> = {};
        Object.entries(def.properties).forEach(
          ([subKey, subProp]: [string, any]) => {
            if (subProp.default !== undefined) {
              nestedDefaults[subKey] = subProp.default;
            }
          }
        );
        if (Object.keys(nestedDefaults).length > 0) {
          defaults[key] = nestedDefaults;
        }
      }
    }
  });
  return defaults;
};

export const parseProcessConfig = (config: any): Record<string, unknown> => {
  if (!config) return {};

  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }

  return config;
};

export const extractPromptHashFromConfig = (
  parsedConfig: Record<string, any>
): string => {
  const promptHashKeys = Object.keys(parsedConfig).filter(
    (key) => key.endsWith('_prompt_hash') || key.endsWith('_hash')
  );

  if (promptHashKeys.length === 0) return '';

  // Get the first available prompt hash (prioritize: user_prompt_hash, system_prompt_hash, events_list_prompt_hash)
  const priorityOrder = [
    'user_prompt_hash',
    'system_prompt_hash',
    'events_list_prompt_hash',
  ];

  for (const priority of priorityOrder) {
    if (parsedConfig[priority]) {
      return parsedConfig[priority] as string;
    }
  }

  // If no priority match, use the first available
  if (promptHashKeys.length > 0) {
    return parsedConfig[promptHashKeys[0]] as string;
  }

  return '';
};
