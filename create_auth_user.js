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

// Usar service role para criar usuários
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuthUser() {
  try {
    console.log('👤 Criando usuário de autenticação...');
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@ubanews.com',
      password: 'admin123',
      email_confirm: true // Confirmar email automaticamente
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️ Usuário já existe no sistema de autenticação');
        
        // Tentar buscar o usuário existente
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('❌ Erro ao listar usuários:', listError.message);
          return;
        }
        
        const existingUser = users.users.find(u => u.email === 'admin@ubanews.com');
        if (existingUser) {
          console.log('✅ Usuário encontrado:', existingUser.email);
          console.log('   - ID:', existingUser.id);
          console.log('   - Confirmado:', existingUser.email_confirmed_at ? '✅ Sim' : '❌ Não');
          
          // Se não estiver confirmado, confirmar
          if (!existingUser.email_confirmed_at) {
            console.log('📧 Confirmando email do usuário...');
            const { error: confirmError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { email_confirm: true }
            );
            
            if (confirmError) {
              console.error('❌ Erro ao confirmar email:', confirmError.message);
            } else {
              console.log('✅ Email confirmado com sucesso!');
            }
          }
        }
      } else {
        console.error('❌ Erro ao criar usuário:', authError.message);
        return;
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('   - Email:', authData.user.email);
      console.log('   - ID:', authData.user.id);
    }
    
    // Verificar se o usuário pode fazer login
    console.log('\n🔐 Testando login...');
    const supabaseClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@ubanews.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError.message);
      
      // Se o erro for de email não confirmado, tentar confirmar novamente
      if (loginError.message.includes('email not confirmed')) {
        console.log('📧 Tentando confirmar email novamente...');
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === 'admin@ubanews.com');
        
        if (user) {
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          
          if (!confirmError) {
            console.log('✅ Email confirmado! Tente fazer login novamente.');
          }
        }
      }
    } else {
      console.log('✅ Login teste realizado com sucesso!');
      console.log('   - Usuário:', loginData.user.email);
      
      // Fazer logout
      await supabaseClient.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createAuthUser();