-- Create newsletter subscribers table
CREATE TABLE newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    preferences JSONB DEFAULT '{}',
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter campaigns table
CREATE TABLE newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id TEXT,
    content JSONB NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter templates table
CREATE TABLE newsletter_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter tracking table
CREATE TABLE newsletter_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter segments table
CREATE TABLE newsletter_segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    subscriber_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter segment subscribers junction table
CREATE TABLE newsletter_segment_subscribers (
    segment_id UUID REFERENCES newsletter_segments(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    PRIMARY KEY (segment_id, subscriber_id)
);

-- Create indexes for better performance
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_campaigns_scheduled_for ON newsletter_campaigns(scheduled_for);
CREATE INDEX idx_newsletter_tracking_campaign_id ON newsletter_tracking(campaign_id);
CREATE INDEX idx_newsletter_tracking_subscriber_id ON newsletter_tracking(subscriber_id);
CREATE INDEX idx_newsletter_tracking_email ON newsletter_tracking(email);
CREATE INDEX idx_newsletter_tracking_sent_at ON newsletter_tracking(sent_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_templates_updated_at BEFORE UPDATE ON newsletter_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_segments_updated_at BEFORE UPDATE ON newsletter_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_segment_subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Newsletter subscribers policies
CREATE POLICY "Allow public subscription" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public unsubscription" ON newsletter_subscribers
    FOR UPDATE USING (email = current_setting('app.current_email', true)::text);

CREATE POLICY "Allow admin full access" ON newsletter_subscribers
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Newsletter campaigns policies
CREATE POLICY "Allow admin full access" ON newsletter_campaigns
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

-- Newsletter templates policies
CREATE POLICY "Allow admin full access" ON newsletter_templates
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

-- Newsletter tracking policies
CREATE POLICY "Allow admin full access" ON newsletter_tracking
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

-- Newsletter segments policies
CREATE POLICY "Allow admin full access" ON newsletter_segments
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));

CREATE POLICY "Allow admin full access" ON newsletter_segment_subscribers
    FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'editor'));