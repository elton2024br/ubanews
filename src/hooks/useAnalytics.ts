import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
  AnalyticsEvent,
  NewsView,
  WebVital,
  SessionData,
  AnalyticsConfig,
  TrackOptions,
  DeviceType,
  AnalyticsFilters,
  AnalyticsReport,
  AnalyticsEventType,
  EventCategory
} from '@/types/analytics';

// Configuração padrão
const defaultConfig: AnalyticsConfig = {
  enabled: true,
  debug: false,
  sampleRate: 1.0,
  excludedPaths: ['/admin', '/login', '/register'],
  customDimensions: {},
  privacy: {
    anonymizeIp: true,
    respectDnt: true,
    cookieDomain: window.location.hostname,
    cookieExpires: 365 * 24 * 60 * 60 * 1000, // 1 ano
  },
};

// Gerador de session ID
const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Detectar tipo de dispositivo
const detectDeviceType = (): DeviceType => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
};

// Detectar navegador e SO
const detectBrowserAndOS = () => {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detectar navegador
  if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
  else if (userAgent.includes('Edg/')) browser = 'Edge';
  else if (userAgent.includes('OPR/')) browser = 'Opera';

  // Detectar SO
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  return { browser, os };
};

// Detectar localização via IP (fallback para navegador)
const detectLocation = async (): Promise<{ country?: string; region?: string; city?: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_code,
      region: data.region,
      city: data.city,
    };
  } catch {
    return {};
  }
};

// Hook principal de analytics
export function useAnalytics(config: Partial<AnalyticsConfig> = {}) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [configState, setConfigState] = useState<AnalyticsConfig>({ ...defaultConfig, ...config });
  const eventQueueRef = useRef<AnalyticsEvent[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar sessão
  const initializeSession = useCallback(async () => {
    if (!configState.enabled) return;

    const sessionId = generateSessionId();
    const deviceType = detectDeviceType();
    const { browser, os } = detectBrowserAndOS();
    const location = await detectLocation();

    const newSession: SessionData = {
      id: sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: 0,
      duration: 0,
      isNew: true,
    };

    setSession(newSession);
    setIsInitialized(true);

    // Armazenar informações de sessão no localStorage
    localStorage.setItem('analytics_session', JSON.stringify(newSession));

    // Track initial page view
    trackEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      pagePath: window.location.pathname,
      customData: {
        deviceType,
        browser,
        os,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        ...location,
      },
    });

  }, [configState.enabled]);

  // Track evento
  const trackEvent = useCallback(async (
    event: Omit<AnalyticsEvent, 'id' | 'sessionId' | 'createdAt' | 'userId'>,
    options: TrackOptions = {}
  ) => {
    if (!configState.enabled || !session) return;

    // Verificar sample rate
    if (Math.random() > configState.sampleRate) return;

    // Verificar excluded paths
    if (configState.excludedPaths.some(path => window.location.pathname.startsWith(path))) {
      return;
    }

    // Verificar DNT (Do Not Track)
    if (configState.privacy.respectDnt && navigator.doNotTrack === '1') {
      return;
    }

    const fullEvent: AnalyticsEvent = {
      ...event,
      id: crypto.randomUUID(),
      sessionId: session.id,
      userId: (await supabase.auth.getUser()).data.user?.id || undefined,
      createdAt: new Date().toISOString(),
    };

    // Adicionar ao queue
    eventQueueRef.current.push(fullEvent);

    // Atualizar sessão
    setSession(prev => prev ? {
      ...prev,
      lastActivity: Date.now(),
      events: prev.events + 1,
    } : prev);

    // Flush queue se necessário
    if (options.skipQueue || eventQueueRef.current.length >= 10) {
      await flushEvents();
    } else {
      // Agendar flush
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushTimeoutRef.current = setTimeout(flushEvents, 2000);
    }

    // Debug log
    if (configState.debug) {
      console.log('[Analytics] Event tracked:', fullEvent);
    }
  }, [configState, session]);

  // Track visualização de notícia
  const trackNewsView = useCallback(async (
    newsId: string,
    options: {
      duration?: number;
      scrollDepth?: number;
      isUnique?: boolean;
    } = {}
  ) => {
    if (!session) return;

    const newsView: Omit<NewsView, 'id' | 'createdAt' | 'updatedAt'> = {
      newsId,
      sessionId: session.id,
      userId: (await supabase.auth.getUser()).data.user?.id || undefined,
      viewCount: 1,
      durationSeconds: options.duration || 0,
      scrollDepth: options.scrollDepth || 0,
      isUnique: options.isUnique ?? true,
      deviceType: detectDeviceType(),
      ...detectBrowserAndOS(),
    };

    try {
      await supabase.from('news_views').insert(newsView);
    } catch (error) {
      console.error('[Analytics] Error tracking news view:', error);
    }
  }, [session]);

  // Track web vital
  const trackWebVital = useCallback(async (
    metricName: string,
    value: number,
    rating: string
  ) => {
    if (!session) return;

    const webVital: Omit<WebVital, 'id' | 'createdAt'> = {
      pagePath: window.location.pathname,
      metricName,
      metricValue: value,
      rating,
      sessionId: session.id,
      userId: (await supabase.auth.getUser()).data.user?.id || undefined,
      deviceType: detectDeviceType(),
    };

    try {
      await supabase.from('web_vitals').insert(webVital);
    } catch (error) {
      console.error('[Analytics] Error tracking web vital:', error);
    }
  }, [session]);

  // Flush event queue
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const eventsToFlush = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventsToFlush);

      if (error) {
        console.error('[Analytics] Error flushing events:', error);
        // Re-add failed events to queue
        eventQueueRef.current.unshift(...eventsToFlush);
      }
    } catch (error) {
      console.error('[Analytics] Network error flushing events:', error);
      // Re-add failed events to queue
      eventQueueRef.current.unshift(...eventsToFlush);
    }
  }, []);

  // Obter relatório de analytics
  const getAnalyticsReport = useCallback(async (
    filters: AnalyticsFilters = {}
  ): Promise<AnalyticsReport | null> => {
    try {
      let query = supabase.from('daily_news_stats').select('*');

      if (filters.startDate) {
        query = query.gte('published_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('published_at', filters.endDate);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Analytics] Error getting report:', error);
        return null;
      }

      return {
        period: {
          start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: filters.endDate || new Date().toISOString(),
        },
        summary: {
          totalViews: data?.reduce((sum, item) => sum + item.totalViews, 0) || 0,
          uniqueVisitors: data?.reduce((sum, item) => sum + item.uniqueViews, 0) || 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          topPages: [],
          topSources: [],
        },
        newsStats: data || [],
        categories: [],
        userActivity: [],
      };
    } catch (error) {
      console.error('[Analytics] Error getting analytics report:', error);
      return null;
    }
  }, []);

  // Obter estatísticas de uma notícia específica
  const getNewsStats = useCallback(async (newsId: string) => {
    try {
      const { data, error } = await supabase
        .from('news_metrics')
        .select('*')
        .eq('news_id', newsId)
        .single();

      if (error) {
        console.error('[Analytics] Error getting news stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Analytics] Error getting news stats:', error);
      return null;
    }
  }, []);

  // Obter top notícias
  const getTopNews = useCallback(async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('daily_news_stats')
        .select('*')
        .order('total_views', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[Analytics] Error getting top news:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Analytics] Error getting top news:', error);
      return [];
    }
  }, []);

  // Configurar listeners de performance
  useEffect(() => {
    if (!isInitialized || !configState.enabled) return;

    // Web Vitals API
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getLCP, getTTFB, getFCP }) => {
        getCLS((metric) => trackWebVital('CLS', metric.value, metric.rating));
        getFID((metric) => trackWebVital('FID', metric.value, metric.rating));
        getLCP((metric) => trackWebVital('LCP', metric.value, metric.rating));
        getTTFB((metric) => trackWebVital('TTFB', metric.value, metric.rating));
        getFCP((metric) => trackWebVital('FCP', metric.value, metric.rating));
      });
    }

    // Track page views on route change
    const handleRouteChange = () => {
      if (session) {
        setSession(prev => prev ? {
          ...prev,
          pageViews: prev.pageViews + 1,
        } : prev);

        trackEvent({
          eventType: 'page_view',
          eventCategory: 'navigation',
          pagePath: window.location.pathname,
        });
      }
    };

    // Track scroll depth
    let maxScrollDepth = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
      );
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        if (maxScrollDepth >= 25 && maxScrollDepth % 25 === 0) {
          trackEvent({
            eventType: 'scroll_depth',
            eventCategory: 'engagement',
            eventLabel: `${maxScrollDepth}%`,
            eventValue: maxScrollDepth,
          });
        }
      }
    };

    // Track time on page
    let timeOnPage = 0;
    const trackTimeOnPage = () => {
      if (session && timeOnPage > 0) {
        trackEvent({
          eventType: 'time_on_page',
          eventCategory: 'engagement',
          eventValue: Math.round(timeOnPage / 1000),
        });
      }
    };

    const interval = setInterval(() => {
      timeOnPage += 1000;
    }, 1000);

    // Event listeners
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', trackTimeOnPage);
      
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      
      // Flush remaining events
      flushEvents();
    };
  }, [isInitialized, configState.enabled, session, trackEvent, trackWebVital, flushEvents]);

  // Initialize on mount
  useEffect(() => {
    initializeSession();
    
    return () => {
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushEvents();
    };
  }, [initializeSession, flushEvents]);

  return {
    isInitialized,
    session,
    trackEvent,
    trackNewsView,
    trackWebVital,
    getAnalyticsReport,
    getNewsStats,
    getTopNews,
    config: configState,
    updateConfig: setConfigState,
  };
}