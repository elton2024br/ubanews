-- Create news_approvals table
CREATE TABLE IF NOT EXISTS news_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES admin_news(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES admin_users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for news_approvals
CREATE INDEX IF NOT EXISTS idx_news_approvals_news_id ON news_approvals(news_id);
CREATE INDEX IF NOT EXISTS idx_news_approvals_status ON news_approvals(status);
