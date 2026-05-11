import React, { useState, createContext, useContext } from 'react';

interface ModelConfigurationContextType {
  deployModalOpen: boolean;
  setDeployModalOpen: (open: boolean) => void;
}

const ModelConfigurationContext =
  createContext<ModelConfigurationContextType | null>(null);

export function ModelConfigurationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  return (
    <ModelConfigurationContext.Provider
      value={{
        deployModalOpen,
        setDeployModalOpen,
      }}
    >
      {children}
    </ModelConfigurationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useModelConfiguration = () => {
  const context = useContext(ModelConfigurationContext);
  if (!context) {
    throw new Error(
      'useModelConfiguration must be used within <ModelConfigurationProvider>'
    );
  }
  return context;
};
