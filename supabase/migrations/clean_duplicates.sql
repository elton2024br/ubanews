-- Remover duplicatas da tabela admin_users, mantendo apenas o registro mais recente
WITH duplicates AS (
  SELECT id, email, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM admin_users
)
DELETE FROM admin_users 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verificar se ainda há duplicatas
SELECT email, COUNT(*) as count
FROM admin_users 
GROUP BY email
HAVING COUNT(*) > 1;

-- Listar todos os usuários restantes
SELECT id, email, full_name, role, is_active, created_at
FROM admin_users 
ORDER BY email, created_at;