-- Corrigir permissões da tabela admin_users
-- Esta migração garante que os roles anon e authenticated tenham acesso adequado

-- Verificar se RLS está habilitado na tabela admin_users
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- Desabilitar RLS temporariamente para permitir acesso de leitura
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Garantir que o role anon tenha permissão de SELECT
GRANT SELECT ON public.admin_users TO anon;

-- Garantir que o role authenticated tenha permissões completas
GRANT ALL PRIVILEGES ON public.admin_users TO authenticated;

-- Verificar as permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'admin_users' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Testar se os dados estão acessíveis
SELECT COUNT(*) as total_admin_users FROM public.admin_users;