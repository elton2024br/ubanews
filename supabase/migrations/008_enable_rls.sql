-- Enable row level security and policies based on auth.uid()

-- Enable RLS on critical tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users
CREATE POLICY "admin_users_select" ON admin_users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE
  USING (id = auth.uid());

-- Policies for permissions
CREATE POLICY "permissions_select" ON permissions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "permissions_insert" ON permissions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "permissions_update" ON permissions
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policies for admin_news
CREATE POLICY "admin_news_select" ON admin_news
  FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "admin_news_insert" ON admin_news
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "admin_news_update" ON admin_news
  FOR UPDATE
  USING (author_id = auth.uid());

-- Policies for news_approvals
CREATE POLICY "news_approvals_select" ON news_approvals
  FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY "news_approvals_insert" ON news_approvals
  FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "news_approvals_update" ON news_approvals
  FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Policies for news_versions
CREATE POLICY "news_versions_select" ON news_versions
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "news_versions_insert" ON news_versions
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "news_versions_update" ON news_versions
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policies for audit_logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "audit_logs_update" ON audit_logs
  FOR UPDATE
  USING (user_id = auth.uid());
