import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardData() {
  try {
    console.log('📊 Testando carregamento direto dos dados do dashboard...');
    
    // Buscar um usuário administrativo ativo
    console.log('\n👤 Buscando usuário administrativo ativo...');
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('is_active', true)
      .eq('email', 'admin@ubanews.com')
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário encontrado:', adminUser.full_name, `(${adminUser.email})`);
    
    // Testar consulta de estatísticas (como no Dashboard.tsx)
    console.log('\n📈 Testando consulta de estatísticas...');
    const { data: newsStats, error: statsError } = await supabase
      .from('admin_news')
      .select('status, view_count')
      .eq('author_id', adminUser.id);
    
    if (statsError) {
      console.error('❌ Erro na consulta de estatísticas:', statsError.message);
      console.error('   Detalhes:', statsError);
    } else {
      console.log('✅ Consulta de estatísticas bem-sucedida!');
      console.log('   - Total de notícias do usuário:', newsStats?.length || 0);
      
      if (newsStats && newsStats.length > 0) {
        const published = newsStats.filter(n => n.status === 'published').length;
        const pending = newsStats.filter(n => n.status === 'pending').length;
        const draft = newsStats.filter(n => n.status === 'draft').length;
        const totalViews = newsStats.reduce((sum, n) => sum + (n.view_count || 0), 0);
        
        console.log('   - Publicadas:', published);
        console.log('   - Pendentes:', pending);
        console.log('   - Rascunhos:', draft);
        console.log('   - Total de visualizações:', totalViews);
      }
    }
    
    // Testar consulta de notícias recentes (como no Dashboard.tsx)
    console.log('\n📰 Testando consulta de notícias recentes...');
    const { data: recentNews, error: recentError } = await supabase
      .from('admin_news')
      .select(`
        id,
        title,
        status,
        created_at,
        view_count,
        admin_users!author_id(
          full_name
        )
      `)
      .eq('author_id', adminUser.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Erro na consulta de notícias recentes:', recentError.message);
      console.error('   Detalhes:', recentError);
    } else {
      console.log('✅ Consulta de notícias recentes bem-sucedida!');
      console.log('   - Total de notícias recentes:', recentNews?.length || 0);
      
      if (recentNews && recentNews.length > 0) {
        console.log('   - Notícias encontradas:');
        recentNews.forEach((news, index) => {
          const authorName = news.admin_users?.full_name || 'Autor desconhecido';
          console.log(`     ${index + 1}. "${news.title}" (${news.status}) - ${authorName}`);
        });
      }
    }
    
    // Testar consulta geral de todas as notícias (para debug)
    console.log('\n🔍 Testando consulta geral de notícias...');
    const { data: allNews, error: allError } = await supabase
      .from('admin_news')
      .select('id, title, status, author_id, created_at')
      .limit(10);
    
    if (allError) {
      console.error('❌ Erro na consulta geral:', allError.message);
    } else {
      console.log('✅ Consulta geral bem-sucedida!');
      console.log('   - Total de notícias no sistema:', allNews?.length || 0);
      
      if (allNews && allNews.length > 0) {
        console.log('   - Notícias por autor:');
        const byAuthor = {};
        allNews.forEach(news => {
          byAuthor[news.author_id] = (byAuthor[news.author_id] || 0) + 1;
        });
        
        for (const [authorId, count] of Object.entries(byAuthor)) {
          console.log(`     - Autor ${authorId}: ${count} notícias`);
        }
      }
    }
    
    console.log('\n✅ Teste concluído! Os dados estão disponíveis no banco.');
    console.log('💡 Se o painel administrativo estiver vazio, o problema pode ser:');
    console.log('   1. Problema de autenticação (usuário não consegue fazer login)');
    console.log('   2. Problema de permissões RLS (Row Level Security)');
    console.log('   3. Problema no código React (verificar logs do navegador)');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDashboardData();