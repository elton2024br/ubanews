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
    
    // Primeiro, vamos atualizar o email do usuário colunista@ubanews.com para admin@ubanews.com
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao listar usuários:', authError.message);
      return;
    }
    
    const colunistaUser = authUsers.users.find(u => u.email === 'colunista@ubanews.com');
    
    if (colunistaUser) {
      console.log('Encontrado usuário colunista@ubanews.com, atualizando para admin@ubanews.com...');
      
      // Atualizar email do usuário
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        colunistaUser.id,
        { 
          email: 'admin@ubanews.com',
          password: 'admin123'
        }
      );
      
      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError.message);
        return;
      }
      
      console.log('Usuário atualizado com sucesso!');
      
      // Atualizar também na tabela admin_users
      const { error: dbUpdateError } = await supabase
        .from('admin_users')
        .update({ 
          email: 'admin@ubanews.com',
          role: 'admin',
          full_name: 'Administrador Sistema'
        })
        .eq('email', 'columnist@ubanews.com');
      
      if (dbUpdateError) {
        console.log('Usuário já existe em admin_users com email correto');
      } else {
        console.log('Tabela admin_users atualizada!');
      }
    } else {
      console.log('Usuário colunista@ubanews.com não encontrado.');
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
      
      // Buscar dados do usuário na tabela admin_users
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