import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TOOLTIP_ADD_CAMERA =
  'Add a new camera. Configure processing pipelines for live analysis.';
const TOOLTIP_LIVE_CHAT =
  'Access live chat for camera streams and real-time communication.';

interface CameraPrimaryButtonsProps {
  onAdd?: () => void;
  canManage?: boolean;
}

export function CameraPrimaryButtons({
  onAdd,
  canManage,
}: CameraPrimaryButtonsProps) {
  const navigate = useNavigate();

  const handleLiveChat = () => {
    navigate('/connected-intelligence');
  };

  const handleAdd = () => {
    if (!canManage) {
      toast.error("You don't have permission to do this operation.");
      return;
    }
    onAdd?.();
  };

  return (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleLiveChat}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Live Chat
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{TOOLTIP_LIVE_CHAT}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Camera
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{TOOLTIP_ADD_CAMERA}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
