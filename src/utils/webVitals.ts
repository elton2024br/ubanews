import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Web Vitals thresholds (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 }
};

// Performance rating based on thresholds
type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: PerformanceRating;
  delta: number;
  id: string;
  navigationType?: string;
}

interface PerformanceData {
  url: string;
  timestamp: number;
  userAgent: string;
  connectionType?: string;
  metrics: WebVitalMetric[];
  deviceInfo: {
    isMobile: boolean;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
  };
}

// Get performance rating based on metric value and thresholds
function getPerformanceRating(metricName: string, value: number): PerformanceRating {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Get device information
function getDeviceInfo() {
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

// Get connection information
function getConnectionInfo(): string | undefined {
  const connection = (navigator as unknown as { connection?: { effectiveType?: string }; mozConnection?: { effectiveType?: string }; webkitConnection?: { effectiveType?: string } }).connection || 
                   (navigator as unknown as { mozConnection?: { effectiveType?: string } }).mozConnection || 
                   (navigator as unknown as { webkitConnection?: { effectiveType?: string } }).webkitConnection;
  return connection?.effectiveType;
}

// Analytics integration (can be replaced with your preferred analytics service)
function sendToAnalytics(data: PerformanceData) {
  // Example: Send to Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'web_vitals', {
      event_category: 'Performance',
      event_label: data.url,
      value: Math.round(data.metrics[0]?.value || 0),
      custom_map: {
        metric_name: data.metrics[0]?.name,
        metric_rating: data.metrics[0]?.rating,
        device_type: data.deviceInfo.isMobile ? 'mobile' : 'desktop',
        connection_type: data.connectionType
      }
    });
  }
  
  // Example: Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(error => {
      console.warn('Failed to send Web Vitals data:', error);
    });
  }
}

// Console logging for development
function logToConsole(metric: WebVitalMetric) {
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  }
}

// Store metrics locally for debugging
const metricsStore: WebVitalMetric[] = [];

function storeMetric(metric: WebVitalMetric) {
  metricsStore.push(metric);
  
  // Keep only last 50 metrics
  if (metricsStore.length > 50) {
    metricsStore.shift();
  }
}

// Main metric handler
function handleMetric(metric: { name: string; value: number; delta: number; id: string; navigationType?: string }) {
  const webVitalMetric: WebVitalMetric = {
    name: metric.name,
    value: metric.value,
    rating: getPerformanceRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType
  };
  
  // Store metric
  storeMetric(webVitalMetric);
  
  // Log to console in development
  logToConsole(webVitalMetric);
  
  // Send to analytics
  const performanceData: PerformanceData = {
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connectionType: getConnectionInfo(),
    metrics: [webVitalMetric],
    deviceInfo: getDeviceInfo()
  };
  
  sendToAnalytics(performanceData);
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  try {
    // Core Web Vitals
    onCLS(handleMetric);
    onLCP(handleMetric);
    onINP(handleMetric); // INP replaces FID in web-vitals v5
    
    // Additional metrics
    onFCP(handleMetric);
    onTTFB(handleMetric);
    
    console.log('🚀 Web Vitals monitoring initialized');
  } catch (error) {
    console.warn('Failed to initialize Web Vitals:', error);
  }
}

// Get current metrics summary
export function getMetricsSummary() {
  const summary = {
    total: metricsStore.length,
    good: metricsStore.filter(m => m.rating === 'good').length,
    needsImprovement: metricsStore.filter(m => m.rating === 'needs-improvement').length,
    poor: metricsStore.filter(m => m.rating === 'poor').length,
    metrics: metricsStore.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, WebVitalMetric[]>)
  };
  
  return summary;
}

// Performance monitoring hook for React components
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();
  
  return {
    // Mark component render complete
    markRenderComplete: () => {
      const renderTime = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // Send component performance data
      if (renderTime > 16) { // More than one frame (60fps)
        const performanceData: PerformanceData = {
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          connectionType: getConnectionInfo(),
          metrics: [{
            name: 'component_render',
            value: renderTime,
            rating: renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor',
            delta: 0,
            id: `${componentName}-${Date.now()}`
          }],
          deviceInfo: getDeviceInfo()
        };
        
        sendToAnalytics(performanceData);
      }
    },
    
    // Mark user interaction
    markInteraction: (interactionName: string) => {
      const interactionTime = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`👆 ${componentName} ${interactionName}: ${interactionTime.toFixed(2)}ms`);
      }
    }
  };
}

// Resource loading performance
export function monitorResourceLoading() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Monitor slow resources (> 1s)
          if (resourceEntry.duration > 1000) {
            console.warn(`🐌 Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`);
            
            // Send slow resource data
            const performanceData: PerformanceData = {
              url: window.location.href,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              connectionType: getConnectionInfo(),
              metrics: [{
                name: 'slow_resource',
                value: resourceEntry.duration,
                rating: 'poor',
                delta: 0,
                id: `resource-${Date.now()}`
              }],
              deviceInfo: getDeviceInfo()
            };
            
            sendToAnalytics(performanceData);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
}

// Export metrics for debugging
export function exportMetrics() {
  const data = {
    summary: getMetricsSummary(),
    rawMetrics: metricsStore,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `web-vitals-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Global performance monitoring setup
if (typeof window !== 'undefined') {
  // Add to window for debugging
  (window as unknown as { webVitalsDebug: { getMetricsSummary: typeof getMetricsSummary; exportMetrics: typeof exportMetrics; metricsStore: typeof metricsStore } }).webVitalsDebug = {
    getMetricsSummary,
    exportMetrics,
    metricsStore
  };
}