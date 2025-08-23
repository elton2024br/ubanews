import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1)
    .single(); // We expect only one row of settings

  if (error) {
    console.error('Error fetching settings:', error);
    throw new Error(`Erro ao buscar configurações: ${error.message}`);
  }

  return data;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
}
