import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Script de debug para verificar variáveis de ambiente do Supabase
console.log('=== DEBUG SUPABASE ENVIRONMENT ===');

// 1. Carregar dotenv
dotenv.config();

// 2. Ler arquivo .env diretamente
try {
  const envContent = readFileSync('.env', 'utf8');
  console.log('\n=== CONTEÚDO DO ARQUIVO .ENV ===');
  const envLines = envContent.split('\n').filter(line => line.includes('SUPABASE'));
  envLines.forEach(line => {
    if (line.includes('ANON_KEY')) {
      console.log(line.split('=')[0] + '=DEFINIDA');
    } else {
      console.log(line);
    }
  });
} catch (error) {
  console.log('\nErro ao ler .env:', error.message);
}

// 3. Verificar variáveis de ambiente após dotenv
console.log('\n=== VARIÁVEIS APÓS DOTENV ===');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');

// 4. Verificar todas as variáveis que começam com VITE_
console.log('\n=== TODAS AS VARIÁVEIS VITE_ ===');
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    console.log(`${key}:`, key.includes('KEY') ? 'DEFINIDA' : process.env[key]);
  });

// 5. Testar criação do cliente Supabase
try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('\n=== TESTE CLIENTE SUPABASE ===');
  console.log('URL válida:', !!supabaseUrl && supabaseUrl.startsWith('https://'));
  console.log('Key válida:', !!supabaseKey && supabaseKey.length > 20);
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Cliente criado com sucesso!');
    
    // Teste simples de conexão
    const { data, error } = await supabase
      .from('admin_users')
      .select('count');
      
    if (error) {
      console.log('\nErro na consulta:', error);
    } else {
      console.log('\nConexão bem-sucedida! Dados:', data);
    }
  } else {
    console.log('Credenciais inválidas - não é possível criar cliente');
  }
} catch (error) {
  console.log('\nErro ao testar Supabase:', error.message);
}

console.log('\n=== FIM DEBUG ===');