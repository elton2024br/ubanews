import { createClient } from '@supabase/supabase-js';

// Configurações diretas do Supabase
const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTc5MDQsImV4cCI6MjA3MDc3MzkwNH0.1qe6mBcQAG6YsKGNhdsG9LYDpAZwXRV5zN-JYbvUMbM';

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n=== Testando conexão com Supabase ===');
    
    // Teste 1: Verificar dados na tabela admin_news
    console.log('\n1. Verificando tabela admin_news...');
    const { data: newsData, error: newsError } = await supabase
      .from('admin_news')
      .select('*')
      .limit(5);
    
    if (newsError) {
      console.error('Erro admin_news:', newsError);
    } else {
      console.log('Dados admin_news:', newsData?.length || 0, 'registros');
      if (newsData?.length > 0) {
        console.log('Primeiro registro:', newsData[0]);
      }
    }
    
    // Teste 2: Verificar dados na tabela admin_users
    console.log('\n2. Verificando tabela admin_users...');
    const { data: usersData, error: usersError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('Erro admin_users:', usersError);
    } else {
      console.log('Dados admin_users:', usersData?.length || 0, 'registros');
      if (usersData?.length > 0) {
        console.log('Primeiro usuário:', usersData[0]);
      }
    }
    
    // Teste 3: Verificar dados na tabela news
    console.log('\n3. Verificando tabela news...');
    const { data: publicNewsData, error: publicNewsError } = await supabase
      .from('news')
      .select('*')
      .limit(5);
    
    if (publicNewsError) {
      console.error('Erro news:', publicNewsError);
    } else {
      console.log('Dados news:', publicNewsData?.length || 0, 'registros');
      if (publicNewsData?.length > 0) {
        console.log('Primeira notícia:', publicNewsData[0]);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testConnection();