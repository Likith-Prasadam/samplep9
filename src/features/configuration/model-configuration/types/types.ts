export type ParamKey =
  | 'temperature'
  | 'repetition_penalty'
  | 'top_p'
  | 'max_tokens';

export type ModelParams = Record<ParamKey, number>;

export interface SliderConfig {
  label: string;
  key: ParamKey;
  min: number;
  max: number;
  default: number;
}

export interface ModelOption {
  value: string;
  label: string;
}

export interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: () => void;
  params: ModelParams;
  loading: boolean;
}

export interface ParameterSliderProps {
  label: string;
  paramKey: ParamKey;
  min: number;
  max: number;
  value: number;
  setValue: (value: number) => void;
}

export interface ModelSelectorProps {
  model: string;
  setModel: (model: string) => void;
}
