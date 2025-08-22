import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase não configuradas. ' +
    'Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env'
  );
}

// Configuração exportada (para referência)
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey
};

// Cliente Supabase configurado com variáveis de ambiente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Função para verificar se o Supabase está configurado corretamente
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};