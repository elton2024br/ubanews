-- Verificar se os usuários foram criados no auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    role
FROM auth.users 
WHERE email IN (
    'admin@ubanews.com',
    'editor@ubanews.com',
    'columnist@ubanews.com',
    'reporter@ubanews.com'
)
ORDER BY email;

-- Verificar também a tabela admin_users
SELECT 
    id,
    email,
    full_name,
    role,
    is_active
FROM admin_users
ORDER BY email;