-- Criar usuário administrativo no sistema de autenticação
-- Este script deve ser executado com privilégios de administrador

-- Primeiro, vamos verificar se o usuário já existe
DO $$
BEGIN
    -- Verificar se o usuário já existe na tabela auth.users
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'admin@ubanews.com'
    ) THEN
        -- Inserir usuário na tabela auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@ubanews.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Usuário admin@ubanews.com criado com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário admin@ubanews.com já existe!';
    END IF;
END $$;

-- Verificar se o usuário foi criado corretamente
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admin@ubanews.com';

-- Garantir que o usuário admin_users está sincronizado
INSERT INTO admin_users (email, full_name, role, is_active, created_at, updated_at)
SELECT 
    'admin@ubanews.com',
    'Administrador Principal',
    'admin',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM admin_users WHERE email = 'admin@ubanews.com'
);

-- Verificar o resultado
SELECT 
    au.email,
    au.full_name,
    au.role,
    au.is_active,
    CASE 
        WHEN u.email IS NOT NULL THEN 'Existe no Auth'
        ELSE 'NÃO existe no Auth'
    END as auth_status
FROM admin_users au
LEFT JOIN auth.users u ON au.email = u.email
WHERE au.email = 'admin@ubanews.com';