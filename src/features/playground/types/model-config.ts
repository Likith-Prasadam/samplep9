import { z } from 'zod';

export const formSchema = z.object({
  temperature: z.number().min(0.0).max(1.0),
  topP: z.number().min(0.8).max(1.0),
  repetitionPenalty: z.number().min(1.0).max(1.5),
  maxTokens: z.number().min(500).max(25000),
  model: z.string().min(1, 'Please select a model'),
  user_prompt: z.string().min(1, 'User prompt is required'),
  promptType: z.string().min(1, 'Please select a prompt type'),
});

export type FormValues = z.infer<typeof formSchema>;
