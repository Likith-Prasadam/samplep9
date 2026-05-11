import React, { useState, createContext } from 'react';
import type { CameraFormData } from '@/features/cameras/camera-add/types/types';

export type CameraDialogType = 'add' | 'edit' | 'delete' | null;

interface CameraContextType {
  open: CameraDialogType;
  setOpen: (str: CameraDialogType) => void;
  currentCamera: CameraFormData | null;
  setCurrentCamera: React.Dispatch<React.SetStateAction<CameraFormData | null>>;
}

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<CameraDialogType>(null);
  const [currentCamera, setCurrentCamera] = useState<CameraFormData | null>(
    null
  );

  return (
    <CameraContext.Provider
      value={{ open, setOpen, currentCamera, setCurrentCamera }}
    >
      {children}
    </CameraContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCameras = () => {
  const context = React.useContext(CameraContext);
  if (!context) {
    throw new Error('useCameras must be used within <CameraProvider>');
  }
  return context;
};
