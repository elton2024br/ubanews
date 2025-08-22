export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'columnist';
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}
