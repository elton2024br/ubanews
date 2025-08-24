import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'Não configurada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'Configurada' : 'Não configurada');
  process.exit(1);
}

// Criar cliente com service role key para acesso completo
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('URL:', supabaseUrl);
console.log('Service Role Key:', serviceRoleKey ? 'Configurada' : 'Não configurada');
console.log('');
console.log('=== Testando dados administrativos com SERVICE ROLE ===');
console.log('');

async function testAdminData() {
  try {
    // Verificar admin_users
    console.log('1. Verificando tabela admin_users...');
    const { data: adminUsers, error: adminUsersError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminUsersError) {
      console.error('Erro ao buscar admin_users:', adminUsersError);
    } else {
      console.log(`Dados admin_users: ${adminUsers.length} registros`);
      if (adminUsers.length > 0) {
        console.log('Primeiro usuário:', {
          email: adminUsers[0].email,
          full_name: adminUsers[0].full_name,
          role: adminUsers[0].role,
          is_active: adminUsers[0].is_active
        });
      }
    }
    console.log('');

    // Verificar admin_news
    console.log('2. Verificando tabela admin_news...');
    const { data: adminNews, error: adminNewsError } = await supabase
      .from('admin_news')
      .select('*');
    
    if (adminNewsError) {
      console.error('Erro ao buscar admin_news:', adminNewsError);
    } else {
      console.log(`Dados admin_news: ${adminNews.length} registros`);
      if (adminNews.length > 0) {
        console.log('Primeira notícia:', {
          title: adminNews[0].title,
          status: adminNews[0].status,
          category: adminNews[0].category,
          author_id: adminNews[0].author_id
        });
      }
    }
    console.log('');

    // Verificar tabela news (para comparação)
    console.log('3. Verificando tabela news (para comparação)...');
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('*');
    
    if (newsError) {
      console.error('Erro ao buscar news:', newsError);
    } else {
      console.log(`Dados news: ${news.length} registros`);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testAdminData();