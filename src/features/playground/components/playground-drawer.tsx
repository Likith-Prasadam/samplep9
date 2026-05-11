/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { BatchVideo } from '../types/batch-analysis';
import type { ModelParameters } from './playground-params-form';
import ModelParametersForm from './playground-params-form';

interface BatchConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parameters: ModelParameters;
  setParameters: React.Dispatch<React.SetStateAction<ModelParameters>>;
  video: BatchVideo;
  processBatch: (video: BatchVideo) => Promise<void>;
}

export interface ModelParametersFormProps {
  isOpen: boolean;
  parameters: ModelParameters;
  setParameters?: React.Dispatch<React.SetStateAction<ModelParameters>>;
  onClose: () => void;
  video: BatchVideo;
  processBatch: (video: BatchVideo) => Promise<void>;
  notifications?: any[];
  viewedNotifications?: Set<string>;
  onDeleteSuccess?: (id: number) => void;
  username?: string; // ← Optional
}

const BatchConfigDrawer: React.FC<BatchConfigDrawerProps> = ({
  isOpen,
  onClose,
  parameters,
  setParameters,
  video,
  processBatch,
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="w-full sm:w-[60vw] md:w-[50vw] lg:w-[40vw] xl:w-[35vw] 2xl:w-[30vw] max-w-full h-fit max-h-[100vh] min-h-[40vh] sm:min-h-[50vh] ml-auto bg-background/95 border-l border-border rounded-l-xl backdrop-blur-md transition-all duration-300 ease-in-out">
        <DrawerHeader className="p-6 border-b border-border relative">
          <div>
            <DrawerTitle className="text-xl font-semibold text-foreground">
              Analyze Video: {video.batchName}
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="p-6 space-y-6 overflow-y-auto scrollbar-hidden">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-xl border border-border shadow-inner">
                <ModelParametersForm
                  isOpen={isOpen}
                  parameters={parameters}
                  setParameters={setParameters}
                  onClose={onClose}
                  video={video}
                  processBatch={processBatch}
                  notifications={[]}
                  viewedNotifications={new Set<string>()}
                  onDeleteSuccess={() => {}}
                  username=""
                />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BatchConfigDrawer;
