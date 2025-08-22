-- Criar usuários administrativos padrão para o sistema UbaNews
-- Este script insere os usuários básicos necessários para o funcionamento do sistema

-- Inserir usuário administrador principal
INSERT INTO admin_users (
  email,
  full_name,
  role,
  is_active,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  'admin@ubanews.com',
  'Administrador UbaNews',
  'admin',
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário editor padrão
INSERT INTO admin_users (
  email,
  full_name,
  role,
  is_active,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  'editor@ubanews.com',
  'Editor UbaNews',
  'editor',
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário colunista padrão
INSERT INTO admin_users (
  email,
  full_name,
  role,
  is_active,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  'columnist@ubanews.com',
  'Colunista UbaNews',
  'columnist',
  true,
  false,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar se os usuários foram criados com sucesso
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM admin_users 
WHERE email IN ('admin@ubanews.com', 'editor@ubanews.com', 'columnist@ubanews.com')
ORDER BY role, email;