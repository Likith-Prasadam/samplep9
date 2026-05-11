import React, { useState, createContext, useContext } from 'react';
import type { DemoVideo } from '@/features/demo-videos/types';

type DemoVideoDialogType = 'transcript' | 'share' | 'details' | null;

interface DemoVideosContextType {
  open: DemoVideoDialogType;
  setOpen: (type: DemoVideoDialogType) => void;
  selectedVideo: DemoVideo | null;
  setSelectedVideo: (video: DemoVideo | null) => void;
  isTranscriptOpen: boolean;
  setIsTranscriptOpen: (open: boolean) => void;
  currentVideoType: string;
  setCurrentVideoType: (type: string) => void;
  modelId: string;
  setModelId: (id: string) => void;
  isChatMinimized: boolean;
  setIsChatMinimized: (minimized: boolean) => void;
  notificationBellOpen: boolean;
  setNotificationBellOpen: (open: boolean) => void;
}

const DemoVideosContext = createContext<DemoVideosContextType | null>(null);

export function DemoVideosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<DemoVideoDialogType>(null);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [currentVideoType, setCurrentVideoType] = useState('smart_cities');
  const [modelId, setModelId] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [notificationBellOpen, setNotificationBellOpen] = useState(false);

  return (
    <DemoVideosContext.Provider
      value={{
        open,
        setOpen,
        selectedVideo,
        setSelectedVideo,
        isTranscriptOpen,
        setIsTranscriptOpen,
        currentVideoType,
        setCurrentVideoType,
        modelId,
        setModelId,
        isChatMinimized,
        setIsChatMinimized,
        notificationBellOpen,
        setNotificationBellOpen,
      }}
    >
      {children}
    </DemoVideosContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDemoVideos = () => {
  const context = useContext(DemoVideosContext);
  if (!context) {
    throw new Error('useDemoVideos must be used within <DemoVideosProvider>');
  }
  return context;
};
