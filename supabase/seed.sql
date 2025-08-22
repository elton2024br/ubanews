-- Seed data for admin users
-- Insert test admin users with different roles

-- Admin user
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled, created_at, updated_at) VALUES 
('admin@ubanews.com', 'Administrador Principal', 'admin', true, false, NOW(), NOW());

-- Editor user
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled, created_at, updated_at) VALUES 
('editor@ubanews.com', 'Editor de Conteúdo', 'editor', true, false, NOW(), NOW());

-- Columnist user
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled, created_at, updated_at) VALUES 
('colunista@ubanews.com', 'Colunista', 'colunist', true, false, NOW(), NOW());

-- Reporter user
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled, created_at, updated_at) VALUES 
('reporter@ubanews.com', 'Reporter', 'reporter', true, false, NOW(), NOW());

-- Create auth users (these will be created automatically when users sign up via Supabase Auth)
-- The auth.users table will be populated when users first sign in with these emails
-- The password for all test users is: admin123