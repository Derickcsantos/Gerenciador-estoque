import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/database';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Simulação de usuário logado (em um sistema real seria obtido via login)
  useEffect(() => {
    // Por enquanto vamos simular com o primeiro usuário admin
    const mockUser: User = {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@empresa.com',
      user_type: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCurrentUser(mockUser);
  }, []);

  const isAdmin = currentUser?.user_type === 'admin';

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};