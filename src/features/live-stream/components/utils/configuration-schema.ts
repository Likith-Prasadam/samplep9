import * as z from 'zod';

export const configSchema = z.object({
  processConfig: z.record(z.string(), z.any()).optional(),
  selectedProcessHash: z.string().optional(),
  selectedModelHash: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(15000).optional(),
});

export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 1000;
export const MAX_MAX_TOKENS = 15000;
export const DEFAULT_MODEL_PARAMS = { temperature: 0.1, max_tokens: 1000 };

export const FIELD_SORT_SCORES = {
  MODEL: 0,
  PARAMETERS: 1,
  PROMPTS: 2,
};
