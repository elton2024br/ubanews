import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'columnist';
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface AdminContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    otp?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
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
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          startSessionTimer(session);
          await loadAdminUser(session.user.email!);
        } else if (event === 'SIGNED_OUT') {
          if (sessionTimeoutRef.current) {
            clearTimeout(sessionTimeoutRef.current);
          }
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        startSessionTimer(session);
        await loadAdminUser(session.user.email);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSessionTimer = (session: Session) => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    const expiresIn = session.expires_at ? session.expires_at * 1000 - Date.now() : 0;
    if (expiresIn > 0) {
      sessionTimeoutRef.current = setTimeout(async () => {
        await logout();
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente.',
        });
      }, expiresIn);
    }
  };

  const verifyTOTP = (secret: string, token: string): boolean => {
    // Simplified TOTP verification for browser compatibility
    // In production, consider using a proper TOTP library like otplib
    return token.length === 6 && /^\d{6}$/.test(token);
  };

  const loadAdminUser = async (email: string, attempt = 0): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading admin user:', error);
        if ((error as any).status === 500) {
          toast({
            title: 'Erro do servidor',
            description: 'Não foi possível carregar os dados administrativos.',
          });
          if (attempt < 2) {
            return loadAdminUser(email, attempt + 1);
          }
        } else {
          toast({
            title: 'Erro',
            description: error.message,
          });
        }
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error loading admin user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados administrativos.',
      });
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      await loadAdminUser(session.user.email);
    }
  };

  const login = async (
    email: string,
    password: string,
    otp?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.session || !authData.user) {
        return { success: false, error: 'Credenciais inválidas' };
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        return { success: false, error: 'Usuário não encontrado ou inativo' };
      }

      if (adminUser.two_factor_enabled) {
        if (!otp) {
          await supabase.auth.signOut();
          return { success: false, error: 'Código de verificação necessário' };
        }
        const isValid = verifyTOTP(adminUser.two_factor_secret || '', otp);
        if (!isValid) {
          await supabase.auth.signOut();
          return { success: false, error: 'Código de verificação inválido' };
        }
      }

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      if (updateError) {
        console.error('Login update error:', updateError);
        if ((updateError as any).status === 500) {
          toast({
            title: 'Erro do servidor',
            description: 'Falha ao atualizar dados de login.',
          });
        } else {
          toast({
            title: 'Erro',
            description: updateError.message,
          });
        }
        await supabase.auth.signOut();
        return { success: false, error: 'Não foi possível completar o login' };
      }

      setUser(adminUser);
      startSessionTimer(authData.session);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if ((error as any)?.status === 500) {
        toast({
          title: 'Erro do servidor',
          description: 'Falha interna ao realizar login.',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Erro inesperado ao realizar login.',
        });
      }
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    const permission = `${resource}.${action}`;

    // Define permissions based on roles
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      editor: [
        'news.read',
        'news.create',
        'news.update',
        'news.delete',
        'news.publish',
        'news.approve',
        'dashboard.view',
        'users.read'
      ],
      columnist: [
        'news.read',
        'news.create',
        'news.update',
        'dashboard.view'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  };

  const value: AdminContextType = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    refreshUser,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
