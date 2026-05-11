/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import useDialogState from '@/hooks/use-dialog-state';

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete';

type UsersContextType = {
  open: UsersDialogType | null;
  setOpen: (str: UsersDialogType | null) => void;
  currentRow: any;
  setCurrentRow: React.Dispatch<React.SetStateAction<any>>;
};

const UsersContext = React.createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null);
  const [currentRow, setCurrentRow] = useState<any>(null);

  return (
    <UsersContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext);

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersProvider>');
  }

  return usersContext;
};
