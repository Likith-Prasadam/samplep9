import React from 'react';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';

interface PromptSelectorProps {
  selectedPrompt: string;
  promptKeys: string[];
  systemPrompts?: SystemPrompt[];
  onSelectPrompt: (promptKey: string) => void;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({
  selectedPrompt,
  promptKeys,
  systemPrompts = [],
  onSelectPrompt,
}) => {
  const allPrompts = [
    ...promptKeys.map((key) => ({ id: key, label: key, type: 'local' })),
    ...systemPrompts.map((prompt) => ({
      id: prompt.promptHash,
      label: prompt.promptName,
      type: 'system',
    })),
  ];

  return (
    <div className="flex items-center space-x-2">
      {allPrompts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No prompts available to select
        </p>
      ) : (
        <select
          value={selectedPrompt}
          onChange={(e) => onSelectPrompt(e.target.value)}
          className="w-70 bg-background text-foreground border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {allPrompts.map((prompt) => (
            <option key={prompt.id} value={prompt.id}>
              {prompt.label}
              {prompt.type === 'system' ? ' (System)' : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default React.memo(PromptSelector);
