// Tipos para o sistema de Analytics Avançadas

export interface AnalyticsEvent {
  id?: string;
  userId?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventCategory: EventCategory;
  eventLabel?: string;
  eventValue?: number;
  pagePath?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  screenResolution?: string;
  viewportSize?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  customData?: Record<string, any>;
  createdAt?: string;
}

export interface NewsView {
  id?: string;
  newsId: string;
  userId?: string;
  sessionId: string;
  viewCount?: number;
  durationSeconds?: number;
  scrollDepth?: number;
  isBounce?: boolean;
  isUnique?: boolean;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsMetrics {
  newsId: string;
  totalViews: number;
  uniqueViews: number;
  avgReadTimeSeconds: number;
  avgScrollDepth: number;
  bounceRate: number;
  engagementScore: number;
  sharesCount: number;
  likesCount: number;
  commentsCount: number;
  lastActivityAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserEngagement {
  userId: string;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  totalNewsViews: number;
  favoriteCategory?: string;
  firstVisitAt: string;
  lastVisitAt: string;
  lastActivityAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeatmapData {
  id?: string;
  pagePath: string;
  elementId?: string;
  elementType?: string;
  xCoordinate?: number;
  yCoordinate?: number;
  clickCount?: number;
  hoverTime?: number;
  userId?: string;
  sessionId: string;
  deviceType?: DeviceType;
  screenResolution?: string;
  createdAt?: string;
}

export interface WebVital {
  id?: string;
  pagePath: string;
  metricName: WebVitalMetric;
  metricValue: number;
  rating: WebVitalRating;
  userId?: string;
  sessionId: string;
  deviceType?: DeviceType;
  connectionType?: ConnectionType;
  createdAt?: string;
}

export interface DailyNewsStats {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  totalViews: number;
  uniqueViews: number;
  avgReadTime: number;
  engagementScore: number;
  sharesCount: number;
  likesCount: number;
  commentsCount: number;
}

export interface TopCategory {
  category: string;
  newsCount: number;
  totalViews: number;
  avgEngagement: number;
}

export interface UserActivitySummary {
  date: string;
  activeUsers: number;
  totalEvents: number;
  totalSessions: number;
}

// Enums
export type AnalyticsEventType = 
  | 'page_view'
  | 'news_view'
  | 'news_share'
  | 'news_like'
  | 'news_comment'
  | 'news_save'
  | 'search_query'
  | 'category_filter'
  | 'newsletter_signup'
  | 'notification_click'
  | 'scroll_depth'
  | 'time_on_page'
  | 'click_outbound'
  | 'video_play'
  | 'image_view'
  | 'social_share'
  | 'print'
  | 'bookmark'
  | 'error'
  | 'custom';

export type EventCategory =
  | 'engagement'
  | 'navigation'
  | 'news_interaction'
  | 'social'
  | 'search'
  | 'user_journey'
  | 'performance'
  | 'error'
  | 'custom';

export type DeviceType =
  | 'desktop'
  | 'mobile'
  | 'tablet'
  | 'tv'
  | 'wearable'
  | 'unknown';

export type WebVitalMetric =
  | 'CLS'
  | 'FID'
  | 'LCP'
  | 'FCP'
  | 'TTFB'
  | 'TTI'
  | 'TBT';

export type WebVitalRating =
  | 'good'
  | 'needs-improvement'
  | 'poor';

export type ConnectionType =
  | '4g'
  | '3g'
  | '2g'
  | 'slow-2g'
  | 'wifi'
  | 'ethernet'
  | 'unknown';

// Configurações de Analytics
export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  sampleRate: number;
  excludedPaths: string[];
  customDimensions: Record<string, string>;
  privacy: {
    anonymizeIp: boolean;
    respectDnt: boolean;
    cookieDomain: string;
    cookieExpires: number;
  };
}

// Opções de rastreamento
export interface TrackOptions {
  immediate?: boolean;
  debounce?: number;
  throttle?: number;
  customData?: Record<string, any>;
  skipQueue?: boolean;
}

// Dados de sessão
export interface SessionData {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: number;
  duration: number;
  isNew: boolean;
}

// Configuração de privacidade
export interface PrivacySettings {
  analyticsEnabled: boolean;
  personalizedAds: boolean;
  cookieConsent: boolean;
  ipAnonymization: boolean;
}

// Tipos de relatórios
export interface AnalyticsReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{
      path: string;
      views: number;
      avgTime: number;
    }>;
    topSources: Array<{
      source: string;
      visits: number;
    }>;
  };
  newsStats: DailyNewsStats[];
  categories: TopCategory[];
  userActivity: UserActivitySummary[];
}

// Filtros de relatório
export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  deviceType?: DeviceType;
  country?: string;
  referrer?: string;
  eventType?: AnalyticsEventType;
}

// Configuração de eventos customizados
export interface CustomEventConfig {
  name: string;
  category: EventCategory;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    required: boolean;
  }>;
}