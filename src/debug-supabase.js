// Teste direto das variáveis de ambiente e conexão Supabase
console.log('=== DEBUG SUPABASE ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Todas as variáveis VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('import.meta.env completo:', import.meta.env);

// Teste de conexão direta
if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.log('Tentando conexão direta com Supabase...');
  
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/admin_users?select=id&limit=1`, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Resposta da API:', response.status, response.statusText);
    return response.json();
  })
  .then(data => {
    console.log('Dados recebidos:', data);
  })
  .catch(error => {
    console.error('Erro na conexão:', error);
  });
} else {
  console.error('Variáveis de ambiente não encontradas!');
}