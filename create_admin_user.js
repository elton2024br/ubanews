import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5NzkwNCwiZXhwIjoyMDcwNzczOTA0fQ.IvA0k2wf9Gw7yayV19Ru1HT4kfaprepGWyYZumLfNQ4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('Verificando usuário admin@ubanews.com...');
    
    // Primeiro, verificar se o usuário já existe
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Erro ao listar usuários:', listError.message);
      return;
    }
    
    let authUser;
    const existingUser = users.users.find(u => u.email === 'admin@ubanews.com');
    
    if (existingUser) {
      console.log('Usuário já existe, atualizando senha...');
      
      // Atualizar senha
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: 'admin123' }
      );
      
      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError.message);
        return;
      }
      
      authUser = updateData;
      console.log('Senha atualizada para:', authUser.user.email);
    } else {
      console.log('Criando novo usuário...');
      
      // Criar usuário no auth.users
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@ubanews.com',
        password: 'admin123',
        email_confirm: true
      });
      
      if (createError) {
        console.error('Erro ao criar usuário no auth:', createError.message);
        return;
      }
      
      authUser = createData;
      console.log('Usuário criado no auth.users:', authUser.user.email);
    }

    // Verificar se já existe na tabela admin_users
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@ubanews.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar admin_users:', checkError.message);
      return;
    }

    if (!existingAdmin) {
      // Inserir na tabela admin_users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email: 'admin@ubanews.com',
          full_name: 'Administrador Sistema',
          role: 'admin',
          is_active: true,
          two_factor_enabled: false
        })
        .select()
        .single();

      if (adminError) {
        console.error('Erro ao inserir em admin_users:', adminError.message);
        return;
      }

      console.log('Usuário inserido em admin_users:', adminData.email);
    } else {
      console.log('Usuário já existe em admin_users:', existingAdmin.email);
    }

    console.log('Usuário admin@ubanews.com criado com sucesso!');

  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

createAdminUser();