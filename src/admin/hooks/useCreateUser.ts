import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// This type should match the form values
type NewUserData = {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'columnist';
  password: string;
};

const createUser = async (userData: NewUserData) => {
  // Step 1: Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true, // Automatically confirm user's email
    user_metadata: {
      full_name: userData.name,
      role: userData.role,
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    throw new Error(`Auth Error: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('User was not created in Supabase Auth.');
  }

  // Step 2: Insert the user details into the public `admin_users` table
  const { error: dbError } = await supabase
    .from('admin_users')
    .insert({
      id: authData.user.id, // Use the ID from the created auth user
      full_name: userData.name,
      email: userData.email,
      role: userData.role,
      is_active: true, // Users are active by default
      two_factor_enabled: false,
    });

  if (dbError) {
    console.error('Error inserting into admin_users:', dbError);
    // If this step fails, we should ideally delete the auth user to avoid orphans
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Database Error: ${dbError.message}`);
  }

  return authData.user;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // When the mutation is successful, invalidate the users query to refetch data
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      toast({
        title: 'Usuário Criado!',
        description: 'O novo usuário foi adicionado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao Criar Usuário',
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    },
  });
};
