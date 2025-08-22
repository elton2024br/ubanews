import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/store/authStore';
import { AdminUser } from '@/shared/types/admin';

interface LoginResult {
  success: boolean;
  error?: string;
}

async function fetchAdminUser(email: string): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error loading admin user:', error);
    return null;
  }

  return data as AdminUser;
}

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const adminUser = await fetchAdminUser(session.user.email);
        setUser(adminUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const adminUser = await fetchAdminUser(session.user.email);
        setUser(adminUser);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      setLoading(true);
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        return { success: false, error: authError.message };
      }

      const adminUser = await fetchAdminUser(email);
      if (!adminUser) {
        return { success: false, error: 'Usuário não encontrado ou inativo' };
      }

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', adminUser.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      setUser(adminUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      const adminUser = await fetchAdminUser(session.user.email);
      setUser(adminUser);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const rolePermissions = {
      admin: ['*'],
      editor: [
        'news.create',
        'news.edit',
        'news.delete',
        'news.publish',
        'news.approve',
        'dashboard.view',
        'users.view',
      ],
      columnist: ['news.create', 'news.edit.own', 'dashboard.view.limited'],
    } as Record<string, string[]>;

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    return Array.isArray(role) ? role.includes(user.role) : user.role === role;
  };

  return { user, loading, login, logout, refreshUser, hasPermission, hasRole };
}
