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
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message);
  }

  // Transform the data from Supabase to match our app's User type
  const transformedData: User[] = (data as SupabaseAdminUser[]).map(user => ({
    id: user.id,
    email: user.email,
    name: user.full_name, // Transformation from full_name to name
    role: user.role,
    is_active: user.is_active,
    two_factor_enabled: user.two_factor_enabled,
    last_login: user.last_login_at, // Transformation from last_login_at to last_login
    created_at: user.created_at,
    updated_at: user.updated_at,
    avatar: user.avatar_url, // Transformation from avatar_url to avatar
    permissions: [], // Permissions would be loaded separately if needed
  }));

  return transformedData;
};

export const useUsers = () => {
  return useQuery<User[], Error>({
    queryKey: ['admin_users'],
    queryFn: fetchUsers,
  });
};
