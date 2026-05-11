import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { DeploymentModalProps } from '../types/types';

const DeploymentDialog: React.FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  params,
  loading,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deployment</DialogTitle>
          <DialogDescription>
            Are you sure you want to deploy the model with these parameters?
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Temperature:</div>
            <div className="text-right font-mono text-foreground">
              {params.temperature}
            </div>
            <div className="text-muted-foreground">Repetition Penalty:</div>
            <div className="text-right font-mono text-foreground">
              {params.repetition_penalty}
            </div>
            <div className="text-muted-foreground">Top P:</div>
            <div className="text-right font-mono text-foreground">
              {params.top_p}
            </div>
            <div className="text-muted-foreground">Max Tokens:</div>
            <div className="text-right font-mono text-foreground">
              {params.max_tokens}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outline"
            className="transition-colors"
          >
            Cancel
          </Button>
          <Button onClick={onDeploy} disabled={loading}>
            {loading ? 'Deploying...' : 'Deploy'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeploymentDialog;
