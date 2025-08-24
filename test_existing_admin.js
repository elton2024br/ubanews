import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExistingAdmin() {
  try {
    const adminEmail = 'admin@ubatuba.gov.br';
    const possiblePasswords = ['admin123', '123456', 'password', 'admin', 'ubatuba123', 'ubatuba'];
    
    console.log('🔐 Testando login com usuário existente:', adminEmail);
    
    // Primeiro, vamos resetar a senha para uma conhecida
    console.log('\n🔑 Definindo senha conhecida para o usuário...');
    
    const { data: updatedUser, error: updateError } = await adminSupabase.auth.admin.updateUserById(
      '7a147e52-79e2-4159-a948-9bbc9cfce56c', // ID do admin@ubatuba.gov.br
      { password: 'admin123' }
    );
    
    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message);
    } else {
      console.log('✅ Senha definida como "admin123"');
    }
    
    // Testar login
    console.log('\n🧪 Testando login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);
    console.log('   Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Verificar se existe na tabela admin_users
    console.log('\n👤 Verificando dados administrativos...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (adminError) {
      console.log('❌ Usuário não encontrado na tabela admin_users');
      console.log('💡 Criando entrada na tabela admin_users...');
      
      // Criar entrada na tabela admin_users
      const { data: newAdminUser, error: insertError } = await adminSupabase
        .from('admin_users')
        .insert({
          id: data.user.id,
          email: adminEmail,
          full_name: 'Administrador Principal',
          role: 'admin',
          is_active: true,
          two_factor_enabled: false
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar entrada admin_users:', insertError.message);
      } else {
        console.log('✅ Entrada criada na tabela admin_users!');
        console.log('   Nome:', newAdminUser.full_name);
        console.log('   Papel:', newAdminUser.role);
      }
      
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
    
    console.log('\n🎉 SUCESSO! Use as seguintes credenciais para login:');
    console.log('   Email:', adminEmail);
    console.log('   Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testExistingAdmin();