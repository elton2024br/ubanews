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

async function listAllAuthUsers() {
  try {
    console.log('👥 Listando todos os usuários no sistema de autenticação...');
    
    // Buscar todos os usuários
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
      return;
    }
    
    console.log('\n📊 Total de usuários:', users.users.length);
    
    if (users.users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no sistema de autenticação');
      console.log('💡 Vamos tentar criar um usuário manualmente...');
      
      // Tentar criar usuário com dados mínimos
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test@admin.com',
        password: 'test123',
        email_confirm: true
      });
      
      if (createError) {
        console.error('❌ Erro ao criar usuário de teste:', createError.message);
        console.error('   Detalhes:', createError);
      } else {
        console.log('✅ Usuário de teste criado com sucesso!');
        console.log('   ID:', newUser.user.id);
        console.log('   Email:', newUser.user.email);
      }
      
    } else {
      console.log('\n👤 Usuários encontrados:');
      
      users.users.forEach((user, index) => {
        console.log(`\n${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}`);
        console.log(`   Provedor: ${user.app_metadata?.provider || 'email'}`);
        
        if (user.email && user.email.includes('admin')) {
          console.log('   ⭐ Este usuário parece ser administrativo!');
        }
      });
      
      // Procurar por usuários com email similar
      const adminUsers = users.users.filter(user => 
        user.email && (user.email.includes('admin') || user.email.includes('test'))
      );
      
      if (adminUsers.length > 0) {
        console.log('\n🔍 Usuários administrativos encontrados:');
        adminUsers.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`);
        });
        
        console.log('\n💡 Você pode tentar fazer login com um destes emails usando a senha padrão.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

listAllAuthUsers();