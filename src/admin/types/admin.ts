// Admin system types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'columnist' | 'editor';
  avatar?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'publish' | 'archive';
}

export interface AdminNews {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  author_name: string;
  category: string;
  tags: string[];
  image: {
    src: string;
    alt: string;
    caption?: string;
  };
  status: 'draft' | 'pending' | 'published' | 'archived';
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  read_time: number;
  views: number;
  likes: number;
  shares: number;
}

export interface NewsApproval {
  id: string;
  news_id: string;
  reviewer_id: string;
  reviewer_name: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface DashboardStats {
  total_news: number;
  published_news: number;
  draft_news: number;
  pending_approval: number;
  total_users: number;
  active_users: number;
  total_views: number;
  total_likes: number;
  recent_activity: AuditLog[];
}

export interface NewsFilters {
  status?: string;
  category?: string;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

export type UserCreationPayload = Omit<User, 'id' | 'is_active' | 'two_factor_enabled' | 'created_at' | 'updated_at' | 'last_login' | 'permissions' | 'avatar'> & {
  password?: string;
};

export type UserUpdatePayload = Partial<UserCreationPayload>;


export type Settings = {
  id: number;
  site_title: string;
  site_description: string | null;
  maintenance_mode: boolean;
  enable_2fa_for_all: boolean;
  notification_email: string | null;
  updated_at: string | null;
};