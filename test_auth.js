import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTc5MDQsImV4cCI6MjA3MDc3MzkwNH0.1qe6mBcQAG6YsKGNhdsG9LYDpAZwXRV5zN-JYbvUMbM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testando autenticação...');
  
  try {
    // Testar login com admin@ubanews.com
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'colunista@ubanews.com',
    password: 'admin123'
  });
    
    if (authError) {
      console.error('Erro de autenticação:', authError.message);
      return;
    }
    
    console.log('Login bem-sucedido!');
    console.log('Usuário autenticado:', authData.user.email);
    
    // Fetch admin user data
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', authData.user.email);

    if (adminError) {
      console.error('Erro ao buscar dados do admin:', adminError.message);
    } else {
      console.log('Número de registros encontrados:', adminData?.length);
      console.log('Dados do admin:', adminData);
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    console.log('Logout realizado com sucesso!');
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

testAuth();