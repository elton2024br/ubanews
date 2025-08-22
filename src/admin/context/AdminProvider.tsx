import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminUser } from '@/shared/types/admin';

interface AdminContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user, loading, login, logout, hasPermission, hasRole, refreshUser } = useAuth();

  const value: AdminContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    refreshUser,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
