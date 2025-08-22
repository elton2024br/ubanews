-- Add text search indexes for news title and content
CREATE INDEX IF NOT EXISTS idx_news_title_text_search ON news USING gin (to_tsvector('portuguese', coalesce(title, '')));
CREATE INDEX IF NOT EXISTS idx_news_content_text_search ON news USING gin (to_tsvector('portuguese', coalesce(content, '')));
