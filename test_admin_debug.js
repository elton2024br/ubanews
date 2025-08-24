// Script para testar logs de debug do painel administrativo
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminDebug() {
  console.log('🔍 Testando funcionalidades de debug do painel administrativo...');
  console.log('');

  try {
    // Teste 1: Verificar conexão
    console.log('1. Testando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão estabelecida com sucesso');
    console.log('');

    // Teste 2: Verificar dados de usuários administrativos
    console.log('2. Verificando usuários administrativos...');
    const { data: adminUsers, error: usersError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('is_active', true);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log(`✅ Encontrados ${adminUsers.length} usuários administrativos ativos:`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    console.log('');

    // Teste 3: Verificar dados de notícias administrativas
    console.log('3. Verificando notícias administrativas...');
    const { data: adminNews, error: newsError } = await supabase
      .from('admin_news')
      .select('id, title, status, author_name, views')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (newsError) {
      console.error('❌ Erro ao buscar notícias:', newsError.message);
    } else {
      console.log(`✅ Encontradas ${adminNews.length} notícias administrativas:`);
      adminNews.forEach(news => {
        console.log(`   - "${news.title}" (${news.status}) - ${news.views || 0} visualizações`);
      });
    }
    console.log('');

    // Teste 4: Simular carregamento de estatísticas
    console.log('4. Simulando carregamento de estatísticas do dashboard...');
    const { data: allNews, error: statsError } = await supabase
      .from('admin_news')
      .select('status, views, created_at');
    
    if (statsError) {
      console.error('❌ Erro ao carregar estatísticas:', statsError.message);
    } else {
      const totalNews = allNews.length;
      const publishedNews = allNews.filter(n => n.status === 'published').length;
      const pendingNews = allNews.filter(n => n.status === 'pending').length;
      const draftNews = allNews.filter(n => n.status === 'draft').length;
      const totalViews = allNews.reduce((sum, n) => sum + (n.views || 0), 0);
      
      console.log('✅ Estatísticas calculadas:');
      console.log(`   - Total de notícias: ${totalNews}`);
      console.log(`   - Publicadas: ${publishedNews}`);
      console.log(`   - Pendentes: ${pendingNews}`);
      console.log(`   - Rascunhos: ${draftNews}`);
      console.log(`   - Total de visualizações: ${totalViews}`);
    }
    console.log('');

    console.log('🎉 Todos os testes de debug foram executados!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse http://localhost:5173/admin/login');
    console.log('2. Faça login com um dos usuários administrativos');
    console.log('3. Abra o console do navegador (F12)');
    console.log('4. Verifique os logs de debug que começam com [Dashboard] e [AdminProvider]');
    console.log('5. Navegue pelo painel para ver os logs em ação');

  } catch (error) {
    console.error('❌ Erro crítico durante os testes:', error);
  }
}

testAdminDebug();