-- Sistema de Comentários Completo
-- Tabela principal de comentários
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID NOT NULL REFERENCES admin_news(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    status COMMENT_STATUS DEFAULT 'published',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de reações aos comentários
CREATE TABLE comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type REACTION_TYPE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- Tabela de denúncias de comentários
CREATE TABLE comment_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason REPORT_REASON NOT NULL,
    description TEXT,
    status REPORT_STATUS DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, reporter_id)
);

-- Tabela de moderação de comentários
CREATE TABLE comment_moderations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action MODERATION_ACTION NOT NULL,
    reason TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tipos ENUM
CREATE TYPE COMMENT_STATUS AS ENUM ('published', 'pending', 'hidden', 'deleted');
CREATE TYPE REACTION_TYPE AS ENUM ('like', 'dislike', 'love', 'laugh', 'angry', 'sad');
CREATE TYPE REPORT_REASON AS ENUM (
    'spam', 
    'harassment', 
    'hate_speech', 
    'misinformation', 
    'off_topic', 
    'inappropriate_content',
    'copyright_violation'
);
CREATE TYPE REPORT_STATUS AS ENUM ('pending', 'approved', 'rejected', 'dismissed');
CREATE TYPE MODERATION_ACTION AS ENUM (
    'approved', 
    'hidden', 
    'deleted', 
    'edited', 
    'warned', 
    'banned'
);

-- Índices para performance
CREATE INDEX idx_comments_news_id ON comments(news_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_news_created ON comments(news_id, created_at DESC);

CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE INDEX idx_comment_reactions_type ON comment_reactions(reaction_type);

CREATE INDEX idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX idx_comment_reports_reporter_id ON comment_reports(reporter_id);
CREATE INDEX idx_comment_reports_status ON comment_reports(status);
CREATE INDEX idx_comment_reports_created_at ON comment_reports(created_at DESC);

CREATE INDEX idx_comment_moderations_comment_id ON comment_moderations(comment_id);
CREATE INDEX idx_comment_moderations_moderator_id ON comment_moderations(moderator_id);
CREATE INDEX idx_comment_moderations_created_at ON comment_moderations(created_at DESC);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at_trigger
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();

-- Função para contar reações
CREATE OR REPLACE FUNCTION count_comment_reactions(comment_uuid UUID)
RETURNS TABLE(reaction_type REACTION_TYPE, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT cr.reaction_type, COUNT(*)::BIGINT
    FROM comment_reactions cr
    WHERE cr.comment_id = comment_uuid
    GROUP BY cr.reaction_type;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de um comentário
CREATE OR REPLACE FUNCTION get_comment_stats(comment_uuid UUID)
RETURNS TABLE(
    total_reactions BIGINT,
    likes BIGINT,
    dislikes BIGINT,
    loves BIGINT,
    laughs BIGINT,
    angry BIGINT,
    sad BIGINT,
    reports_count BIGINT,
    reply_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(cr.id) FILTER (WHERE cr.reaction_type IS NOT NULL) AS total_reactions,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'like') AS likes,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'dislike') AS dislikes,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'love') AS loves,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'laugh') AS laughs,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'angry') AS angry,
        COUNT(cr.id) FILTER (WHERE cr.reaction_type = 'sad') AS sad,
        COUNT(cr.id) FILTER (WHERE cr.status = 'pending') AS reports_count,
        COUNT(c.id) FILTER (WHERE c.parent_id = comment_uuid AND c.status = 'published') AS reply_count
    FROM comments c
    LEFT JOIN comment_reactions cr ON c.id = cr.comment_id
    LEFT JOIN comment_reports crp ON c.id = crp.comment_id
    WHERE c.id = comment_uuid
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- View para comentários com estatísticas
CREATE OR REPLACE VIEW comments_with_stats AS
SELECT 
    c.*,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_name,
    u.raw_user_meta_data->>'avatar_url' as user_avatar,
    COALESCE(r.total_reactions, 0) as total_reactions,
    COALESCE(r.likes, 0) as likes,
    COALESCE(r.dislikes, 0) as dislikes,
    COALESCE(r.loves, 0) as loves,
    COALESCE(r.laughs, 0) as laughs,
    COALESCE(r.angry, 0) as angry,
    COALESCE(r.sad, 0) as sad,
    COALESCE(r.reports_count, 0) as reports_count,
    COALESCE(r.reply_count, 0) as reply_count
FROM comments c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN LATERAL get_comment_stats(c.id) r ON true;

-- View para comentários em árvore (hierárquica)
CREATE OR REPLACE VIEW comments_tree AS
WITH RECURSIVE comment_tree AS (
    SELECT 
        c.*,
        0 as depth,
        ARRAY[c.id] as path,
        u.email as user_email,
        u.raw_user_meta_data->>'full_name' as user_name,
        u.raw_user_meta_data->>'avatar_url' as user_avatar
    FROM comments c
    LEFT JOIN auth.users u ON c.user_id = u.id
    WHERE c.parent_id IS NULL
    
    UNION ALL
    
    SELECT 
        c.*,
        ct.depth + 1 as depth,
        ct.path || c.id as path,
        u.email as user_email,
        u.raw_user_meta_data->>'full_name' as user_name,
        u.raw_user_meta_data->>'avatar_url' as user_avatar
    FROM comments c
    INNER JOIN comment_tree ct ON c.parent_id = ct.id
    LEFT JOIN auth.users u ON c.user_id = u.id
)
SELECT * FROM comment_tree
ORDER BY path;

-- Função para verificar se um usuário pode comentar
CREATE OR REPLACE FUNCTION can_user_comment(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    banned_until TIMESTAMPTZ;
    recent_reports INT;
BEGIN
    -- Verificar se o usuário está banido
    SELECT (raw_user_meta_data->>'banned_until')::TIMESTAMPTZ 
    INTO banned_until
    FROM auth.users 
    WHERE id = user_uuid;
    
    IF banned_until > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o usuário tem muitos reports recentes
    SELECT COUNT(*)::INT
    INTO recent_reports
    FROM comment_reports cr
    JOIN comments c ON cr.comment_id = c.id
    WHERE c.user_id = user_uuid 
    AND cr.created_at > NOW() - INTERVAL '30 days'
    AND cr.status = 'approved';
    
    IF recent_reports >= 5 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para comentários
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_moderations ENABLE ROW LEVEL SECURITY;

-- Políticas para comentários
CREATE POLICY "Usuários podem ver comentários publicados" ON comments
    FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem criar comentários" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND can_user_comment(auth.uid())
        AND status IN ('published', 'pending')
    );

CREATE POLICY "Usuários podem editar seus próprios comentários" ON comments
    FOR UPDATE USING (auth.uid() = user_id) 
    WITH CHECK (
        auth.uid() = user_id 
        AND status != 'deleted'
    );

CREATE POLICY "Usuários podem deletar seus próprios comentários" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reações
CREATE POLICY "Todos podem ver reações" ON comment_reactions
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem adicionar reações" ON comment_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover suas reações" ON comment_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reports
CREATE POLICY "Todos podem ver reports" ON comment_reports
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar reports" ON comment_reports
    FOR INSERT WITH CHECK (
        auth.uid() = reporter_id 
        AND reporter_id != (SELECT user_id FROM comments WHERE id = comment_id)
    );

CREATE POLICY "Moderadores podem atualizar reports" ON comment_reports
    FOR UPDATE USING (
        auth.uid() IN (SELECT user_id FROM permissions WHERE role = 'moderator' OR role = 'admin')
    );

-- Políticas para moderações
CREATE POLICY "Moderadores podem criar moderações" ON comment_moderations
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT user_id FROM permissions WHERE role = 'moderator' OR role = 'admin')
    );

CREATE POLICY "Moderadores podem ver moderações" ON comment_moderations
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM permissions WHERE role = 'moderator' OR role = 'admin')
    );

-- Função para limpar comentários antigos (agendada)
CREATE OR REPLACE FUNCTION cleanup_old_comments()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar comentários deletados há mais de 30 dias
    DELETE FROM comments 
    WHERE status = 'deleted' 
    AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar sobre novos reports
CREATE OR REPLACE FUNCTION notify_new_report()
RETURNS TRIGGER AS $$
BEGIN
    -- Aqui você pode adicionar lógica para notificar moderadores
    -- Por exemplo, enviar notificação via Supabase Realtime ou email
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_report_trigger
    AFTER INSERT ON comment_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_report();

-- Trigger para atualizar contadores de reações
CREATE OR REPLACE FUNCTION update_comment_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE comments SET updated_at = NOW() WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE comments SET updated_at = NOW() WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_reactions_count_trigger
    AFTER INSERT OR DELETE ON comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_reactions_count();