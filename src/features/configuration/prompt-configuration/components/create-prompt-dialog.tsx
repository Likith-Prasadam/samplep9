import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch } from '@/store/hooks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createPromptAPI,
  setSelectedPromptType,
} from '@/store/slices/prompt-configuration-slice';
import { usePromptConfiguration } from '@/providers/prompt-configuration-provider';

// Enhanced schema for new API with optional legacy fields
const promptFormSchema = z.object({
  // Legacy fields (kept for backward compatibility)
  promptKey: z
    .string()
    .min(1, 'Prompt name is required')
    .max(50, 'Prompt name cannot exceed 50 characters'),
  promptContent: z
    .string()
    .min(1, 'Prompt content is required')
    .max(10000, 'Prompt content cannot exceed 10000 characters'),

  // New API fields
  promptDescription: z
    .string()
    .min(1, 'Prompt description is required')
    .max(10000, 'Prompt description cannot exceed 10000 characters'),
  promptType: z
    .string()
    .min(1, 'Prompt type is required')
    .regex(
      /^[a-zA-Z0-9_]+\s*\/\s*[a-zA-Z0-9_-]\s*\/\s*[a-zA-Z0-9_]+$/,
      'Format must be: org_process / model_role / prompt_category (e.g., event_detection / _ / system)'
    ),
  accessLevel: z.enum(['system', 'cohort', 'user']),

  // Toggle for using new API
  useNewAPI: z.boolean(),
});

type FormValues = z.infer<typeof promptFormSchema>;

const CreatePromptDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, setOpen, triggerRefetch } = usePromptConfiguration();

  const isOpen = open === 'create';

  const promptForm = useForm<FormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      promptKey: '',
      promptContent: '',
      promptDescription: '',
      promptType: '',
      accessLevel: 'system',
      useNewAPI: true,
    },
  });

  const handleClose = () => {
    promptForm.reset();
    setOpen(null);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      await dispatch(
        createPromptAPI({
          promptName: values.promptKey,
          promptDescription: values.promptDescription,
          promptType: values.promptType,
          promptContent: values.promptContent,
          accessLevel: values.accessLevel as 'system' | 'cohort' | 'user',
          parentPromptHash: null,
        })
      ).unwrap();

      toast.success('Prompt created successfully!', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
      });

      // Set the prompt type from the form
      dispatch(setSelectedPromptType(values.promptType));

      promptForm.reset();
      setOpen(null);
      triggerRefetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create prompt',
        {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
        </DialogHeader>
        <Form {...promptForm}>
          <form
            onSubmit={promptForm.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Prompt Name/Key */}
            <FormField
              control={promptForm.control}
              name="promptKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Detection-v1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prompt Description */}
            <FormField
              control={promptForm.control}
              name="promptDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      maxLength={10000}
                      className="w-full min-h-[100px] bg-background text-foreground border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring overflow-y-auto scrollbar-hide"
                      placeholder="Brief description of the prompt's purpose"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value.length}/10000 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prompt Type */}
            <FormField
              control={promptForm.control}
              name="promptType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Type</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        {...field}
                        placeholder="e.g., event_detection / _ / system"
                        className="w-full"
                      />
                      {/* <p className="text-xs text-muted-foreground mt-1">
                        Format: org_process / model_role / prompt_category
                      </p> */}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Level */}
            <FormField
              control={promptForm.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="cohort">Cohort</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prompt Content */}
            <FormField
              control={promptForm.control}
              name="promptContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt Content</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      maxLength={10000}
                      className="w-full min-h-[100px] bg-background text-foreground border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring break-words overflow-wrap-anywhere overflow-y-auto"
                      placeholder="Enter prompt content (max 10000 characters)"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value.length}/10000 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Create Prompt</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePromptDialog;
