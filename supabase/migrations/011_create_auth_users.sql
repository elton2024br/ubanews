-- Criar usuários de teste no sistema de autenticação do Supabase
-- Versão simplificada sem ON CONFLICT

-- Primeiro, vamos verificar se os usuários já existem e removê-los se necessário
DELETE FROM auth.users WHERE email IN (
    'admin@ubanews.com',
    'editor@ubanews.com', 
    'columnist@ubanews.com',
    'reporter@ubanews.com'
);

-- Inserir usuários no auth.users (sistema de autenticação do Supabase)
-- Usuário Admin
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@ubanews.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
);

-- Usuário Editor
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'editor@ubanews.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
);

-- Usuário Colunista
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'columnist@ubanews.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
);

-- Usuário Repórter
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'reporter@ubanews.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
);

-- Atualizar a tabela admin_users para usar os mesmos IDs
UPDATE admin_users SET id = '550e8400-e29b-41d4-a716-446655440001'::uuid WHERE email = 'admin@ubanews.com';
UPDATE admin_users SET id = '550e8400-e29b-41d4-a716-446655440002'::uuid WHERE email = 'editor@ubanews.com';
UPDATE admin_users SET id = '550e8400-e29b-41d4-a716-446655440003'::uuid WHERE email = 'columnist@ubanews.com';
UPDATE admin_users SET id = '550e8400-e29b-41d4-a716-446655440004'::uuid WHERE email = 'reporter@ubanews.com';