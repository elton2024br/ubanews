import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5NzkwNCwiZXhwIjoyMDcwNzczOTA0fQ.IvA0k2wf9Gw7yayV19Ru1HT4kfaprepGWyYZumLfNQ4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminUser() {
  try {
    console.log('Verificando usuários existentes...');
    
    // Verificar usuários em admin_users
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminError) {
      console.error('Erro ao buscar admin_users:', adminError.message);
      return;
    }
    
    console.log('Usuários em admin_users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Ativo: ${user.is_active}`);
    });
    
    // Verificar usuários em auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar auth.users:', authError.message);
      return;
    }
    
    console.log('\nUsuários em auth.users:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email} - ID: ${user.id}`);
    });
    
    // Verificar se admin@ubanews.com existe em auth.users
    const adminAuthUser = authUsers.users.find(u => u.email === 'admin@ubanews.com');
    const adminDbUser = adminUsers.find(u => u.email === 'admin@ubanews.com');
    
    if (!adminAuthUser && adminDbUser) {
      console.log('\nUsuário admin existe em admin_users mas não em auth.users. Criando...');
      
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@ubanews.com',
        password: 'admin123',
        email_confirm: true
      });
      
      if (createError) {
        console.error('Erro ao criar usuário em auth.users:', createError.message);
        return;
      }
      
      console.log('Usuário admin criado em auth.users com sucesso!');
    } else if (adminAuthUser && adminDbUser) {
      console.log('\nUsuário admin existe em ambas as tabelas. Atualizando senha...');
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        adminAuthUser.id,
        { password: 'admin123' }
      );
      
      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError.message);
        return;
      }
      
      console.log('Senha do usuário admin atualizada com sucesso!');
    } else if (!adminDbUser) {
      console.log('\nUsuário admin não existe em admin_users. Criando...');
      
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          email: 'admin@ubanews.com',
          full_name: 'Administrador Sistema',
          role: 'admin',
          is_active: true,
          two_factor_enabled: false
        });
      
      if (insertError) {
        console.error('Erro ao inserir em admin_users:', insertError.message);
        return;
      }
      
      console.log('Usuário admin criado em admin_users com sucesso!');
    }
    
    // Testar login
    console.log('\nTestando login do usuário admin...');
    
    const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTc5MDQsImV4cCI6MjA3MDc3MzkwNH0.1qe6mBcQAG6YsKGNhdsG9LYDpAZwXRV5zN-JYbvUMbM');
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'admin@ubanews.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('Erro no login:', loginError.message);
    } else {
      console.log('Login realizado com sucesso!');
      console.log('Usuário logado:', loginData.user.email);
      
      // Fazer logout
      await supabaseClient.auth.signOut();
      console.log('Logout realizado com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

fixAdminUser();