import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Settings } from '@/admin/types/admin';

// The payload type can be a partial of the Settings type
type SettingsUpdatePayload = Partial<Omit<Settings, 'id' | 'updated_at'>>;

async function updateSettings(payload: SettingsUpdatePayload) {
  const { error } = await supabase.rpc('update_settings_rpc', {
    payload: payload as Record<string, unknown>, // Use Record type instead of any
  });

  if (error) {
    console.error('Error calling update_settings_rpc function:', error);
    throw new Error(`Erro ao atualizar configurações: ${error.message}`);
  }
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      console.error('Failed to update settings:', error.message);
    },
  });
}
