import React, { useState, createContext, useContext } from 'react';
import type { ConfirmationDialogState } from '@/features/configuration/event-configuration/types/types';

interface EventConfigurationContextType {
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  confirmationDialog: ConfirmationDialogState;
  setConfirmationDialog: (dialog: ConfirmationDialogState) => void;
  closeConfirmationDialog: () => void;
}

const EventConfigurationContext =
  createContext<EventConfigurationContextType | null>(null);

export function EventConfigurationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmationDialog, setConfirmationDialog] =
    useState<ConfirmationDialogState>({
      open: false,
      type: 'delete',
      title: '',
      message: '',
      onConfirm: () => {},
    });

  const closeConfirmationDialog = () => {
    setConfirmationDialog({
      open: false,
      type: 'delete',
      title: '',
      message: '',
      onConfirm: () => {},
    });
  };

  return (
    <EventConfigurationContext.Provider
      value={{
        editingIndex,
        setEditingIndex,
        confirmationDialog,
        setConfirmationDialog,
        closeConfirmationDialog,
      }}
    >
      {children}
    </EventConfigurationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEventConfiguration = () => {
  const context = useContext(EventConfigurationContext);
  if (!context) {
    throw new Error(
      'useEventConfiguration must be used within <EventConfigurationProvider>'
    );
  }
  return context;
};
