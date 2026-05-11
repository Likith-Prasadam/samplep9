// src/components/camera/SaveCancelButtons.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface SaveCancelButtonsProps {
  onCancel: () => void;
  onSave: (e: React.FormEvent) => void;
  isLoading: boolean;
  primaryLabel?: string;
  loadingLabel?: string;
}

const SaveCancelButtons: React.FC<SaveCancelButtonsProps> = ({
  onCancel,
  onSave,
  isLoading,
  primaryLabel = 'Updating Camera',
  loadingLabel = 'Creating...',
}) => {
  return (
    <div className="flex justify-end gap-3 pt-6 pb-8">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button type="submit" onClick={onSave} disabled={isLoading}>
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin mr-2" />
            {loadingLabel}
          </>
        ) : (
          primaryLabel
        )}
      </Button>
    </div>
  );
};

export default SaveCancelButtons;
