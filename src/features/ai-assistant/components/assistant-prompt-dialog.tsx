import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import React from 'react';

interface SystemPromptDialogContentProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSave: () => void;
  charCount: number;
}

const SystemPromptDialogContent = React.memo(
  ({
    prompt,
    onPromptChange,
    onSave,
    charCount,
  }: SystemPromptDialogContentProps) => {
    return (
      <DialogContent className="bg-black/80 backdrop-blur-md border border-white/20 text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">
            System Prompt Configuration
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 space-y-2 overflow-hidden">
            <Textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Enter your system prompt here..."
              rows={8}
              className="bg-black/40 border-white/20 text-white resize-none min-h-[150px] max-h-[calc(70vh-200px)] whitespace-pre-wrap break-words overflow-y-auto p-3 font-mono text-sm leading-relaxed w-full"
            />
            <p className="text-xs text-gray-400 text-right flex-shrink-0">
              {charCount} characters
            </p>
          </div>
          <Button onClick={onSave} className="w-full flex-shrink-0">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    );
  }
);

SystemPromptDialogContent.displayName = 'SystemPromptDialogContent';

export default SystemPromptDialogContent;
