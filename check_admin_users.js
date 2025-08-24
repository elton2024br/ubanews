import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Não configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Verificando usuários administrativos...');
    
    // Buscar todos os usuários administrativos
    const { data: allUsers, error: allError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar usuários:', allError);
      return;
    }
    
    console.log(`📊 Total de usuários encontrados: ${allUsers?.length || 0}`);
    
    if (allUsers && allUsers.length > 0) {
      console.log('\n👥 Lista de usuários:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.full_name} (${user.email})`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Ativo: ${user.is_active ? '✅ Sim' : '❌ Não'}`);
        console.log(`   - 2FA: ${user.two_factor_enabled ? '✅ Habilitado' : '❌ Desabilitado'}`);
        console.log(`   - Último login: ${user.last_login_at || 'Nunca'}`);
        console.log(`   - Criado em: ${user.created_at}`);
        console.log('');
      });
      
      // Verificar usuários ativos
      const activeUsers = allUsers.filter(user => user.is_active);
      console.log(`✅ Usuários ativos: ${activeUsers.length}`);
      
      if (activeUsers.length === 0) {
        console.log('⚠️ PROBLEMA: Nenhum usuário administrativo está ativo!');
        console.log('💡 Solução: Ativar pelo menos um usuário executando:');
        console.log('UPDATE admin_users SET is_active = true WHERE email = \'admin@ubanews.com\';');
      }
      
    } else {
      console.log('❌ Nenhum usuário administrativo encontrado!');
      console.log('💡 Execute o script simple_admin_insert.sql para criar usuários.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAdminUsers();