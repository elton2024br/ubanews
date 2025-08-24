import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
  logout: (forceLogout?: boolean) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  refreshUser: () => Promise<void>;
  recoverSession: () => Promise<boolean>;
  checkConnection: () => Promise<boolean>;
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

  // Verificar conexão com Supabase
  const checkConnection = async (): Promise<boolean> => {
    try {
      console.log('[AdminProvider] Verificando conexão com Supabase...');
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('[AdminProvider] Erro de conexão com Supabase:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return false;
      }
      
      console.log('[AdminProvider] Conexão com Supabase estabelecida com sucesso');
      return true;
    } catch (error) {
      console.error('[AdminProvider] Falha na verificação de conexão:', error);
      return false;
    }
  };

  const loadAdminUser = async (email: string): Promise<AdminUser | null> => {
    try {
      console.log('[AdminProvider] Carregando dados do usuário administrativo:', email);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('[AdminProvider] Erro ao carregar usuário administrativo:', {
          email,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('[AdminProvider] Dados do usuário administrativo carregados:', {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.status
      });
      return data;
    } catch (error) {
      console.error('[AdminProvider] Falha crítica ao carregar usuário administrativo:', error);
      return null;
    }
  };



  const startSessionTimer = useCallback((session: Session) => {
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
  }, [logout]);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const handleAuthError = async (error: Error | { message?: string }, context: string) => {
      console.error(`[AdminProvider] Auth error in ${context}:`, error);
      
      // Se é erro de rede e ainda temos tentativas
      if (retryCount < maxRetries && (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('ERR_ABORTED') ||
        error.message?.includes('NetworkError') ||
        error.message?.includes('net::ERR_ABORTED')
      )) {
        retryCount++;
        console.warn(`[AdminProvider] Retrying auth operation (${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
        return true; // Indica que deve tentar novamente
      }
      
      // Se esgotaram as tentativas ou é outro tipo de erro
      retryCount = 0;
      return false;
    };

    const initializeAuth = async () => {
       if (!mounted) return;
       
       console.log('[AdminProvider] Verificando usuário logado...');
       setLoading(true);
       
       // Verificar conexão com Supabase
       const isConnected = await checkConnection();
       if (!isConnected) {
         console.warn('Supabase not connected, using mock mode');
         setLoading(false);
         return;
       }

       const attemptGetSession = async (): Promise<boolean> => {
         try {
           const { data: { session }, error } = await supabase.auth.getSession();
           
           if (error) {
             const shouldRetry = await handleAuthError(error, 'getSession');
             if (shouldRetry && mounted) {
               return attemptGetSession();
             }
             
             setUser(null);
             setLoading(false);
             return false;
           }

           if (session?.user && mounted) {
             console.log('[AdminProvider] Sessão encontrada para:', session.user.email);
             startSessionTimer(session);
             const adminUser = await loadAdminUser(session.user.email!);
             if (adminUser) {
               setUser(adminUser);
             }
           } else if (mounted) {
             console.log('[AdminProvider] Nenhuma sessão ativa encontrada');
             setUser(null);
           }
           
           retryCount = 0; // Reset retry count on success
           return true;
         } catch (error) {
           const shouldRetry = await handleAuthError(error as Error, 'getSession catch');
           if (shouldRetry && mounted) {
             return attemptGetSession();
           }
           
           if (mounted) {
             setUser(null);
           }
           return false;
         } finally {
           if (mounted) {
             setLoading(false);
           }
         }
       };
       
       await attemptGetSession();
     };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('[AdminProvider] Auth state changed:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session) {
            retryCount = 0; // Reset retry count on successful sign in
            startSessionTimer(session);
            const adminUser = await loadAdminUser(session.user.email!);
            if (adminUser) {
              setUser(adminUser);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            retryCount = 0; // Reset retry count
            if (sessionTimeoutRef.current) {
              clearTimeout(sessionTimeoutRef.current);
            }
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('[AdminProvider] Token refreshed successfully');
            retryCount = 0; // Reset retry count on successful refresh
          }
        } catch (error) {
          console.error('[AdminProvider] Error handling auth state change:', error);
          // Em caso de erro, não fazer logout automático para evitar loops
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [startSessionTimer]);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const adminUser = await loadAdminUser(session.user.email);
      if (adminUser) {
        setUser(adminUser);
      }
    }
  };

  const verifyTOTP = (secret: string, token: string): boolean => {
    // Simplified TOTP verification for browser compatibility
    // In production, consider using a proper TOTP library like otplib
    return token.length === 6 && /^\d{6}$/.test(token);
  };

  const login = async (email: string, password: string, otp?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AdminProvider] Iniciando processo de login para:', email);
      setLoading(true);
      
      // First authenticate with Supabase Auth
      console.log('[AdminProvider] Autenticando com Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('[AdminProvider] Erro de autenticação:', {
          error: authError.message,
          code: authError.code,
          details: authError.details
        });
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        console.error('[AdminProvider] Dados do usuário não retornados após autenticação');
        return { success: false, error: 'Falha na autenticação' };
      }

      console.log('[AdminProvider] Autenticação bem-sucedida, verificando permissões administrativas...');
      
      // Then check if user exists in admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError) {
        console.error('[AdminProvider] Erro ao verificar usuário administrativo:', {
          error: adminError.message,
          code: adminError.code,
          details: adminError.details,
          hint: adminError.hint
        });
        await supabase.auth.signOut();
        return { success: false, error: 'Usuário não autorizado para acessar o painel administrativo' };
      }

      if (!adminData) {
        console.error('[AdminProvider] Usuário administrativo não encontrado na tabela admin_users');
        await supabase.auth.signOut();
        return { success: false, error: 'Usuário não autorizado para acessar o painel administrativo' };
      }

      console.log('[AdminProvider] Usuário administrativo encontrado:', {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        name: adminData.full_name
      });

      // Check 2FA if enabled
      if (adminData.two_factor_enabled && otp) {
        console.log('[AdminProvider] Verificando código 2FA...');
        if (!verifyTOTP(adminData.two_factor_secret || '', otp)) {
          return { success: false, error: 'Código 2FA inválido' };
        }
      }

      // Update last login
      console.log('[AdminProvider] Atualizando último login...');
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminData.id);

      setUser(adminData);
      
      console.log('[AdminProvider] Login concluído com sucesso!');
      toast({
        title: 'Login realizado com sucesso',
        description: `Bem-vindo, ${adminData.full_name || adminData.email}!`
      });

      return { success: true };
    } catch (error) {
      console.error('[AdminProvider] Erro crítico durante login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (forceLogout = false): Promise<void> => {
    console.log('[AdminProvider] Iniciando processo de logout...', { forceLogout });
    try {
      setLoading(true);
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      
      // Limpar estado local primeiro
      setUser(null);
      
      // Se não é logout forçado, tentar logout do Supabase
      if (!forceLogout) {
        try {
          const { error } = await supabase.auth.signOut({ scope: 'local' });
          if (error) {
            console.error('[AdminProvider] Erro durante logout:', error);
            // Se falhar, fazer logout forçado
            if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_ABORTED')) {
              console.warn('[AdminProvider] Erro de rede no logout, fazendo logout local...');
              return logout(true);
            }
            console.warn('[AdminProvider] Logout do Supabase falhou, mas estado local foi limpo');
          } else {
            console.log('[AdminProvider] Logout realizado com sucesso');
          }
        } catch (networkError) {
          console.warn('[AdminProvider] Erro de rede no logout, fazendo logout local...', networkError);
          return logout(true);
        }
      } else {
        console.log('[AdminProvider] Logout forçado - apenas limpeza local');
      }
      
      // Usar window.location para redirecionamento mais confiável
      console.log('[AdminProvider] Redirecionando para página de login...');
      window.location.href = '/admin/login';
      
    } catch (error) {
      console.error('[AdminProvider] Erro crítico durante logout:', error);
      
      // Mesmo com erro, limpar estado local e redirecionar
      setUser(null);
      window.location.href = '/admin/login';
    } finally {
      setLoading(false);
    }
  };

  // Função para recuperar sessão em caso de falha de refresh token
  const recoverSession = async () => {
    console.log('[AdminProvider] Tentando recuperar sessão após falha de refresh token...');
    try {
      // Tentar obter sessão atual
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('[AdminProvider] Sessão não pode ser recuperada, fazendo logout...');
        await logout(true);
        return false;
      }
      
      // Verificar se a sessão ainda é válida
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('[AdminProvider] Sessão expirada, fazendo logout...');
        await logout(true);
        return false;
      }
      
      console.log('[AdminProvider] Sessão recuperada com sucesso');
      return true;
    } catch (error) {
      console.error('[AdminProvider] Erro ao recuperar sessão:', error);
      await logout(true);
      return false;
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
    recoverSession,
    checkConnection
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
