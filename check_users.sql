-- Verificar usuários na tabela admin_users
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  two_factor_enabled,
  created_at
FROM admin_users
ORDER BY created_at DESC;

-- Verificar usuários na tabela auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;