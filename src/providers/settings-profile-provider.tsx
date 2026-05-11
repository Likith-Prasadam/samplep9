import React, { useState, createContext, useContext } from 'react';

type ProfileDialogType = 'avatar' | 'password' | 'delete-account' | null;

interface SettingsProfileContextType {
  open: ProfileDialogType;
  setOpen: (type: ProfileDialogType) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  refetchTrigger: number;
  triggerRefetch: () => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

const SettingsProfileContext = createContext<SettingsProfileContextType | null>(
  null
);

export function SettingsProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<ProfileDialogType>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const triggerRefetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <SettingsProfileContext.Provider
      value={{
        open,
        setOpen,
        isEditing,
        setIsEditing,
        refetchTrigger,
        triggerRefetch,
        hasUnsavedChanges,
        setHasUnsavedChanges,
      }}
    >
      {children}
    </SettingsProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSettingsProfile = () => {
  const context = useContext(SettingsProfileContext);
  if (!context) {
    throw new Error(
      'useSettingsProfile must be used within <SettingsProfileProvider>'
    );
  }
  return context;
};
