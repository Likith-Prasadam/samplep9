import React from 'react';
import type { SnackbarState } from '@/features/cameras/camera-list/types/cameras';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SnackbarProps extends SnackbarState {
  onClose: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  isOpen,
  variant = 'success',
  onClose,
}) => {
  if (!isOpen) return null;

  const baseClasses =
    'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg border max-w-sm';
  const variantClasses =
    variant === 'success'
      ? 'bg-green-500 border-green-400 text-white'
      : 'bg-red-500 border-red-400 text-white';

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <span>{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-4 w-4 p-0 ml-auto text-white hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export { Snackbar };
