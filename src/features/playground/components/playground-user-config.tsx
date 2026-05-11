/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface UserConfigSectionProps {
  form: any;
}

const UserConfigSection: React.FC<UserConfigSectionProps> = ({ form }) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div className="flex items-center">
        <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          User Prompt
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 ml-1 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="bg-popover text-popover-foreground text-sm p-2 rounded shadow-lg w-64 max-w-xs border border-border">
                User-specific preferences that affect how the model responds to
                your queries. Enter a custom prompt here to guide the AI&apos;s
                response style or context.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </FormLabel>
      </div>
      <FormField
        control={form.control}
        name="user_prompt"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                placeholder="Enter your custom user prompt here (e.g., &#39;Respond in a professional tone focusing on safety compliance...&#39;)"
                className="min-h-[120px] bg-background border border-border text-foreground placeholder:text-muted-foreground resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-destructive text-sm mt-1 block min-h-[1.5rem]">
              {form.formState.errors.user_prompt?.message}
            </FormMessage>
          </FormItem>
        )}
      />
    </div>
  </div>
);

export default UserConfigSection;
