-- Enable RLS on audit_logs table and restrict access
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow only admins to view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
