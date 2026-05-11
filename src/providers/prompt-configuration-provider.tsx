import React, { useState, createContext, useContext } from 'react';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';

type PromptDialogType = 'create' | 'delete' | 'fork' | null;

interface PromptConfigurationContextType {
  open: PromptDialogType;
  setOpen: (type: PromptDialogType) => void;
  editedContent: string;
  setEditedContent: (content: string) => void;
  refetchTrigger: number;
  triggerRefetch: () => void;
  forkDialogOpen: boolean;
  setForkDialogOpen: (open: boolean) => void;
  selectedPromptForFork: SystemPrompt | null;
  setSelectedPromptForFork: (prompt: SystemPrompt | null) => void;
  selectedPromptForDelete: SystemPrompt | null;
  setSelectedPromptForDelete: (prompt: SystemPrompt | null) => void;
}

const PromptConfigurationContext =
  createContext<PromptConfigurationContextType | null>(null);

export function PromptConfigurationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<PromptDialogType>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [selectedPromptForFork, setSelectedPromptForFork] =
    useState<SystemPrompt | null>(null);
  const [selectedPromptForDelete, setSelectedPromptForDelete] =
    useState<SystemPrompt | null>(null);

  const triggerRefetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <PromptConfigurationContext.Provider
      value={{
        open,
        setOpen,
        editedContent,
        setEditedContent,
        refetchTrigger,
        triggerRefetch,
        forkDialogOpen,
        setForkDialogOpen,
        selectedPromptForFork,
        setSelectedPromptForFork,
        selectedPromptForDelete,
        setSelectedPromptForDelete,
      }}
    >
      {children}
    </PromptConfigurationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePromptConfiguration = () => {
  const context = useContext(PromptConfigurationContext);
  if (!context) {
    throw new Error(
      'usePromptConfiguration must be used within <PromptConfigurationProvider>'
    );
  }
  return context;
};
