import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { User } from '../types/admin';

// The data from Supabase might have a different shape than our User type.
// We create a type for the raw fetched data.
type SupabaseAdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'columnist';
  is_active: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
};

const fetchUsers = async (): Promise<User[]> => {
  // Fetch both admin users and regular user profiles
  const [adminUsersResult, userProfilesResult] = await Promise.all([
    supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_profiles')
      .select('id, email, full_name, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: false })
  ]);

  if (adminUsersResult.error) {
    console.error('Error fetching admin users:', adminUsersResult.error);
    throw new Error(adminUsersResult.error.message);
  }

  if (userProfilesResult.error) {
    console.error('Error fetching user profiles:', userProfilesResult.error);
    throw new Error(userProfilesResult.error.message);
  }

  // Transform admin users
  const adminUsers: User[] = (adminUsersResult.data as SupabaseAdminUser[]).map(user => ({
    id: user.id,
    email: user.email,
    name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    two_factor_enabled: user.two_factor_enabled,
    last_login: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    avatar: user.avatar_url,
    permissions: [],
  }));

  // Transform regular user profiles (they don't have admin roles)
  const regularUsers: User[] = (userProfilesResult.data || []).map(user => ({
    id: user.id,
    email: user.email || '',
    name: user.full_name || 'Usuário',
    role: 'columnist' as const, // Regular users are treated as columnists
    is_active: true, // Assume active if they have a profile
    two_factor_enabled: false, // Regular users don't have 2FA
    last_login: undefined,
    created_at: user.created_at,
    updated_at: user.updated_at,
    avatar: user.avatar_url,
    permissions: [],
  }));

  // Combine and return all users, with admin users first
  return [...adminUsers, ...regularUsers];
};

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['admin_users'],
    queryFn: fetchUsers,
  });
};
