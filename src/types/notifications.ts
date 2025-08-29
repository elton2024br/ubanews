// Tipos TypeScript para o sistema de notificações em tempo real
// Baseado no roadmap Fase 2 - UbaNews

/**
 * Tipos de notificação disponíveis no sistema
 */
export type NotificationType = 
  | 'news_approved'
  | 'news_rejected'
  | 'news_published'
  | 'comment_new'
  | 'comment_mention'
  | 'deadline_approaching'
  | 'system_update'
  | 'user_action'
  | 'approval_request';

/**
 * Status de leitura da notificação
 */
export type NotificationStatus = 'read' | 'unread';

/**
 * Interface base para uma notificação
 */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data: NotificationData;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dados específicos por tipo de notificação
 */
export interface NotificationData {
  // Para notificações de notícias
  news_id?: string;
  news_title?: string;
  approved_by?: string;
  rejected_by?: string;
  rejection_reason?: string;
  
  // Para notificações de comentários
  comment_id?: string;
  comment_author?: string;
  article_title?: string;
  
  // Para notificações de deadline
  deadline_date?: string;
  task_description?: string;
  
  // Para notificações do sistema
  version?: string;
  feature_description?: string;
  
  // Para ações de usuário
  action_type?: string;
  target_user?: string;
  
  // Dados adicionais genéricos
  [key: string]: unknown;
}

/**
 * Preferências de notificação do usuário
 */
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  news_approved: boolean;
  news_rejected: boolean;
  comment_new: boolean;
  comment_mention: boolean;
  deadline_approaching: boolean;
  system_update: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Configurações para criar uma nova notificação
 */
export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Partial<NotificationData>;
}

/**
 * Filtros para buscar notificações
 */
export interface NotificationFilters {
  type?: NotificationType[];
  status?: NotificationStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Resposta da API para listagem de notificações
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

/**
 * Configurações do hook useNotifications
 */
export interface UseNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
  filters?: NotificationFilters;
}

/**
 * Estado do hook useNotifications
 */
export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

/**
 * Ações disponíveis no hook useNotifications
 */
export interface NotificationsActions {
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createNotification: (params: CreateNotificationParams) => Promise<string | null>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<boolean>;
}

/**
 * Retorno completo do hook useNotifications
 */
export interface UseNotificationsReturn extends NotificationsState, NotificationsActions {
  preferences: NotificationPreferences | null;
}

/**
 * Configurações para push notifications
 */
export interface PushNotificationConfig {
  vapidKey: string;
  serviceWorkerPath: string;
  enableOnMobile: boolean;
  enableOnDesktop: boolean;
}

/**
 * Payload para push notification
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: NotificationData;
  actions?: PushNotificationAction[];
}

/**
 * Ação disponível em push notification
 */
export interface PushNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Mapeamento de ícones por tipo de notificação
 */
export const NotificationIcons: Record<NotificationType, string> = {
  news_approved: '✅',
  news_rejected: '❌',
  news_published: '📰',
  comment_new: '💬',
  comment_mention: '👤',
  deadline_approaching: '⏰',
  system_update: '🔄',
  user_action: '👥',
  approval_request: '📋'
};

/**
 * Cores por tipo de notificação (Tailwind classes)
 */
export const NotificationColors: Record<NotificationType, string> = {
  news_approved: 'text-green-600 bg-green-50',
  news_rejected: 'text-red-600 bg-red-50',
  news_published: 'text-blue-600 bg-blue-50',
  comment_new: 'text-purple-600 bg-purple-50',
  comment_mention: 'text-orange-600 bg-orange-50',
  deadline_approaching: 'text-yellow-600 bg-yellow-50',
  system_update: 'text-gray-600 bg-gray-50',
  user_action: 'text-indigo-600 bg-indigo-50',
  approval_request: 'text-cyan-600 bg-cyan-50'
};

/**
 * Títulos amigáveis por tipo de notificação
 */
export const NotificationTitles: Record<NotificationType, string> = {
  news_approved: 'Notícia Aprovada',
  news_rejected: 'Notícia Rejeitada',
  news_published: 'Notícia Publicada',
  comment_new: 'Novo Comentário',
  comment_mention: 'Você foi Mencionado',
  deadline_approaching: 'Prazo Próximo',
  system_update: 'Atualização do Sistema',
  user_action: 'Ação de Usuário',
  approval_request: 'Solicitação de Aprovação'
};

/**
 * Utilitário para verificar se uma notificação foi lida
 */
export const isNotificationRead = (notification: Notification): boolean => {
  return notification.read_at !== null && notification.read_at !== undefined;
};

/**
 * Utilitário para formatar data de notificação
 */
export const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
};

/**
 * Utilitário para agrupar notificações por data
 */
export const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Ontem';
    } else {
      groupKey = date.toLocaleDateString('pt-BR');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(notification);
  });
  
  return groups;
};