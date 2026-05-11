import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

type ChatModelOption = {
  modelHash: string;
  modelName: string;
};

interface ChatInputShellProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isStreaming?: boolean;
  placeholder: string;
  disabled?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  models?: ChatModelOption[];
  selectedModel?: string;
  onModelChange?: (value: string) => void;
  modelsLoading?: boolean;
  modelPlaceholder?: string;
  showModelSelector?: boolean;
  className?: string;
}

export function ChatInputShell({
  value,
  onChange,
  onSend,
  isLoading,
  isStreaming = false,
  placeholder,
  disabled = false,
  onKeyDown,
  leftSlot,
  rightSlot,
  models = [],
  selectedModel,
  onModelChange,
  modelsLoading = false,
  modelPlaceholder = 'Select model',
  showModelSelector = true,
  className = '',
}: ChatInputShellProps) {
  const isBusy = isLoading || isStreaming || disabled;
  const canSend = Boolean(selectedModel) && !isBusy;
  const hasModelOptions = models.length > 0;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isBusy) {
      event.preventDefault();
      onSend();
      return;
    }

    onKeyDown?.(event);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`w-full ${className}`.trim()}>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card/80 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/20">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            readOnly={disabled}
            rows={1}
            className="max-h-32 min-h-[32px] resize-none border-0 bg-transparent pl-2 text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {leftSlot}

              {showModelSelector ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select
                      value={selectedModel || undefined}
                      onValueChange={onModelChange}
                      disabled={!hasModelOptions || isBusy || !onModelChange}
                    >
                      <SelectTrigger className="h-7 min-w-[160px] border-border bg-background/80 px-2 text-[11px]">
                        <SelectValue
                          placeholder={
                            modelsLoading
                              ? 'Loading models...'
                              : hasModelOptions
                                ? modelPlaceholder
                                : 'No models available'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="spectra-scrollbar-wide max-h-72">
                        {models.map((model) => (
                          <SelectItem
                            key={model.modelHash}
                            value={model.modelHash}
                            className="text-xs"
                          >
                            {model.modelName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Choose which model to chat with</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              {modelsLoading ? (
                <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-2 py-1">
                  <div className="h-2.5 w-20 animate-pulse rounded-full bg-muted" />
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              {rightSlot}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    onClick={onSend}
                    disabled={isBusy || !value.trim() || !canSend}
                    aria-label="Send message"
                    className="h-8 w-8 shrink-0"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Send message</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export type { ChatModelOption };
