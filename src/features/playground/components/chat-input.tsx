import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Clock3, Send, Trash2, Settings2, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatInputProps {
  userQuery: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isLoading: boolean;
  isStreaming?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onResetChat?: () => void;
  onOpenConfig?: () => void;
  onOpenTranscript?: () => void;
  canConfigure?: boolean;
  hasConversation?: boolean;
  models?: Array<{ modelHash: string; modelName: string }>;
  selectedModel?: string;
  onModelChange?: (value: string) => void;
  modelsLoading?: boolean;
  durationOptions?: Array<{ label: string; value: string }>;
  selectedDuration?: string;
  isCustomDuration?: boolean;
  customDuration?: string;
  onDurationChange?: (value: string) => void;
  onCustomDurationChange?: (value: string) => void;
  onApplyCustomDuration?: () => void;
  durationControlPlacement?: 'left' | 'right';
  showTranscriptAction?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  userQuery,
  onInputChange,
  onSend,
  isLoading,
  isStreaming = false,
  onKeyDown,
  onResetChat,
  onOpenConfig,
  onOpenTranscript,
  canConfigure = true,
  hasConversation = false,
  models = [],
  selectedModel,
  onModelChange,
  modelsLoading = false,
  durationOptions = [],
  selectedDuration,
  isCustomDuration = false,
  customDuration = '',
  onDurationChange,
  onCustomDurationChange,
  onApplyCustomDuration,
  durationControlPlacement = 'left',
  showTranscriptAction = true,
}) => {
  const [isDurationPopoverOpen, setIsDurationPopoverOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isStreaming) {
      e.preventDefault();
      onSend();
    }
  };

  const isBusy = isLoading || isStreaming;
  const hasDurationControl =
    durationOptions.length > 0 &&
    Boolean(onDurationChange) &&
    Boolean(selectedDuration);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card/80 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/20">
          <Textarea
            placeholder={
              isStreaming ? 'Assistant is typing...' : 'Ask about this video...'
            }
            value={userQuery}
            onChange={onInputChange}
            onKeyDown={onKeyDown || handleKeyDown}
            disabled={isBusy || !selectedModel}
            rows={1}
            className="max-h-32 min-h-[32px] resize-none border-0 bg-transparent pl-2 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {hasDurationControl && durationControlPlacement === 'left' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Popover
                      open={isDurationPopoverOpen}
                      onOpenChange={setIsDurationPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Select chat duration"
                          disabled={isBusy}
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-64 space-y-2 p-3"
                        align="start"
                      >
                        <p className="mb-1 text-xs font-medium text-foreground">
                          Last duration to chat
                        </p>
                        <div className="flex flex-col gap-1">
                          {durationOptions.map((option) => {
                            const isActive =
                              selectedDuration === option.value &&
                              !isCustomDuration;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  onDurationChange?.(option.value);
                                  setIsDurationPopoverOpen(false);
                                }}
                                className={`w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'border-primary/60 bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t pt-2">
                          <p className="mb-2 text-xs font-medium text-foreground">
                            Enter Duration
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="Enter hours"
                              value={customDuration}
                              onChange={(e) =>
                                onCustomDurationChange?.(e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                onApplyCustomDuration?.();
                                setIsDurationPopoverOpen(false);
                              }}
                              className="h-8 px-3 text-xs"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      Choose how many past hours of chat context to use
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={selectedModel}
                    onValueChange={onModelChange}
                    disabled={isLoading || isBusy || !onModelChange}
                  >
                    <SelectTrigger className="h-7 min-w-[160px] border-border bg-background/80 px-2 text-[11px]">
                      <SelectValue
                        placeholder={
                          modelsLoading ? 'Loading models...' : 'Select model'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="spectra-scrollbar-wide max-h-72">
                      {models.map((m) => (
                        <SelectItem
                          key={m.modelHash}
                          value={m.modelHash}
                          className="text-xs"
                        >
                          {m.modelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Choose which model to chat with</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1.5">
              {hasDurationControl && durationControlPlacement === 'right' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Popover
                      open={isDurationPopoverOpen}
                      onOpenChange={setIsDurationPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Select chat duration"
                          disabled={isBusy}
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-64 space-y-2 p-3"
                        align="end"
                      >
                        <p className="mb-1 text-xs font-medium text-foreground">
                          Last duration to chat
                        </p>
                        <div className="flex flex-col gap-1">
                          {durationOptions.map((option) => {
                            const isActive =
                              selectedDuration === option.value &&
                              !isCustomDuration;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  onDurationChange?.(option.value);
                                  setIsDurationPopoverOpen(false);
                                }}
                                className={`w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${
                                  isActive
                                    ? 'border-primary/60 bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="border-t pt-2">
                          <p className="mb-2 text-xs font-medium text-foreground">
                            Enter Duration
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="Enter hours"
                              value={customDuration}
                              onChange={(e) =>
                                onCustomDurationChange?.(e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                onApplyCustomDuration?.();
                                setIsDurationPopoverOpen(false);
                              }}
                              className="h-8 px-3 text-xs"
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      Choose how many past hours of chat context to use
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              {showTranscriptAction && onOpenTranscript ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onOpenTranscript}
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Open transcript"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">View full transcript</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onOpenConfig}
                    disabled={isBusy || !canConfigure || !onOpenConfig}
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Configure analysis"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    Configure processing pipelines for this video
                  </p>
                </TooltipContent>
              </Tooltip>

              {onResetChat ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onResetChat}
                      disabled={isBusy || !hasConversation}
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Clear chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      Clear chat history and Start a new chat for this video
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : null}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    onClick={onSend}
                    disabled={isBusy || !userQuery.trim() || !selectedModel}
                    aria-label="Send message"
                    className="h-8 w-8 shrink-0"
                  >
                    <Send className="h-4 w-4" />
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
};

export default ChatInput;
