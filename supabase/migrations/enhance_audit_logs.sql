-- Enhance audit_logs table for better compliance and tracking
-- Add new columns for enhanced audit trail

ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS request_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending', 'error')),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time_range ON audit_logs(created_at, severity);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only authenticated admin users can view audit logs
CREATE POLICY "Admin users can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.email() 
            AND admin_users.is_active = true
        )
    );

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Grant permissions to authenticated role for reading
GRANT SELECT ON audit_logs TO authenticated;

-- Grant all permissions to service role for system operations
GRANT ALL ON audit_logs TO service_role;

-- Create a function to automatically log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info',
    p_category VARCHAR(50) DEFAULT 'admin',
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        severity,
        category,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_severity,
        p_category,
        p_metadata,
        COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 
                current_setting('request.headers', true)::json->>'x-real-ip')::inet,
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO service_role;

-- Create a view for easier audit log querying
CREATE OR REPLACE VIEW audit_logs_with_user AS
SELECT 
    al.*,
    au.email as user_email,
    au.full_name as user_name,
    au.role as user_role
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
LEFT JOIN admin_users au ON u.email = au.email;

-- Grant select on the view
GRANT SELECT ON audit_logs_with_user TO authenticated;

COMMENT ON TABLE audit_logs IS 'Enhanced audit log table for compliance and security tracking';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: low, medium, high, critical';
COMMENT ON COLUMN audit_logs.category IS 'Action category for grouping (admin, user, system, security, etc.)';
COMMENT ON COLUMN audit_logs.session_id IS 'Session identifier for tracking user sessions';
COMMENT ON COLUMN audit_logs.request_id IS 'Request identifier for tracing requests';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN audit_logs.status IS 'Action status: success, failure, pending, error';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN audit_logs.duration_ms IS 'Action duration in milliseconds';