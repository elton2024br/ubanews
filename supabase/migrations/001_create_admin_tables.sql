-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de usuários administrativos
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'columnist' CHECK (role IN ('admin', 'editor', 'columnist')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  phone VARCHAR(20),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de permissões
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  granted_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notícias administrativas
CREATE TABLE admin_news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category VARCHAR(100) NOT NULL,
  tags TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'pending_approval')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  author_id UUID REFERENCES admin_users(id) NOT NULL,
  editor_id UUID REFERENCES admin_users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_enabled BOOLEAN DEFAULT TRUE,
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aprovações de notícias
CREATE TABLE news_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID REFERENCES admin_news(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES admin_users(id) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de versões de notícias
CREATE TABLE news_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID REFERENCES admin_news(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  changes_summary TEXT,
  created_by UUID REFERENCES admin_users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_permissions_user_id ON permissions(user_id);
CREATE INDEX idx_admin_news_author_id ON admin_news(author_id);
CREATE INDEX idx_admin_news_status ON admin_news(status);
CREATE INDEX idx_admin_news_category ON admin_news(category);
CREATE INDEX idx_admin_news_published_at ON admin_news(published_at);
CREATE INDEX idx_admin_news_slug ON admin_news(slug);
CREATE INDEX idx_news_approvals_news_id ON news_approvals(news_id);
CREATE INDEX idx_news_approvals_reviewer_id ON news_approvals(reviewer_id);
CREATE INDEX idx_news_versions_news_id ON news_versions(news_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_news_updated_at BEFORE UPDATE ON admin_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar versão automática das notícias
CREATE OR REPLACE FUNCTION create_news_version()
RETURNS TRIGGER AS $$
DECLARE
    version_num INTEGER;
BEGIN
    -- Obter próximo número de versão
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO version_num
    FROM news_versions WHERE news_id = NEW.id;
    
    -- Criar nova versão
    INSERT INTO news_versions (news_id, version_number, title, content, changes_summary, created_by)
    VALUES (NEW.id, version_num, NEW.title, NEW.content, 'Versão criada automaticamente', NEW.author_id);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para versioning automático
CREATE TRIGGER create_news_version_trigger AFTER UPDATE ON admin_news
    FOR EACH ROW WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
    EXECUTE FUNCTION create_news_version();

-- Função para logs de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    action_type VARCHAR(10);
BEGIN
    -- Determinar tipo de ação
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
        action_type = 'DELETE';
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        action_type = 'UPDATE';
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
        action_type = 'INSERT';
    END IF;
    
    -- Inserir log de auditoria
    INSERT INTO audit_logs (action, resource_type, resource_id, old_values, new_values)
    VALUES (
        action_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        old_data,
        new_data
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers de auditoria
CREATE TRIGGER audit_admin_users AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_admin_news AFTER INSERT OR UPDATE OR DELETE ON admin_news
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_news_approvals AFTER INSERT OR UPDATE OR DELETE ON news_approvals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();