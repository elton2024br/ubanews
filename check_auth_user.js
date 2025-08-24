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

async function checkAuthUser() {
  try {
    console.log('🔍 Verificando status do usuário no sistema de autenticação...');
    
    // Buscar usuário na tabela auth.users usando service role
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
      return;
    }
    
    console.log('👥 Total de usuários no auth:', users.users.length);
    
    // Encontrar o usuário admin
    const adminUser = users.users.find(user => user.email === 'admin@ubanews.com');
    
    if (!adminUser) {
      console.error('❌ Usuário admin@ubanews.com não encontrado no sistema de autenticação');
      console.log('💡 Criando usuário no sistema de autenticação...');
      
      // Criar usuário usando admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@ubanews.com',
        password: 'admin123',
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          full_name: 'Administrador Principal'
        }
      });
      
      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('✅ Usuário criado com sucesso!');
      console.log('   ID:', newUser.user.id);
      console.log('   Email:', newUser.user.email);
      console.log('   Email confirmado:', newUser.user.email_confirmed_at ? 'Sim' : 'Não');
      
    } else {
      console.log('✅ Usuário encontrado no sistema de autenticação:');
      console.log('   ID:', adminUser.id);
      console.log('   Email:', adminUser.email);
      console.log('   Email confirmado:', adminUser.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   Criado em:', adminUser.created_at);
      console.log('   Último login:', adminUser.last_sign_in_at || 'Nunca');
      
      // Se o email não estiver confirmado, confirmar
      if (!adminUser.email_confirmed_at) {
        console.log('\n📧 Confirmando email do usuário...');
        
        const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
          adminUser.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error('❌ Erro ao confirmar email:', updateError.message);
        } else {
          console.log('✅ Email confirmado com sucesso!');
        }
      }
      
      // Tentar resetar a senha para garantir que seja 'admin123'
      console.log('\n🔑 Atualizando senha do usuário...');
      
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { password: 'admin123' }
      );
      
      if (updateError) {
        console.error('❌ Erro ao atualizar senha:', updateError.message);
      } else {
        console.log('✅ Senha atualizada com sucesso!');
      }
    }
    
    console.log('\n🧪 Testando login após correções...');
    
    // Criar cliente com anon key para testar login
    const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: 'admin@ubanews.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ Login ainda falha:', loginError.message);
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log('   User ID:', loginData.user?.id);
      
      // Fazer logout
      await testClient.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAuthUser();