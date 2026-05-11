import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface ChatHeaderProps {
  onTranscriptOpen: () => void;
}

export function ChatHeader({ onTranscriptOpen }: ChatHeaderProps) {
  return (
    <div className="flex justify-between items-center px-6 pb-6 pt-6">
      <h2 className="text-2xl font-bold tracking-tight">
        Chat with <span className="text-primary">Spectra</span>
      </h2>
      <Button
        variant="outline"
        className="flex items-center gap-2 rounded-full px-4 py-1 transition-colors duration-200"
        onClick={onTranscriptOpen}
      >
        <Menu className="w-4 h-4" />
        Transcript
      </Button>
    </div>
  );
}
