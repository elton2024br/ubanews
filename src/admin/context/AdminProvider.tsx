import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { totp } from 'otplib';
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
<<<<<<< HEAD
  logout: (forceLogout?: boolean) => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
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

  const verifyTOTPHelper = (secret: string, token: string): boolean => {
    try {
      if (!secret) return false;
      // Allow a one-step window to handle minor clock drift
      return totp.verify({ token, secret, window: 1 });
    } catch {
      return false;
    }
  };

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

  const verifyTOTP = async (secret: string, token: string): Promise<boolean> => {
    try {
      // Para desenvolvimento, aceitar código padrão
      if (process.env.NODE_ENV === 'development' && token === '123456') {
        return true;
      }
      
      // Verificação básica de formato
      if (token.length !== 6 || !/^\d{6}$/.test(token)) {
        return false;
      }
      
      // Em produção, implementar verificação real do TOTP
      // Por enquanto, retornar false para códigos inválidos
      return false;
    } catch (error) {
      console.error('Erro na verificação TOTP:', error);
      return false;
    }
  };

  const login = async (
    email: string,
    password: string,
    otp?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Primeiro, verificar se o usuário existe na tabela admin_users
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (adminError || !adminUser) {
        console.error('[AdminProvider] Usuário não encontrado ou erro:', adminError);
        return { success: false, error: 'Credenciais inválidas' };
      }

      if (!adminUser.is_active) {
        console.error('[AdminProvider] Usuário inativo:', email);
        return { success: false, error: 'Usuário desativado' };
      }

      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[AdminProvider] Erro de autenticação:', authError);
        return { success: false, error: 'Credenciais inválidas' };
      }

      // Se 2FA está habilitado, verificar o código OTP
      if (adminUser.two_factor_enabled) {
        if (!otp) {
<<<<<<< HEAD
          return { success: false, error: 'Código 2FA é obrigatório' };
        }

        // Verificar código TOTP (simplificado)
        const isValidOTP = await verifyTOTP(adminUser.two_factor_secret || '', otp);
        if (!isValidOTP) {
=======
          await supabase.auth.signOut();
          return { success: false, error: 'Código 2FA necessário' };
        }
        const isValid = verifyTOTP(adminUser.two_factor_secret || '', otp);
        if (!isValid) {
          await supabase.auth.signOut();
>>>>>>> c42c9b40847e1bff929b272fcc6f879584f566fd
          return { success: false, error: 'Código 2FA inválido' };
        }
      }

      // Atualizar último login
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ last_login_at: now })
        .eq('id', adminUser.id);

      if (updateError) {
        console.error('[AdminProvider] Erro ao atualizar último login:', updateError);
      }

      // Configurar timer de sessão
      if (authData.session) {
        startSessionTimer(authData.session);
      }

      setUser(adminUser);
      console.log('[AdminProvider] Login bem-sucedido:', email);
      
      return { success: true };
    } catch (error) {
      console.error('[AdminProvider] Erro crítico durante login:', error);
      return { success: false, error: 'Erro ao processar login' };
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin tem todas as permissões
    if (user.role === 'admin') return true;
    
    // Mapear permissões por role
    const rolePermissions: Record<string, string[]> = {
      editor: ['read', 'write', 'edit'],
      columnist: ['read', 'write']
=======
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
>>>>>>> c42c9b40847e1bff929b272fcc6f879584f566fd
    };
    
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const recoverSession = async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AdminProvider] Erro ao recuperar sessão:', error);
        return false;
      }

      if (session?.user?.email) {
        const adminUser = await loadAdminUser(session.user.email);
        if (adminUser) {
          setUser(adminUser);
          startSessionTimer(session);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[AdminProvider] Erro ao recuperar sessão:', error);
      return false;
    }
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
