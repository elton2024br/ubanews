-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários administrativos
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'columnist')),
    is_active BOOLEAN DEFAULT true,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance na tabela admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Tabela de notícias administrativas
CREATE TABLE IF NOT EXISTS admin_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    featured_image TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
    author_id UUID NOT NULL REFERENCES admin_users(id),
    publish_date TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance na tabela admin_news
CREATE INDEX IF NOT EXISTS idx_admin_news_status ON admin_news(status);
CREATE INDEX IF NOT EXISTS idx_admin_news_author ON admin_news(author_id);
CREATE INDEX IF NOT EXISTS idx_admin_news_category ON admin_news(category);
CREATE INDEX IF NOT EXISTS idx_admin_news_publish_date ON admin_news(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_news_created_at ON admin_news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_news_search ON admin_news USING gin(to_tsvector('portuguese', title || ' ' || content));

-- Tabela de aprovações de notícias
CREATE TABLE IF NOT EXISTS news_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES admin_news(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES admin_users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    feedback TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tabela news_approvals
CREATE INDEX IF NOT EXISTS idx_news_approvals_news_id ON news_approvals(news_id);
CREATE INDEX IF NOT EXISTS idx_news_approvals_reviewer ON news_approvals(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_news_approvals_status ON news_approvals(status);

-- Tabela de versões de notícias
CREATE TABLE IF NOT EXISTS news_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES admin_news(id) ON DELETE CASCADE,
    content_snapshot JSONB NOT NULL,
    version_note TEXT,
    created_by UUID NOT NULL REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tabela news_versions
CREATE INDEX IF NOT EXISTS idx_news_versions_news_id ON news_versions(news_id);
CREATE INDEX IF NOT EXISTS idx_news_versions_created_at ON news_versions(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_news_updated_at ON admin_news;
CREATE TRIGGER update_admin_news_updated_at 
    BEFORE UPDATE ON admin_news 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_news_approvals_updated_at ON news_approvals;
CREATE TRIGGER update_news_approvals_updated_at 
    BEFORE UPDATE ON news_approvals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admin_users
DROP POLICY IF EXISTS "Users can view own data" ON admin_users;
CREATE POLICY "Users can view own data" ON admin_users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON admin_users;
CREATE POLICY "Admins can view all users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins can manage users" ON admin_users;
CREATE POLICY "Admins can manage users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Políticas RLS para admin_news
DROP POLICY IF EXISTS "Users can view accessible news" ON admin_news;
CREATE POLICY "Users can view accessible news" ON admin_news
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Users can insert news" ON admin_news;
CREATE POLICY "Users can insert news" ON admin_news
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        ) AND author_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can update own news or admins/editors can update any" ON admin_news;
CREATE POLICY "Users can update own news or admins/editors can update any" ON admin_news
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Only admins can delete news" ON admin_news;
CREATE POLICY "Only admins can delete news" ON admin_news
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Políticas RLS para news_approvals
DROP POLICY IF EXISTS "Editors and admins can manage approvals" ON news_approvals;
CREATE POLICY "Editors and admins can manage approvals" ON news_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

-- Políticas RLS para news_versions
DROP POLICY IF EXISTS "Users can view versions of accessible news" ON news_versions;
CREATE POLICY "Users can view versions of accessible news" ON news_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_news 
            WHERE id = news_versions.news_id AND (
                author_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM admin_users 
                    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
                )
            )
        )
    );

-- Conceder permissões necessárias
GRANT SELECT ON admin_users TO anon, authenticated;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

GRANT SELECT ON admin_news TO anon, authenticated;
GRANT ALL PRIVILEGES ON admin_news TO authenticated;

GRANT SELECT ON news_approvals TO anon, authenticated;
GRANT ALL PRIVILEGES ON news_approvals TO authenticated;

GRANT SELECT ON news_versions TO anon, authenticated;
GRANT ALL PRIVILEGES ON news_versions TO authenticated;

-- Inserir usuários de exemplo
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled)
VALUES 
    ('admin@ubanews.com', 'Administrador Sistema', 'admin', true, false),
    ('editor@ubanews.com', 'Editor Chefe', 'editor', true, false),
    ('colunista@ubanews.com', 'João Colunista', 'columnist', true, false)
ON CONFLICT (email) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE admin_users IS 'Usuários do sistema administrativo';
COMMENT ON TABLE admin_news IS 'Notícias gerenciadas pelo sistema administrativo';
COMMENT ON TABLE news_approvals IS 'Sistema de aprovação de notícias';
COMMENT ON TABLE news_versions IS 'Controle de versões das notícias';