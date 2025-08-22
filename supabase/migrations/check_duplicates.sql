-- Verificar duplicatas na tabela admin_users
SELECT email, COUNT(*) as count
FROM admin_users 
WHERE email = 'colunista@ubanews.com'
GROUP BY email
HAVING COUNT(*) > 1;

-- Listar todos os registros para colunista@ubanews.com
SELECT id, email, full_name, role, is_active, created_at
FROM admin_users 
WHERE email = 'colunista@ubanews.com'
ORDER BY created_at;

-- Verificar todos os emails duplicados
SELECT email, COUNT(*) as count
FROM admin_users 
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;