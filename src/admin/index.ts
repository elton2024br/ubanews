// Context
export { AdminProvider, useAdmin } from './context/AdminProvider';

// Auth Components
export { default as LoginPage } from './auth/LoginPage';
export { default as ProtectedRoute } from './auth/ProtectedRoute';

// Layout Components
export { default as AdminLayout } from './layout/AdminLayout';

// Page Components
export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as NewsManagement } from './pages/NewsManagement';
export { default as Settings } from './pages/Settings';

// Types
export type {
  User,
  Permission,
  AdminNews,
  NewsApproval,
  AuditLog,
  DashboardStats,
  NewsFilters,
  PaginationInfo,
  AdminContextType
} from './types/admin';