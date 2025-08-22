-- Corrigir políticas RLS que causam recursão infinita
-- Remover políticas problemáticas e criar novas sem recursão

-- Desabilitar RLS temporariamente para admin_users
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes da tabela admin_users
DROP POLICY IF EXISTS "Users can view own data" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage users" ON admin_users;

-- Reabilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples sem recursão
-- Permitir que usuários autenticados vejam todos os dados (temporário para resolver o problema)
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados façam todas as operações (temporário)
CREATE POLICY "Allow authenticated users to manage admin_users" ON admin_users
    FOR ALL USING (auth.role() = 'authenticated');

-- Comentário explicativo
COMMENT ON POLICY "Allow authenticated users to read admin_users" ON admin_users IS 
'Política temporária para resolver recursão infinita. Permite leitura para usuários autenticados.';

COMMENT ON POLICY "Allow authenticated users to manage admin_users" ON admin_users IS 
'Política temporária para resolver recursão infinita. Permite todas as operações para usuários autenticados.';