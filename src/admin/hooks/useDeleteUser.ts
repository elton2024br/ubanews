import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

async function deleteUser(userId: string) {
  // First, delete the user from the auth.users table
  // This requires the service_role key, which should be handled in a secure backend function.
  // For this implementation, we assume we have a supabase function `delete_user` that handles this.
  const { error: functionError } = await supabase.rpc('delete_user_rpc', {
    user_id_to_delete: userId,
  });

  if (functionError) {
    console.error('Error calling delete_user function:', functionError);
    throw new Error(`Erro na função de exclusão: ${functionError.message}`);
  }

  // If the auth user is deleted, the corresponding public user should be gone too (due to foreign key with ON DELETE CASCADE)
  // If not, we would need to delete from the public.users table as well.
  // const { error: dbError } = await supabase
  //   .from('users')
  //   .delete()
  //   .match({ id: userId });

  // if (dbError) {
  //   console.error('Error deleting from users table:', dbError);
  //   throw new Error(`Erro ao excluir do banco de dados: ${dbError.message}`);
  // }
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      // Here you could use a toast notification to show the error
      console.error('Failed to delete user:', error.message);
    },
  });
}
