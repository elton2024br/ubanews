import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'columnist';
  is_active: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AdminContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Simular usuário logado para teste
  useEffect(() => {
    console.log('🧪 [AdminProviderTest] Simulando usuário logado para teste...');
    
    const simulateLogin = async () => {
      try {
        // Buscar o usuário admin do banco
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', 'admin@ubanews.com')
          .eq('is_active', true)
          .single();
        
        if (error) {
          console.error('❌ [AdminProviderTest] Erro ao buscar usuário:', error);
          setLoading(false);
          return;
        }
        
        console.log('✅ [AdminProviderTest] Usuário simulado carregado:', adminUser.full_name);
        setUser(adminUser);
        setLoading(false);
        
      } catch (error) {
        console.error('❌ [AdminProviderTest] Erro na simulação:', error);
        setLoading(false);
      }
    };
    
    simulateLogin();
  }, []);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    console.log('🔐 [AdminProviderTest] Login simulado - sempre retorna sucesso');
    return { success: true };
  };

  const logout = async () => {
    console.log('🚪 [AdminProviderTest] Logout simulado');
    setUser(null);
  };

  const refreshUser = async () => {
    console.log('🔄 [AdminProviderTest] Refresh simulado');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}