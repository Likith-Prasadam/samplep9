import type { SliderConfig, ModelOption, ParamKey } from './types';

export const MODEL_OPTIONS: ModelOption[] = [
  { value: 'v1.0', label: 'p9-vid-llm-model v1.0' },
  { value: 'v2.0', label: 'p9-vid-llm-model v2.0' },
  { value: 'v3.0', label: 'p9-vid-llm-model v3.0' },
];

export const SLIDERS: SliderConfig[] = [
  {
    label: 'Temperature',
    key: 'temperature',
    min: 0.01,
    max: 2.0,
    default: 0.1,
  },
  {
    label: 'Repetition Penalty',
    key: 'repetition_penalty',
    min: 0.1,
    max: 2.0,
    default: 1.0,
  },
  {
    label: 'Top P',
    key: 'top_p',
    min: 0.1,
    max: 2.0,
    default: 0.9,
  },
  {
    label: 'Max Tokens',
    key: 'max_tokens',
    min: 0,
    max: 15000,
    default: 512,
  },
];

export const PARAM_DEFINITIONS: Record<ParamKey, string> = {
  temperature:
    "Controls randomness in the model's output.\nLower values make output more deterministic,\nhigher values more random. \nDefault value : 0.1",
  top_p:
    'Top-p sampling considers only the most probable tokens whose cumulative probability adds up to top_p. \nDefault value is 0.9',
  repetition_penalty:
    'Reduces repeated sequences in the output.\nHigher values penalize repetition more strongly. \nDefault value : 1.0',
  max_tokens:
    'The maximum number of tokens the model can generate in one response. \nDefault value : 512',
};

export const PROGRESS_COLORS = {
  maxTokens: (v: number) =>
    v < 5000 ? 'bg-green-500' : v < 10000 ? 'bg-yellow-400' : 'bg-red-500',
  default: (v: number) =>
    v < 0.75 ? 'bg-green-500' : v < 1.3 ? 'bg-yellow-400' : 'bg-red-500',
};

export const getProgressColor = (v: number, k: string) =>
  k === 'max_tokens'
    ? PROGRESS_COLORS.maxTokens(v)
    : PROGRESS_COLORS.default(v);
