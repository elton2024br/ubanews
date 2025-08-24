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

async function testAdminLogin() {
  try {
    console.log('🔐 Testando login administrativo...');
    
    // Tentar fazer login com o usuário admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@ubanews.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário autenticado:', authData.user?.email);
    
    // Buscar dados do usuário administrativo
    console.log('\n🔍 Buscando dados administrativos...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', authData.user?.email)
      .eq('is_active', true)
      .single();
    
    if (adminError) {
      console.error('❌ Erro ao buscar dados administrativos:', adminError.message);
      return;
    }
    
    console.log('✅ Dados administrativos encontrados:');
    console.log('   - Nome:', adminUser.full_name);
    console.log('   - Role:', adminUser.role);
    console.log('   - Ativo:', adminUser.is_active);
    
    // Testar carregamento de estatísticas
    console.log('\n📊 Testando carregamento de estatísticas...');
    const { data: newsStats, error: statsError } = await supabase
      .from('admin_news')
      .select('status, view_count')
      .eq('author_id', adminUser.id);
    
    if (statsError) {
      console.error('❌ Erro ao carregar estatísticas:', statsError.message);
    } else {
      console.log('✅ Estatísticas carregadas:');
      console.log('   - Total de notícias:', newsStats?.length || 0);
      const published = newsStats?.filter(n => n.status === 'published').length || 0;
      const pending = newsStats?.filter(n => n.status === 'pending').length || 0;
      const draft = newsStats?.filter(n => n.status === 'draft').length || 0;
      console.log('   - Publicadas:', published);
      console.log('   - Pendentes:', pending);
      console.log('   - Rascunhos:', draft);
    }
    
    // Testar carregamento de notícias recentes
    console.log('\n📰 Testando carregamento de notícias recentes...');
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
      console.error('❌ Erro ao carregar notícias recentes:', recentError.message);
    } else {
      console.log('✅ Notícias recentes carregadas:');
      console.log('   - Total:', recentNews?.length || 0);
      if (recentNews && recentNews.length > 0) {
        recentNews.forEach((news, index) => {
          console.log(`   ${index + 1}. ${news.title} (${news.status})`);
        });
      }
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAdminLogin();