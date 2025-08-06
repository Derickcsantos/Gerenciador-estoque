import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/database';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
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
    // Verificar se existe um usuário salvo no localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao recuperar usuário salvo:', error);
      }
    }
  }, []);

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  };

  const isAdmin = currentUser?.user_type === 'admin';

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetCurrentUser, logout, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};