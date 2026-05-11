import { useState } from 'react';
import { Clock3, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ChatItemData {
  id: string;
  title: string;
  preview?: string;
  updatedAt?: string;
}

interface ChatItemProps {
  item: ChatItemData;
  isActive?: boolean;
  isDeleting?: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ChatItem({
  item,
  isActive = false,
  isDeleting = false,
  onClick,
  onDelete,
}: ChatItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updatedLabel = item.updatedAt
    ? formatTimeInTimezone(
        new Date(item.updatedAt),
        getUserTimezone(),
        'datetime'
      )
    : 'Recently updated';

  return (
    <div
      className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
        isDeleting
          ? 'bg-muted/70 opacity-70'
          : isActive
            ? 'bg-muted/70'
            : 'bg-transparent hover:bg-muted/40'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => {
            if (!isDeleting) {
              onClick(item.id);
            }
          }}
          disabled={isDeleting}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-semibold text-foreground">
            {item.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            <span>{updatedLabel}</span>
          </div>
        </button>

        {onDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground"
                onClick={(event) => event.stopPropagation()}
                disabled={isDeleting}
                aria-label="Conversation actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected thread.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(item.id)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
