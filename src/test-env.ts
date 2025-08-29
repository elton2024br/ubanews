// Teste para verificar se as variáveis de ambiente estão sendo carregadas
console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Todas as variáveis VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('=== FIM DO TESTE ===');