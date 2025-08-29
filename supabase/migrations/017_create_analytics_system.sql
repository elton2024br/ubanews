-- Migration: 017_create_analytics_system.sql
-- Description: Sistema completo de Analytics para UbaNews

-- Tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_label VARCHAR(255),
    event_value INTEGER DEFAULT 0,
    page_path TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    screen_resolution VARCHAR(20),
    viewport_size VARCHAR(20),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    custom_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de visualizações de notícias
CREATE TABLE IF NOT EXISTS news_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    news_id UUID REFERENCES admin_news(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID NOT NULL,
    view_count INTEGER DEFAULT 1,
    duration_seconds INTEGER DEFAULT 0,
    scroll_depth INTEGER DEFAULT 0,
    is_bounce BOOLEAN DEFAULT FALSE,
    is_unique BOOLEAN DEFAULT TRUE,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(news_id, user_id, session_id)
);

-- Tabela de métricas agregadas por notícia
CREATE TABLE IF NOT EXISTS news_metrics (
    news_id UUID PRIMARY KEY REFERENCES admin_news(id) ON DELETE CASCADE,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    avg_read_time_seconds INTEGER DEFAULT 0,
    avg_scroll_depth INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas de usuário
CREATE TABLE IF NOT EXISTS user_engagement (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    avg_session_duration INTEGER DEFAULT 0,
    total_news_views INTEGER DEFAULT 0,
    favorite_category VARCHAR(50),
    first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de heatmaps
CREATE TABLE IF NOT EXISTS heatmap_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL,
    element_id VARCHAR(255),
    element_type VARCHAR(50),
    x_coordinate INTEGER,
    y_coordinate INTEGER,
    click_count INTEGER DEFAULT 1,
    hover_time INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID NOT NULL,
    device_type VARCHAR(20),
    screen_resolution VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de performance web vitals
CREATE TABLE IF NOT EXISTS web_vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    rating VARCHAR(10) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID NOT NULL,
    device_type VARCHAR(20),
    connection_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(page_path);

CREATE INDEX IF NOT EXISTS idx_news_views_news ON news_views(news_id);
CREATE INDEX IF NOT EXISTS idx_news_views_user ON news_views(user_id);
CREATE INDEX IF NOT EXISTS idx_news_views_session ON news_views(session_id);
CREATE INDEX IF NOT EXISTS idx_news_views_created ON news_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_metrics_updated ON news_metrics(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_metrics_activity ON news_metrics(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_engagement_user ON user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_last_activity ON user_engagement(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_heatmap_page ON heatmap_data(page_path);
CREATE INDEX IF NOT EXISTS idx_heatmap_created ON heatmap_data(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_web_vitals_page ON web_vitals(page_path);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric ON web_vitals(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created ON web_vitals(created_at DESC);

-- Função para atualizar métricas de notícias
CREATE OR REPLACE FUNCTION update_news_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO news_metrics (news_id, total_views, unique_views)
        VALUES (NEW.news_id, 1, CASE WHEN NEW.is_unique THEN 1 ELSE 0 END)
        ON CONFLICT (news_id) DO UPDATE SET
            total_views = news_metrics.total_views + 1,
            unique_views = news_metrics.unique_views + CASE WHEN NEW.is_unique THEN 1 ELSE 0 END,
            avg_read_time_seconds = (
                (news_metrics.avg_read_time_seconds * news_metrics.total_views + NEW.duration_seconds) / 
                (news_metrics.total_views + 1)
            ),
            avg_scroll_depth = (
                (news_metrics.avg_scroll_depth * news_metrics.total_views + NEW.scroll_depth) / 
                (news_metrics.total_views + 1)
            ),
            bounce_rate = (
                (news_metrics.bounce_rate * news_metrics.total_views + CASE WHEN NEW.is_bounce THEN 100 ELSE 0 END) / 
                (news_metrics.total_views + 1)
            ),
            last_activity_at = NOW(),
            updated_at = NOW();
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar métricas quando há nova visualização
CREATE TRIGGER trigger_update_news_metrics
AFTER INSERT ON news_views
FOR EACH ROW
EXECUTE FUNCTION update_news_metrics();

-- Função para atualizar engajamento do usuário
CREATE OR REPLACE FUNCTION update_user_engagement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_engagement (user_id, total_sessions, total_page_views, last_visit_at)
        VALUES (NEW.user_id, 1, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            total_sessions = user_engagement.total_sessions + 1,
            total_page_views = user_engagement.total_page_views + 1,
            avg_session_duration = (
                (user_engagement.avg_session_duration * user_engagement.total_sessions + 300) / 
                (user_engagement.total_sessions + 1)
            ),
            last_visit_at = NOW(),
            last_activity_at = NOW(),
            updated_at = NOW();
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar engajamento do usuário
CREATE TRIGGER trigger_update_user_engagement
AFTER INSERT ON analytics_events
FOR EACH ROW
WHEN (NEW.event_type = 'page_view' AND NEW.user_id IS NOT NULL)
EXECUTE FUNCTION update_user_engagement();

-- Função para limpar dados antigos (mantém últimos 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
    DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM heatmap_data WHERE created_at < NOW() - INTERVAL '30 days';
    DELETE FROM web_vitals WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para analytics
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura pública de métricas agregadas
CREATE POLICY "Permitir leitura pública de métricas de notícias" ON news_metrics
    FOR SELECT USING (true);

-- Políticas para escrita anônima de eventos básicos
CREATE POLICY "Permitir escrita anônima de eventos" ON analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir escrita anônima de visualizações" ON news_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir escrita anônima de web vitals" ON web_vitals
    FOR INSERT WITH CHECK (true);

-- Políticas restritas para dados de usuário
CREATE POLICY "Permitir leitura própria de engajamento" ON user_engagement
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir leitura própria de eventos" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

-- Views para relatórios rápidos
CREATE OR REPLACE VIEW daily_news_stats AS
SELECT 
    n.id,
    n.title,
    n.category,
    n.published_at,
    COALESCE(m.total_views, 0) as total_views,
    COALESCE(m.unique_views, 0) as unique_views,
    COALESCE(m.avg_read_time_seconds, 0) as avg_read_time,
    COALESCE(m.engagement_score, 0) as engagement_score,
    COALESCE(m.shares_count, 0) as shares_count,
    COALESCE(m.likes_count, 0) as likes_count,
    COALESCE(m.comments_count, 0) as comments_count
FROM admin_news n
LEFT JOIN news_metrics m ON n.id = m.news_id
WHERE n.status = 'published'
ORDER BY m.total_views DESC NULLS LAST;

CREATE OR REPLACE VIEW top_categories AS
SELECT 
    category,
    COUNT(*) as news_count,
    SUM(COALESCE(m.total_views, 0)) as total_views,
    AVG(COALESCE(m.engagement_score, 0)) as avg_engagement
FROM admin_news n
LEFT JOIN news_metrics m ON n.id = m.news_id
WHERE n.status = 'published'
GROUP BY category
ORDER BY total_views DESC;

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as total_sessions
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;