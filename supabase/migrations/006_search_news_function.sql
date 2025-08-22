-- Function to perform full-text search on admin_news
-- Allows optional filtering by category and date range (in days)
CREATE OR REPLACE FUNCTION search_news(
    term TEXT,
    category TEXT DEFAULT NULL,
    date_range INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    excerpt TEXT,
    category TEXT,
    publish_date TIMESTAMPTZ,
    featured_image TEXT
) AS $$
    SELECT
        id,
        title,
        excerpt,
        admin_news.category,
        publish_date,
        featured_image
    FROM admin_news
    WHERE
        to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(content, ''))
            @@ to_tsquery('portuguese', $1)
        AND ($2 IS NULL OR admin_news.category = $2)
        AND ($3 IS NULL OR publish_date >= NOW() - ($3 || ' days')::interval)
        AND status = 'published'
    ORDER BY publish_date DESC;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION search_news(TEXT, TEXT, INT) TO anon, authenticated;
