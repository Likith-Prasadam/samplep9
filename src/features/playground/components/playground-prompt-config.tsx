/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { Info } from 'lucide-react';

interface PromptConfigSectionProps {
  form: any;
  promptMap: Record<string, string>;
  systemPromptText: string;
  isLoadingPrompt: boolean;
  setParameters:
    | React.Dispatch<React.SetStateAction<any>>
    | ((fn: (prev: any) => any) => void);
  fetchAndLoadPrompt: (path: string) => Promise<void>;
}

const PromptConfigSection: React.FC<PromptConfigSectionProps> = ({
  form,
  promptMap,
  systemPromptText,
  isLoadingPrompt,
  setParameters,
  fetchAndLoadPrompt,
}) => {
  const labelize = (k: string) =>
    k === 'System_Prompt'
      ? 'Default'
      : k.replace(/[_-]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  // Simplified sanitization - focus on unescaping and basic cleanup
  const sanitizeForMarkdown = (input: string): string => {
    if (!input) return '';

    return input
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '')
      .trim();
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="promptType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Select Prompt Type
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 inline ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Defines how input prompts are structured and interpreted by
                    the AI.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <Select
              onValueChange={async (value) => {
                field.onChange(value);
                const path = promptMap[value];
                setParameters((prev: any) => ({
                  ...prev,
                  system_prompt_blob_uri: path,
                }));
                await fetchAndLoadPrompt(path);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a prompt type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent
                position="popper"
                sideOffset={5}
                align="start"
                className="max-h-[300px] overflow-y-auto"
              >
                {Object.keys(promptMap).map((key) => (
                  <SelectItem key={key} value={key}>
                    {labelize(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="min-h-[400px] max-h-[600px] overflow-y-auto border border-border rounded-md p-4 bg-muted/50 text-foreground">
        {isLoadingPrompt ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Loading prompt...</span>
            </div>
          </div>
        ) : systemPromptText ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground prose-pre:text-foreground prose-a:text-foreground prose-blockquote:text-foreground prose-hr:border-border prose-pre:bg-muted prose-code:bg-muted [&_p]:text-foreground [&_li]:text-foreground [&_strong]:text-foreground [&_em]:text-foreground [&_code]:text-foreground [&_pre]:text-foreground [&_a]:text-foreground [&_blockquote]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground">
            <ReactMarkdown>
              {sanitizeForMarkdown(systemPromptText)}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a prompt type to view its content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptConfigSection;
