import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onMenuClick?: () => void;
}

export function ChatHeader({ title, subtitle, onBack }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={onBack}
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {/* <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full"
        onClick={onMenuClick}
        aria-label="Conversation menu"
      >
        <MoreVertical className="h-4 w-4" />
      </Button> */}
    </div>
  );
}
