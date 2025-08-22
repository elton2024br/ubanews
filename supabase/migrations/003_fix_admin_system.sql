-- Remover triggers e funções que causaram conflito
DROP TRIGGER IF EXISTS audit_admin_users ON admin_users;
DROP TRIGGER IF EXISTS audit_admin_news ON admin_news;
DROP TRIGGER IF EXISTS audit_news_approvals ON news_approvals;
DROP FUNCTION IF EXISTS log_admin_action();

-- Criar função de auditoria compatível com a tabela audit_logs existente
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val UUID;
    action_val TEXT;
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    -- Usar auth.uid() que é compatível com auth.users
    user_id_val := auth.uid();
    
    -- Se não há usuário autenticado, não fazer log
    IF user_id_val IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Determinar a ação
    IF TG_OP = 'INSERT' THEN
        action_val := 'CREATE_' || TG_TABLE_NAME;
        new_vals := to_jsonb(NEW);
        old_vals := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_val := 'UPDATE_' || TG_TABLE_NAME;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        action_val := 'DELETE_' || TG_TABLE_NAME;
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;
    
    -- Inserir no log de auditoria existente
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
EXCEPTION
    WHEN OTHERS THEN
        -- Se houver erro no log, não falhar a operação principal
        RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Recriar triggers para auditoria
CREATE TRIGGER audit_admin_users 
    AFTER INSERT OR UPDATE OR DELETE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_admin_news 
    AFTER INSERT OR UPDATE OR DELETE ON admin_news 
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

CREATE TRIGGER audit_news_approvals 
    AFTER INSERT OR UPDATE OR DELETE ON news_approvals 
    FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Conceder permissões necessárias para as tabelas
GRANT SELECT ON admin_users TO anon, authenticated;
GRANT ALL PRIVILEGES ON admin_users TO authenticated;

GRANT SELECT ON admin_news TO anon, authenticated;
GRANT ALL PRIVILEGES ON admin_news TO authenticated;

GRANT SELECT ON news_approvals TO anon, authenticated;
GRANT ALL PRIVILEGES ON news_approvals TO authenticated;

GRANT SELECT ON news_versions TO anon, authenticated;
GRANT ALL PRIVILEGES ON news_versions TO authenticated;

-- Inserir usuários de exemplo novamente (caso tenham falhado antes)
INSERT INTO admin_users (email, full_name, role, is_active, two_factor_enabled)
VALUES 
    ('admin@ubanews.com', 'Administrador Sistema', 'admin', true, false),
    ('editor@ubanews.com', 'Editor Chefe', 'editor', true, false),
    ('colunista@ubanews.com', 'João Colunista', 'columnist', true, false)
ON CONFLICT (email) DO NOTHING;

-- Inserir algumas notícias de exemplo
INSERT INTO admin_news (title, content, excerpt, category, tags, status, author_id)
SELECT 
    'Notícia de Exemplo 1',
    '<p>Este é o conteúdo completo da primeira notícia de exemplo. Aqui temos um texto mais longo para demonstrar como o sistema funciona.</p>',
    'Esta é uma notícia de exemplo para testar o sistema administrativo.',
    'Geral',
    ARRAY['exemplo', 'teste', 'sistema'],
    'published',
    id
FROM admin_users 
WHERE email = 'admin@ubanews.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO admin_news (title, content, excerpt, category, tags, status, author_id)
SELECT 
    'Notícia de Exemplo 2',
    '<p>Esta é a segunda notícia de exemplo, ainda em rascunho para demonstrar o workflow de aprovação.</p>',
    'Segunda notícia de exemplo em status de rascunho.',
    'Tecnologia',
    ARRAY['exemplo', 'rascunho', 'workflow'],
    'draft',
    id
FROM admin_users 
WHERE email = 'colunista@ubanews.com'
LIMIT 1
ON CONFLICT DO NOTHING;