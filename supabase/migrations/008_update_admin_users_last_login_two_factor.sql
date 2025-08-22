-- Ensure admin_users has last_login_at and two-factor columns
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Migrate data from legacy last_login column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'last_login'
  ) THEN
    UPDATE admin_users
      SET last_login_at = last_login
      WHERE last_login_at IS NULL;
    ALTER TABLE admin_users DROP COLUMN last_login;
  END IF;
END $$;
