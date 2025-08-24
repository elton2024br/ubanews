import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminDashboard() {
  try {
    console.log('🔐 Fazendo login como administrador...');
    
    // Login
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@ubatuba.gov.br',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', authData.user?.id);
    
    // Buscar dados do usuário administrativo
    console.log('\n👤 Buscando dados do usuário administrativo...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (adminError) {
      console.error('❌ Erro ao buscar dados administrativos:', adminError.message);
    } else {
      console.log('✅ Dados administrativos encontrados:');
      console.log('   Nome:', adminUser.full_name);
      console.log('   Email:', adminUser.email);
      console.log('   Papel:', adminUser.role);
      console.log('   Ativo:', adminUser.is_active ? 'Sim' : 'Não');
    }
    
    // Testar estatísticas do dashboard
    console.log('\n📊 Testando estatísticas do dashboard...');
    
    // Total de notícias
    const { count: totalNews, error: totalError } = await supabase
      .from('admin_news')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('❌ Erro ao contar total de notícias:', totalError.message);
    } else {
      console.log('📰 Total de notícias:', totalNews);
    }
    
    // Notícias publicadas
    const { count: publishedNews, error: publishedError } = await supabase
      .from('admin_news')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (publishedError) {
      console.error('❌ Erro ao contar notícias publicadas:', publishedError.message);
    } else {
      console.log('✅ Notícias publicadas:', publishedNews);
    }
    
    // Notícias pendentes
    const { count: pendingNews, error: pendingError } = await supabase
      .from('admin_news')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('❌ Erro ao contar notícias pendentes:', pendingError.message);
    } else {
      console.log('⏳ Notícias pendentes:', pendingNews);
    }
    
    // Rascunhos
    const { count: draftNews, error: draftError } = await supabase
      .from('admin_news')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');
    
    if (draftError) {
      console.error('❌ Erro ao contar rascunhos:', draftError.message);
    } else {
      console.log('📝 Rascunhos:', draftNews);
    }
    
    // Total de visualizações
    const { data: viewsData, error: viewsError } = await supabase
      .from('admin_news')
      .select('view_count');
    
    if (viewsError) {
      console.error('❌ Erro ao buscar visualizações:', viewsError.message);
    } else {
      const totalViews = viewsData.reduce((sum, item) => sum + (item.view_count || 0), 0);
      console.log('👁️ Total de visualizações:', totalViews);
    }
    
    // Notícias recentes
    console.log('\n📋 Buscando notícias recentes...');
    const { data: recentNews, error: recentError } = await supabase
      .from('admin_news')
      .select(`
        id,
        title,
        status,
        created_at,
        view_count,
        admin_users!admin_news_author_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Erro ao buscar notícias recentes:', recentError.message);
    } else {
      console.log('✅ Notícias recentes encontradas:', recentNews.length);
      recentNews.forEach((news, index) => {
        console.log(`   ${index + 1}. ${news.title}`);
        console.log(`      Status: ${news.status}`);
        console.log(`      Autor: ${news.admin_users?.full_name || 'N/A'}`);
        console.log(`      Visualizações: ${news.view_count || 0}`);
        console.log(`      Data: ${new Date(news.created_at).toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    console.log('🚪 Logout realizado com sucesso');
    
    console.log('\n🎉 TESTE DO DASHBOARD CONCLUÍDO!');
    console.log('\n💡 Agora você pode:');
    console.log('   1. Fazer login no navegador com: admin@ubatuba.gov.br / admin123');
    console.log('   2. Verificar se os dados aparecem corretamente no dashboard');
    console.log('   3. Testar as funcionalidades de criação/edição de notícias');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAdminDashboard();