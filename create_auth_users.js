import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://bejqfsqpvpxtqszeyyfo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlanFmc3FwdnB4dHFzemV5eWZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5NzkwNCwiZXhwIjoyMDcwNzczOTA0fQ.IvA0k2wf9Gw7yayV19Ru1HT4kfaprepGWyYZumLfNQ4';

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usuários para criar
const usersToCreate = [
  {
    email: 'admin@ubanews.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'Administrador Sistema'
  },
  {
    email: 'editor@ubanews.com',
    password: 'admin123',
    role: 'editor',
    full_name: 'Editor Chefe'
  },
  {
    email: 'colunista@ubanews.com',
    password: 'admin123',
    role: 'columnist',
    full_name: 'Colunista Principal'
  },
  {
    email: 'reporter@ubanews.com',
    password: 'admin123',
    role: 'reporter',
    full_name: 'Repórter Sênior'
  }
];

async function createAuthUsers() {
  console.log('Iniciando criação de usuários de teste...');
  
  for (const user of usersToCreate) {
    try {
      console.log(`\nCriando usuário: ${user.email}`);
      
      // Criar usuário no auth.users usando Admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error(`Erro ao criar usuário ${user.email}:`, authError.message);
        continue;
      }
      
      console.log(`Usuário ${user.email} criado com sucesso no auth.users`);
      console.log(`ID do usuário: ${authUser.user.id}`);
      
      // Inserir dados na tabela admin_users
      const { error: adminError } = await supabase
        .from('admin_users')
        .upsert({
          id: authUser.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: true,
          two_factor_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (adminError) {
        console.error(`Erro ao inserir dados em admin_users para ${user.email}:`, adminError.message);
      } else {
        console.log(`Dados inseridos em admin_users para ${user.email}`);
      }
      
    } catch (error) {
      console.error(`Erro geral ao processar usuário ${user.email}:`, error.message);
    }
  }
  
  console.log('\nProcesso de criação de usuários concluído!');
  
  // Verificar usuários criados
  console.log('\nVerificando usuários criados...');
  const { data: adminUsers, error: fetchError } = await supabase
    .from('admin_users')
    .select('*')
    .order('email');
  
  if (fetchError) {
    console.error('Erro ao buscar usuários:', fetchError.message);
  } else {
    console.log('Usuários na tabela admin_users:');
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Ativo: ${user.is_active}`);
    });
  }
}

// Executar função
createAuthUsers().catch(console.error);