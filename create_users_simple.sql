-- Script simplificado para criar usuários de teste
-- Usar com supabase SQL ou API REST

-- Inserir usuários na tabela auth.users usando uma abordagem mais simples
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  email,
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now()
FROM (
  VALUES 
    ('admin@ubanews.com'),
    ('editor@ubanews.com'),
    ('colunista@ubanews.com')
) AS users(email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE auth.users.email = users.email
);

-- Verificar usuários criados
SELECT email, created_at FROM auth.users 
WHERE email IN ('admin@ubanews.com', 'editor@ubanews.com', 'colunista@ubanews.com');