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

async function testLogin() {
  try {
    console.log('🔐 Testando login com credenciais padrão...');
    console.log('   Email: admin@ubanews.com');
    console.log('   Senha: admin123');
    
    // Tentar fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@ubanews.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('   Código:', error.status);
      console.error('   Detalhes:', error);
      
      // Verificar se o usuário existe no auth
      console.log('\n🔍 Verificando se o usuário existe no sistema de autenticação...');
      
      // Tentar resetar senha para verificar se o usuário existe
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        'admin@ubanews.com'
      );
      
      if (resetError) {
        console.error('❌ Usuário não encontrado no sistema de autenticação:', resetError.message);
        console.log('💡 Solução: O usuário precisa ser criado no Supabase Auth');
      } else {
        console.log('✅ Usuário existe no sistema de autenticação');
        console.log('💡 Problema pode ser: senha incorreta, email não confirmado, ou conta desabilitada');
      }
      
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Verificar se o usuário existe na tabela admin_users
    console.log('\n👤 Verificando dados administrativos...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@ubanews.com')
      .single();
    
    if (adminError) {
      console.error('❌ Usuário não encontrado na tabela admin_users:', adminError.message);
    } else {
      console.log('✅ Dados administrativos encontrados:');
      console.log('   Nome:', adminUser.full_name);
      console.log('   Papel:', adminUser.role);
      console.log('   Ativo:', adminUser.is_active ? 'Sim' : 'Não');
      console.log('   2FA:', adminUser.two_factor_enabled ? 'Habilitado' : 'Desabilitado');
    }
    
    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testLogin();