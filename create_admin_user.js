import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env');
  process.exit(1);
}

// Criar cliente Supabase com service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔧 Criando usuário administrativo no Supabase Auth...');
  
  const adminEmail = 'admin@ubatuba.gov.br';
  const adminPassword = 'admin123';
  
  try {
    // 1. Criar usuário no Supabase Auth
    console.log('📝 Criando usuário no Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true // Confirmar email automaticamente
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Usuário já existe no Auth, continuando...');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Usuário criado no Auth:', authUser.user?.email);
    }
    
    // 2. Verificar se o usuário já existe na tabela admin_users
    console.log('🔍 Verificando usuário na tabela admin_users...');
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      throw checkError;
    }
    
    if (existingUser) {
      console.log('ℹ️  Usuário já existe na tabela admin_users');
      console.log('📊 Dados do usuário:', {
        id: existingUser.id,
        email: existingUser.email,
        full_name: existingUser.full_name,
        role: existingUser.role,
        status: existingUser.status
      });
    } else {
      // 3. Criar registro na tabela admin_users
      console.log('📝 Criando registro na tabela admin_users...');
      const { data: adminUserData, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          full_name: 'Administrador do Sistema',
          role: 'admin',
          status: 'active',
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_news', 'manage_system']
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('✅ Usuário criado na tabela admin_users:', {
        id: adminUserData.id,
        email: adminUserData.email,
        full_name: adminUserData.full_name,
        role: adminUserData.role,
        status: adminUserData.status
      });
    }
    
    console.log('\n🎉 Usuário administrativo configurado com sucesso!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Senha:', adminPassword);
    console.log('🌐 URL de login: http://localhost:5173/admin/login');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrativo:', error);
    process.exit(1);
  }
}

// Executar a função
createAdminUser();