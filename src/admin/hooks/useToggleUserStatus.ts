import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

async function toggleUserStatus(userId: string) {
  const { error } = await supabase.rpc('toggle_user_status_rpc', {
    user_id_to_toggle: userId,
  });

  if (error) {
    console.error('Error calling toggle_user_status_rpc function:', error);
    throw new Error(`Erro ao alterar status do usuário: ${error.message}`);
  }
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Failed to toggle user status:', error.message);
      // You might want to show a toast notification here
    },
  });
}
