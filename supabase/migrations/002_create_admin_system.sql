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
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_news_updated_at BEFORE UPDATE ON admin_news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_approvals_updated_at BEFORE UPDATE ON news_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar versão automática ao editar notícia
CREATE OR REPLACE FUNCTION create_news_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar versão apenas se o conteúdo mudou
    IF OLD.title != NEW.title OR OLD.content != NEW.content OR OLD.excerpt != NEW.excerpt THEN
        INSERT INTO news_versions (news_id, content_snapshot, version_note, created_by)
        VALUES (
            OLD.id,
            jsonb_build_object(
                'title', OLD.title,
                'content', OLD.content,
                'excerpt', OLD.excerpt,
                'category', OLD.category,
                'tags', OLD.tags,
                'featured_image', OLD.featured_image,
                'status', OLD.status
            ),
            'Versão automática criada na edição',
            NEW.author_id
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar versões automáticas
CREATE TRIGGER create_news_version_trigger 
    BEFORE UPDATE ON admin_news 
    FOR EACH ROW 
    EXECUTE FUNCTION create_news_version();

-- Função para log de auditoria
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    action_val VARCHAR(100);
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    -- Determinar o user_id baseado na tabela
    IF TG_TABLE_NAME = 'admin_users' THEN
        user_id_val := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'admin_news' THEN
        user_id_val := COALESCE(NEW.author_id, OLD.author_id);
    ELSE
        user_id_val := auth.uid();
    END IF;
    
    -- Determinar a ação
    IF TG_OP = 'INSERT' THEN
        action_val := 'CREATE';
        new_vals := to_jsonb(NEW);
        old_vals := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_val := 'UPDATE';
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_val := 'DELETE';
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;
    
    -- Inserir no log de auditoria
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        created_at
    ) VALUES (
        user_id_val,
        action_val,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_vals,
        new_vals,
        inet_client_addr(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers para auditoria
CREATE TRIGGER audit_admin_users AFTER INSERT OR UPDATE OR DELETE ON admin_users FOR EACH ROW EXECUTE FUNCTION log_admin_action();
CREATE TRIGGER audit_admin_news AFTER INSERT OR UPDATE OR DELETE ON admin_news FOR EACH ROW EXECUTE FUNCTION log_admin_action();
CREATE TRIGGER audit_news_approvals AFTER INSERT OR UPDATE OR DELETE ON news_approvals FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Habilitar RLS (Row Level Security)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admin_users
CREATE POLICY "Users can view own data" ON admin_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

CREATE POLICY "Admins can manage users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Políticas RLS para admin_news
CREATE POLICY "Users can view accessible news" ON admin_news
    FOR SELECT USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

CREATE POLICY "Users can insert news" ON admin_news
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        ) AND author_id = auth.uid()
    );

CREATE POLICY "Users can update own news or admins/editors can update any" ON admin_news
    FOR UPDATE USING (
        author_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

CREATE POLICY "Only admins can delete news" ON admin_news
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Políticas RLS para news_approvals
CREATE POLICY "Editors and admins can manage approvals" ON news_approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
        )
    );

-- Políticas RLS para news_versions
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


-- Comentários para documentação
COMMENT ON TABLE admin_users IS 'Usuários do sistema administrativo';
COMMENT ON TABLE admin_news IS 'Notícias gerenciadas pelo sistema administrativo';
COMMENT ON TABLE news_approvals IS 'Sistema de aprovação de notícias';
COMMENT ON TABLE news_versions IS 'Controle de versões das notícias';