import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5NzkwNCwiZXhwIjoyMDcwNzczOTA0fQ.IvA0k2wf9Gw7yayV19Ru1HT4kfaprepGWyYZumLfNQ4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncAdminUser() {
  try {
    console.log('Sincronizando usuário admin...');
    
    // Encontrar o usuário admin@ubatuba.gov.br em auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar auth.users:', authError.message);
      return;
    }
    
    const adminAuthUser = authUsers.users.find(u => u.email === 'admin@ubatuba.gov.br');
    
    if (!adminAuthUser) {
      console.error('Usuário admin@ubatuba.gov.br não encontrado em auth.users');
      return;
    }
    
    console.log('Usuário admin@ubatuba.gov.br encontrado:', adminAuthUser.id);
    
    // Atualizar o email para admin@ubanews.com
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminAuthUser.id,
      { 
        email: 'admin@ubanews.com',
        password: 'admin123'
      }
    );
    
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError.message);
      return;
    }
    
    console.log('Email atualizado para admin@ubanews.com');
    
    // Atualizar também na tabela admin_users
    const { error: dbUpdateError } = await supabase
      .from('admin_users')
      .update({ email: 'admin@ubanews.com' })
      .eq('email', 'admin@ubatuba.gov.br');
    
    if (dbUpdateError) {
      console.error('Erro ao atualizar admin_users:', dbUpdateError.message);
      return;
    }
    
    console.log('Tabela admin_users atualizada');
    
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
      
      // Buscar dados do usuário em admin_users
      const { data: adminData, error: adminDataError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('email', loginData.user.email)
        .single();
      
      if (adminDataError) {
        console.error('Erro ao buscar dados do admin:', adminDataError.message);
      } else {
        console.log('Dados do admin encontrados:', adminData);
      }
      
      // Fazer logout
      await supabaseClient.auth.signOut();
      console.log('Logout realizado com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

syncAdminUser();