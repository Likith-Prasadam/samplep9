export interface FormStep {
  id: string;
  title: string;
  description: string;
}

export const FORM_STEPS: FormStep[] = [
  {
    id: 'upload-video',
    title: 'Upload video',
    description: 'Add the video file and give it a clear name',
  },
  {
    id: 'select-pipelines',
    title: 'Choose analysis steps',
    description: 'Pick how this video should be analysed',
  },
  {
    id: 'configure-pipelines',
    title: 'Setup Configuration',
    description: 'Adjust models, prompts, and advanced options',
  },
  {
    id: 'review-create',
    title: 'Review & start',
    description: 'Double‑check everything before you run the analysis',
  },
];
