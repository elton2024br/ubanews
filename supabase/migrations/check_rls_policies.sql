-- Verificar e ajustar políticas RLS para tabelas administrativas

-- Verificar se RLS está habilitado
SELECT 'Status RLS:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'admin_news');

-- Verificar políticas existentes
SELECT 'Políticas existentes:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'admin_news');

-- Temporariamente desabilitar RLS para inserir dados
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_news DISABLE ROW LEVEL SECURITY;

-- Inserir dados diretamente
INSERT INTO admin_users (id, email, full_name, role, is_active, two_factor_enabled, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin@ubanews.com', 'Administrador Principal', 'admin', true, false, NOW(), NOW()),
  (gen_random_uuid(), 'editor@ubanews.com', 'Editor de Conteúdo', 'editor', true, false, NOW(), NOW()),
  (gen_random_uuid(), 'columnist@ubanews.com', 'Colunista Principal', 'columnist', true, false, NOW(), NOW()),
  (gen_random_uuid(), 'reporter@ubanews.com', 'Repórter Local', 'editor', true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Inserir notícias administrativas
INSERT INTO admin_news (id, title, content, excerpt, category, tags, featured_image, status, author_id, publish_date, view_count, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'Primeira Notícia Administrativa',
    'Este é o conteúdo completo da primeira notícia administrativa. Aqui temos informações detalhadas sobre eventos importantes da cidade de Ubatuba.',
    'Resumo da primeira notícia administrativa sobre eventos importantes.',
    'Administração',
    ARRAY['admin', 'teste', 'ubatuba'],
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=400&fit=crop',
    'published',
    (SELECT id FROM admin_users WHERE email = 'admin@ubanews.com' LIMIT 1),
    NOW() - INTERVAL '1 day',
    150,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    'Segunda Notícia Administrativa',
    'Conteúdo da segunda notícia administrativa com informações sobre melhorias na infraestrutura da cidade.',
    'Resumo sobre melhorias na infraestrutura urbana.',
    'Infraestrutura',
    ARRAY['infraestrutura', 'melhorias', 'cidade'],
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop',
    'published',
    (SELECT id FROM admin_users WHERE email = 'editor@ubanews.com' LIMIT 1),
    NOW() - INTERVAL '3 hours',
    89,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 hours'
  ),
  (
    gen_random_uuid(),
    'Terceira Notícia - Rascunho',
    'Esta é uma notícia em rascunho que ainda está sendo elaborada pela equipe editorial.',
    'Notícia em desenvolvimento sobre novos projetos.',
    'Projetos',
    ARRAY['projetos', 'desenvolvimento', 'futuro'],
    NULL,
    'draft',
    (SELECT id FROM admin_users WHERE email = 'columnist@ubanews.com' LIMIT 1),
    NULL,
    0,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '1 hour'
  );

-- Reabilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_news ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para usuários autenticados
DROP POLICY IF EXISTS "admin_users_authenticated_access" ON admin_users;
CREATE POLICY "admin_users_authenticated_access" ON admin_users
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_news_authenticated_access" ON admin_news;
CREATE POLICY "admin_news_authenticated_access" ON admin_news
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verificar se os dados foram inseridos
SELECT 'Contagem final:' as info;
SELECT 'admin_users' as tabela, COUNT(*) as total FROM admin_users
UNION ALL
SELECT 'admin_news' as tabela, COUNT(*) as total FROM admin_news;

-- Mostrar dados inseridos
SELECT 'Usuários inseridos:' as info;
SELECT email, full_name, role FROM admin_users;

SELECT 'Notícias inseridas:' as info;
SELECT title, status, category FROM admin_news;