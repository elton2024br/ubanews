import { useEffect, useRef, useState } from 'react';
import { initWebVitals, getMetricsSummary, usePerformanceMonitor } from '../utils/webVitals';

// Web Vitals metrics interface
interface WebVitalsMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  inp?: number;
}

interface WebVitalsState {
  metrics: WebVitalsMetrics;
  isLoading: boolean;
  summary: ReturnType<typeof getMetricsSummary> | null;
}

// Main Web Vitals hook
export function useWebVitals() {
  const [state, setState] = useState<WebVitalsState>({
    metrics: {},
    isLoading: true,
    summary: null
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      initialized.current = true;
      
      // Initialize Web Vitals monitoring
      initWebVitals();
      
      // Update state after initialization
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          summary: getMetricsSummary()
        }));
      }, 1000);
      
      // Update summary periodically
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          summary: getMetricsSummary()
        }));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return state;
}

// Hook for component performance monitoring
export function useComponentPerformance(componentName: string) {
  const monitor = usePerformanceMonitor(componentName);
  const renderStartTime = useRef<number>(performance.now());
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const hasMarkedComplete = useRef(false);

  useEffect(() => {
    // Only mark render complete once per component mount
    if (!hasMarkedComplete.current) {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      setRenderTime(duration);
      monitor.markRenderComplete();
      hasMarkedComplete.current = true;
    }
  }, [componentName, monitor]); // Include monitor but prevent infinite loops with hasMarkedComplete ref

  const markInteraction = (interactionName: string) => {
    monitor.markInteraction(interactionName);
  };

  return {
    renderTime,
    markInteraction
  };
}

// Hook for page performance tracking
export function usePagePerformance(pageName: string) {
  const [pageMetrics, setPageMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      const metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      };
      
      setPageMetrics(metrics);
      
      // Log page performance in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`📊 ${pageName} Performance Metrics`);
        console.log(`Load Time: ${metrics.loadTime.toFixed(2)}ms`);
        console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
        console.log(`First Paint: ${metrics.firstPaint.toFixed(2)}ms`);
        console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
        console.groupEnd();
      }
    }
  }, [pageName]);

  return pageMetrics;
}

// Hook for monitoring user interactions
export function useInteractionTracking() {
  const [interactions, setInteractions] = useState<Array<{
    type: string;
    timestamp: number;
    duration?: number;
    target?: string;
  }>>([]);

  const trackInteraction = (type: string, target?: string, duration?: number) => {
    const interaction = {
      type,
      timestamp: Date.now(),
      duration,
      target
    };
    
    setInteractions(prev => [...prev.slice(-49), interaction]); // Keep last 50 interactions
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`👆 Interaction: ${type}${target ? ` on ${target}` : ''}${duration ? ` (${duration.toFixed(2)}ms)` : ''}`);
    }
  };

  const trackClick = (event: React.MouseEvent, elementName?: string) => {
    const target = elementName || (event.target as HTMLElement).tagName.toLowerCase();
    trackInteraction('click', target);
  };

  const trackScroll = (scrollPosition: number) => {
    trackInteraction('scroll', `position-${scrollPosition}`);
  };

  const trackFormSubmit = (formName: string, duration?: number) => {
    trackInteraction('form_submit', formName, duration);
  };

  return {
    interactions,
    trackInteraction,
    trackClick,
    trackScroll,
    trackFormSubmit
  };
}

// Hook for monitoring resource loading
export function useResourceMonitoring() {
  const [resources, setResources] = useState<Array<{
    name: string;
    type: string;
    duration: number;
    size: number;
    status: 'fast' | 'slow' | 'failed';
  }>>([]);

  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            const resource = {
              name: resourceEntry.name.split('/').pop() || resourceEntry.name,
              type: resourceEntry.initiatorType,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize || 0,
              status: resourceEntry.duration > 1000 ? 'slow' : 
                     resourceEntry.duration > 500 ? 'slow' : 'fast'
            };
            
            setResources(prev => [...prev.slice(-99), resource]); // Keep last 100 resources
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      
      return () => observer.disconnect();
    }
  }, []);

  const getSlowResources = () => resources.filter(r => r.status === 'slow');
  const getTotalResourceSize = () => resources.reduce((sum, r) => sum + r.size, 0);
  const getResourcesByType = (type: string) => resources.filter(r => r.type === type);

  return {
    resources,
    getSlowResources,
    getTotalResourceSize,
    getResourcesByType
  };
}

// Hook for Core Web Vitals monitoring with real-time updates
export function useCoreWebVitals() {
  const [vitals, setVitals] = useState({
    lcp: { value: 0, rating: 'good' as const },
    fid: { value: 0, rating: 'good' as const },
    cls: { value: 0, rating: 'good' as const },
    fcp: { value: 0, rating: 'good' as const },
    ttfb: { value: 0, rating: 'good' as const }
  });

  useEffect(() => {
    // Listen for Web Vitals updates
    const handleVitalUpdate = (event: CustomEvent) => {
      const { name, value, rating } = event.detail;
      
      setVitals(prev => ({
        ...prev,
        [name.toLowerCase()]: { value, rating }
      }));
    };

    window.addEventListener('web-vital-update', handleVitalUpdate as EventListener);
    
    return () => {
      window.removeEventListener('web-vital-update', handleVitalUpdate as EventListener);
    };
  }, []);

  const getOverallScore = () => {
    const ratings = Object.values(vitals).map(v => v.rating);
    const goodCount = ratings.filter(r => r === 'good').length;
    const totalCount = ratings.length;
    
    if (goodCount === totalCount) return 'good';
    if (goodCount >= totalCount * 0.6) return 'needs-improvement';
    return 'poor';
  };

  return {
    vitals,
    overallScore: getOverallScore()
  };
}