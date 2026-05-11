import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePromptConfiguration } from '@/providers/prompt-configuration-provider';

export const PromptPrimaryButtons = () => {
  const { setOpen } = usePromptConfiguration();

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setOpen('create')}
        className="flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        New Prompt
      </Button>
    </div>
  );
};
