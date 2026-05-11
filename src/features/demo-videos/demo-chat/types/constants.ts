export type AwsRegion =
  | 'ap-south-1'
  | 'ap-east-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ap-northeast-1'
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-1'
  | 'us-west-2';

export type ModelRegion = 'us' | 'apac';

export const AWS_REGION_TO_MODEL_REGION: Record<AwsRegion, ModelRegion> = {
  'ap-south-1': 'apac',
  'ap-east-1': 'apac',
  'ap-southeast-1': 'apac',
  'ap-southeast-2': 'apac',
  'ap-northeast-1': 'apac',
  'us-east-1': 'us',
  'us-east-2': 'us',
  'us-west-1': 'us',
  'us-west-2': 'us',
};

export const MODELS: Record<ModelRegion, string[]> = {
  us: [
    'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'us.amazon.nova-pro-v1:0',
    'us.amazon.nova-lite-v1:0',
    'us.amazon.nova-micro-v1:0',
  ],
  apac: [
    'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'apac.amazon.nova-pro-v1:0',
    'apac.amazon.nova-lite-v1:0',
    'apac.amazon.nova-micro-v1:0',
  ],
};
