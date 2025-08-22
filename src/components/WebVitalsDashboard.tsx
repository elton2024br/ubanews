import React, { useState } from 'react';
import { Activity, BarChart3, Clock, Eye, Gauge, TrendingUp, Download, RefreshCw } from 'lucide-react';
import { useWebVitals, useCoreWebVitals, useResourceMonitoring } from '../hooks/useWebVitals';
import { exportMetrics } from '../utils/webVitals';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  icon: React.ReactNode;
  description: string;
}

function MetricCard({ title, value, unit, rating, icon, description }: MetricCardProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'good': return '✅';
      case 'needs-improvement': return '⚠️';
      case 'poor': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md',
      getRatingColor(rating)
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <span className="text-lg">{getRatingEmoji(rating)}</span>
      </div>
      
      <div className="mb-2">
        <span className="text-2xl font-bold">
          {value.toFixed(value < 1 ? 3 : 0)}
        </span>
        <span className="text-sm ml-1 opacity-75">{unit}</span>
      </div>
      
      <p className="text-xs opacity-75">{description}</p>
      
      <div className="mt-2">
        <div className={cn(
          'text-xs px-2 py-1 rounded-full inline-block font-medium',
          rating === 'good' ? 'bg-green-100 text-green-800' :
          rating === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        )}>
          {rating.replace('-', ' ').toUpperCase()}
        </div>
      </div>
    </div>
  );
}

interface ResourceListProps {
  resources: Array<{
    name: string;
    type: string;
    duration: number;
    size: number;
    status: 'fast' | 'slow' | 'failed';
  }>;
}

function ResourceList({ resources }: ResourceListProps) {
  const slowResources = resources.filter(r => r.status === 'slow').slice(0, 5);
  
  if (slowResources.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">All resources loading efficiently! 🚀</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slowResources.map((resource, index) => (
        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800 truncate">
              {resource.name}
            </p>
            <p className="text-xs text-red-600">
              {resource.type} • {(resource.size / 1024).toFixed(1)}KB
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-red-800">
              {resource.duration.toFixed(0)}ms
            </p>
            <p className="text-xs text-red-600">slow</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WebVitalsDashboard() {
  const { summary, isLoading } = useWebVitals();
  const { vitals, overallScore } = useCoreWebVitals();
  const { resources, getTotalResourceSize, getSlowResources } = useResourceMonitoring();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or when explicitly enabled
  React.useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('webvitals-dashboard') === 'true' ||
                     window.location.search.includes('debug=true');
    setIsVisible(shouldShow);
  }, []);

  if (!isVisible || isLoading) {
    return null;
  }

  const handleExport = () => {
    exportMetrics();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const totalResources = resources.length;
  const slowResourcesCount = getSlowResources().length;
  const totalSize = getTotalResourceSize();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Web Vitals Dashboard"
      >
        <Activity className="w-5 h-5" />
      </button>

      {/* Dashboard Panel */}
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg">Web Vitals</h2>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              title="Export Metrics"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overall Score */}
        <div className={cn(
          'mb-4 p-3 rounded-lg text-center font-semibold',
          overallScore === 'good' ? 'bg-green-100 text-green-800' :
          overallScore === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        )}>
          Overall Performance: {overallScore.replace('-', ' ').toUpperCase()}
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <MetricCard
            title="LCP"
            value={vitals.lcp.value}
            unit="ms"
            rating={vitals.lcp.rating}
            icon={<Eye className="w-4 h-4" />}
            description="Largest Contentful Paint"
          />
          
          <MetricCard
            title="FID"
            value={vitals.fid.value}
            unit="ms"
            rating={vitals.fid.rating}
            icon={<Clock className="w-4 h-4" />}
            description="First Input Delay"
          />
          
          <MetricCard
            title="CLS"
            value={vitals.cls.value}
            unit=""
            rating={vitals.cls.rating}
            icon={<BarChart3 className="w-4 h-4" />}
            description="Cumulative Layout Shift"
          />
        </div>

        {/* Resource Summary */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Resources
          </h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-bold text-lg">{totalResources}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'font-bold text-lg',
                slowResourcesCount > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {slowResourcesCount}
              </div>
              <div className="text-gray-600">Slow</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">
                {(totalSize / 1024 / 1024).toFixed(1)}MB
              </div>
              <div className="text-gray-600">Size</div>
            </div>
          </div>
        </div>

        {/* Slow Resources */}
        {slowResourcesCount > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2 text-red-600">
              ⚠️ Slow Resources
            </h3>
            <ResourceList resources={resources} />
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              <div>
                <div className="font-bold text-green-600">{summary.good}</div>
                <div className="text-gray-600">Good</div>
              </div>
              <div>
                <div className="font-bold text-yellow-600">{summary.needsImprovement}</div>
                <div className="text-gray-600">Needs Work</div>
              </div>
              <div>
                <div className="font-bold text-red-600">{summary.poor}</div>
                <div className="text-gray-600">Poor</div>
              </div>
              <div>
                <div className="font-bold text-blue-600">{summary.total}</div>
                <div className="text-gray-600">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Development Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
            💡 Dashboard visible in development mode
          </div>
        )}
      </div>
    </div>
  );
}