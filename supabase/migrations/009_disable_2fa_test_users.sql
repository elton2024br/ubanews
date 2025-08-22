-- Disable 2FA for all test users
-- This migration disables two-factor authentication for test users
-- allowing them to login without 2FA codes

UPDATE admin_users 
SET 
    two_factor_enabled = false,
    two_factor_secret = null,
    updated_at = now()
WHERE email IN (
    'admin@ubanews.com',
    'editor@ubanews.com', 
    'colunista@ubanews.com',
    'reporter@ubanews.com'
);

-- Verify the update was successful
SELECT email, two_factor_enabled, two_factor_secret 
FROM admin_users 
WHERE email IN (
    'admin@ubanews.com',
    'editor@ubanews.com', 
    'colunista@ubanews.com',
    'reporter@ubanews.com'
);