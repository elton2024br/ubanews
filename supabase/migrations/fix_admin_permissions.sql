-- Verificar e corrigir permissões das tabelas administrativas

-- Verificar permissões atuais
SELECT 'Permissões atuais:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_users', 'admin_news') 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Conceder permissões para a tabela admin_users
GRANT SELECT ON admin_users TO authenticated;
GRANT INSERT ON admin_users TO authenticated;
GRANT UPDATE ON admin_users TO authenticated;
GRANT DELETE ON admin_users TO authenticated;

-- Conceder permissões para a tabela admin_news
GRANT SELECT ON admin_news TO authenticated;
GRANT INSERT ON admin_news TO authenticated;
GRANT UPDATE ON admin_news TO authenticated;
GRANT DELETE ON admin_news TO authenticated;

-- Conceder permissões básicas de leitura para anon (se necessário)
GRANT SELECT ON admin_users TO anon;
GRANT SELECT ON admin_news TO anon;

-- Verificar se os dados existem nas tabelas
SELECT 'Contagem de registros:' as info;
SELECT 'admin_users' as tabela, COUNT(*) as total FROM admin_users
UNION ALL
SELECT 'admin_news' as tabela, COUNT(*) as total FROM admin_news;

-- Mostrar alguns dados se existirem
SELECT 'Dados admin_users:' as info;
SELECT email, full_name, role, is_active FROM admin_users LIMIT 5;

SELECT 'Dados admin_news:' as info;
SELECT title, status, category, author_id FROM admin_news LIMIT 5;

-- Verificar permissões após as alterações
SELECT 'Permissões após alterações:' as info;
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_users', 'admin_news') 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;