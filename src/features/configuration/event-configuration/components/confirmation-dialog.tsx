import React from 'react';
import { AlertTriangle, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ConfirmationDialogProps } from '../types/types';

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-destructive" />;
      case 'update':
        return <Edit className="w-6 h-6 text-primary" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh] flex-1">
          <DialogDescription className="text-base break-words">
            {message}
          </DialogDescription>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <Button onClick={onCancel} disabled={loading} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={type === 'delete' ? 'destructive' : 'default'}
          >
            {loading
              ? 'Processing...'
              : type === 'delete'
                ? 'Delete'
                : 'Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ConfirmationDialog);
