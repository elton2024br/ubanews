-- Limpar dados existentes e recriar com dados de exemplo

-- Limpar tabelas na ordem correta (respeitando foreign keys)
DELETE FROM news_approvals;
DELETE FROM news_versions;
DELETE FROM admin_news;
DELETE FROM audit_logs;
DELETE FROM admin_users;

-- Inserir usuários administrativos de exemplo
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled, created_at, updated_at) VALUES 
('admin@ubanews.com', 'Administrador Principal', 'admin', true, false, NOW(), NOW()),
('editor@ubanews.com', 'Editor de Conteúdo', 'editor', true, false, NOW(), NOW()),
('colunista@ubanews.com', 'Colunista', 'columnist', true, false, NOW(), NOW());

-- Inserir algumas notícias de exemplo
INSERT INTO admin_news (title, content, excerpt, author_id, status, category, tags, created_at, updated_at) 
SELECT 
    'Primeira Notícia de Teste',
    'Este é o conteúdo da primeira notícia de teste. Aqui temos um texto mais longo para demonstrar como as notícias aparecem no sistema.',
    'Resumo da primeira notícia de teste',
    au.id,
    'published',
    'geral',
    ARRAY['teste', 'exemplo'],
    NOW(),
    NOW()
FROM admin_users au WHERE au.email = 'admin@ubanews.com'
LIMIT 1;

INSERT INTO admin_news (title, content, excerpt, author_id, status, category, tags, created_at, updated_at) 
SELECT 
    'Segunda Notícia - Em Revisão',
    'Conteúdo da segunda notícia que está em processo de revisão. Esta notícia demonstra o fluxo de aprovação.',
    'Resumo da segunda notícia em revisão',
    au.id,
    'pending',
    'política',
    ARRAY['revisão', 'política'],
    NOW(),
    NOW()
FROM admin_users au WHERE au.email = 'editor@ubanews.com'
LIMIT 1;

INSERT INTO admin_news (title, content, excerpt, author_id, status, category, tags, created_at, updated_at) 
SELECT 
    'Terceira Notícia - Rascunho',
    'Esta é uma notícia em rascunho, ainda sendo elaborada pelo colunista.',
    'Resumo da terceira notícia em rascunho',
    au.id,
    'draft',
    'esportes',
    ARRAY['rascunho', 'esportes'],
    NOW(),
    NOW()
FROM admin_users au WHERE au.email = 'colunista@ubanews.com'
LIMIT 1;

-- Inserir usuários em user_profiles primeiro
INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin@ubanews.com', 'Administrador Principal', 'admin', true, NOW(), NOW()),
  (gen_random_uuid(), 'editor@ubanews.com', 'Editor de Conteúdo', 'editor', true, NOW(), NOW()),
  (gen_random_uuid(), 'reporter@ubanews.com', 'Repórter Local', 'editor', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Inserir dados na tabela news
INSERT INTO news (title, slug, content, excerpt, author_id, category, tags, status, published_at, created_at, updated_at)
VALUES 
  ('Primeira Notícia de Teste', 'primeira-noticia-teste', 'Conteúdo da primeira notícia de teste...', 'Resumo da primeira notícia', (SELECT id FROM user_profiles WHERE email = 'admin@ubanews.com' LIMIT 1), 'Política', ARRAY['teste', 'política'], 'published', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  ('Segunda Notícia de Teste', 'segunda-noticia-teste', 'Conteúdo da segunda notícia de teste...', 'Resumo da segunda notícia', (SELECT id FROM user_profiles WHERE email = 'editor@ubanews.com' LIMIT 1), 'Economia', ARRAY['teste', 'economia'], 'published', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),
  ('Terceira Notícia de Teste', 'terceira-noticia-teste', 'Conteúdo da terceira notícia de teste...', 'Resumo da terceira notícia', (SELECT id FROM user_profiles WHERE email = 'reporter@ubanews.com' LIMIT 1), 'Esportes', ARRAY['teste', 'esportes'], 'draft', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour');

-- Verificar se os dados foram inseridos
SELECT 'admin_users' as tabela, COUNT(*) as total FROM admin_users
UNION ALL
SELECT 'admin_news' as tabela, COUNT(*) as total FROM admin_news
UNION ALL
SELECT 'news' as tabela, COUNT(*) as total FROM news;