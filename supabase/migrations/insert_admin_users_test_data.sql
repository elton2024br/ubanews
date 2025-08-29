-- Inserir dados de teste para admin_users
-- Esta migração adiciona usuários administrativos de teste para o sistema

-- Inserir usuários administrativos de teste
INSERT INTO admin_users (
  email,
  full_name,
  role,
  is_active,
  two_factor_enabled
) VALUES 
  ('admin@ubanews.com', 'Administrador Principal', 'admin', true, false),
  ('editor@ubanews.com', 'Editor Chefe', 'editor', true, false),
  ('colunista@ubanews.com', 'Colunista Senior', 'columnist', true, false)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verificar se os dados foram inseridos
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM admin_users
ORDER BY created_at DESC;