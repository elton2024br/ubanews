import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { User, UserUpdatePayload } from '@/admin/types/admin';

async function updateUser({ id, ...updateData }: UserUpdatePayload & { id: string }) {
  const { error } = await supabase.rpc('update_user_rpc', {
    user_id_to_update: id,
    new_email: updateData.email,
    new_password: updateData.password,
    new_name: updateData.name,
    new_role: updateData.role,
  });

  if (error) {
    console.error('Error calling update_user_rpc function:', error);
    throw new Error(`Erro na função de atualização: ${error.message}`);
  }
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Failed to update user:', error.message);
    },
  });
}
