import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../../supabase/config';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

const isStrongPassword = (password: string): boolean => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return strongRegex.test(password);
};

interface LoginAttempts {
  count: number;
  lockedUntil: number;
}

const getLoginAttempts = (): LoginAttempts => {
  try {
    const data = localStorage.getItem('adminLoginAttempts');
    return data ? JSON.parse(data) : { count: 0, lockedUntil: 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
};

const saveLoginAttempts = (attempts: LoginAttempts) => {
  localStorage.setItem('adminLoginAttempts', JSON.stringify(attempts));
};

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
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadAdminUser(session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const stored = localStorage.getItem('supabaseSession');
        if (stored) {
          const tokens = JSON.parse(stored);
          const { data } = await supabase.auth.setSession(tokens);
          session = data.session;
        }
      }

      if (session?.user?.email) {
        await loadAdminUser(session.user.email);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading admin user:', error);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error loading admin user:', error);
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      await loadAdminUser(session.user.email);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const attempts = getLoginAttempts();
      const now = Date.now();
      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        return { success: false, error: 'Muitas tentativas. Tente novamente mais tarde.' };
      }

      if (!isStrongPassword(password)) {
        return { success: false, error: 'Senha muito fraca.' };
      }

      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !session) {
        const newAttempts = {
          count: attempts.count + 1,
          lockedUntil: attempts.lockedUntil,
        };
        if (newAttempts.count >= MAX_LOGIN_ATTEMPTS) {
          newAttempts.count = 0;
          newAttempts.lockedUntil = now + LOCK_TIME_MS;
        }
        saveLoginAttempts(newAttempts);
        return { success: false, error: 'Credenciais inválidas' };
      }

      saveLoginAttempts({ count: 0, lockedUntil: 0 });

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

      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      localStorage.setItem(
        'supabaseSession',
        JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
      );

      setUser(adminUser);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro interno do servidor' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabaseSession');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Define permissions based on roles
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      editor: [
        'news.create',
        'news.edit',
        'news.delete',
        'news.publish',
        'news.approve',
        'dashboard.view',
        'users.view'
      ],
      columnist: [
        'news.create',
        'news.edit.own',
        'dashboard.view.limited'
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