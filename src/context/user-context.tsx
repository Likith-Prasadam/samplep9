import { createContext, useContext } from 'react';

export interface UserData {
  avatar?: string;
  user_hash?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  cohort_id?: number;
  is_root?: boolean;
  is_general?: boolean;
  user_id?: number;
  role_name?: string;
  user_role_id?: number;
  category_id?: number;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
