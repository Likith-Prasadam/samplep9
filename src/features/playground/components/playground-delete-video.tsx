/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import { DELETE_BATCH } from '@/graphql/batch_mutations';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import type { BatchVideo } from '../types/batch-analysis';

interface DeleteVideoProps {
  video: BatchVideo;
  onDeleteSuccess: (videoId: number) => void;
  setIsDeleting: React.Dispatch<React.SetStateAction<number | null>>;
}

const DeleteVideo: React.FC<DeleteVideoProps> = ({
  video,
  onDeleteSuccess,
  setIsDeleting,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDialogDeleting, setIsDialogDeleting] = useState(false);
  const [deleteBatch] = useMutation(DELETE_BATCH);

  const handleDelete = async () => {
    setIsDialogDeleting(true);
    setIsDeleting(video.id);
    try {
      const { errors } = await deleteBatch({
        variables: {
          batchHash: video.batchHash,
        },
      });
      if (errors) {
        throw new Error(errors.map((err: any) => err.message).join(', '));
      }
      onDeleteSuccess(video.id);
      setIsDialogOpen(false);
    } catch {
      toast.error('Failed to delete video', {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
        duration: 3000,
      });
    } finally {
      setIsDialogDeleting(false);
      setIsDeleting(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 hover:bg-gray-800/70 hover:text-teal-400 backdrop-blur-md rounded-full transition-all duration-200"
            disabled={isDialogDeleting}
          >
            <MoreVertical className="w-5 h-5 text-gray-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-gray-800/70 text-gray-200 backdrop-blur-md border-gray-700/50">
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="bg-gray-800/70 backdrop-blur-md hover:bg-teal-600/30 hover:text-teal-400 focus:bg-teal-800/70 focus:text-teal-400"
            disabled={isDialogDeleting}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800/70 border-gray-700/50 rounded-lg shadow-xl backdrop-blur-md w-full max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-teal-400">
                {video.batchName}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDialogDeleting}
              className="bg-gray-800/70 text-gray-200 border-gray-700/50 hover:bg-teal-600/30 hover:text-teal-400 hover:border-teal-500/50 transition-all duration-200 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDialogDeleting}
              className="bg-red-600/70 text-white hover:bg-red-700/70 hover:text-white border-red-700/50 transition-all duration-200 hover:scale-105"
            >
              {isDialogDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteVideo;
