import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, FileText } from 'lucide-react';
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

interface ChatInputProps {
  userQuery: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  isLoading: boolean;
  isStreaming?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenTranscript?: () => void;
  models?: Array<{ modelHash: string; modelName: string }>;
  selectedModel?: string;
  onModelChange?: (value: string) => void;
  modelsLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  userQuery,
  onInputChange,
  onSend,
  isLoading,
  isStreaming = false,
  onKeyDown,
  onOpenTranscript,
  models = [],
  selectedModel,
  onModelChange,
  modelsLoading = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isStreaming) {
      e.preventDefault();
      onSend();
    }
  };

  const isBusy = isLoading || isStreaming;
  const isModelDisabled = modelsLoading || models.length === 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full">
        <div className="flex flex-col gap-1.5 border border-border rounded-2xl px-3 py-2 bg-card/80 shadow-sm focus-within:ring-2 focus-within:ring-ring/20">
          {/* Top: text input */}
          <Textarea
            placeholder={
              isStreaming ? 'Assistant is typing...' : 'Ask about this video...'
            }
            value={userQuery}
            onChange={onInputChange}
            onKeyDown={
              (onKeyDown as
                | React.KeyboardEventHandler<HTMLTextAreaElement>
                | undefined) || handleKeyDown
            }
            disabled={isBusy || !selectedModel}
            rows={1}
            className="border-0 pl-2 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed resize-none min-h-[32px] max-h-32"
          />

          {/* Bottom: controls row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              {/* Model select */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select
                    value={selectedModel}
                    onValueChange={onModelChange}
                    disabled={isModelDisabled || isBusy || !onModelChange}
                  >
                    <SelectTrigger className="h-7 min-w-[160px] text-[11px] border-border bg-background/80 px-2">
                      <SelectValue
                        placeholder={
                          modelsLoading ? 'Loading models...' : 'Select model'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
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
              {/* Transcript */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onOpenTranscript}
                    disabled={isBusy || !onOpenTranscript}
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                    aria-label="Open transcript"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">View full transcript</p>
                </TooltipContent>
              </Tooltip>

              {/* Send */}
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
