import { newsArticles } from '../data/newsData';
import type { NewsArticle } from '../types/news';
import CacheService from './cacheService';
import newsRepository, { NewsQueryOptions } from './newsRepository';
import { featureFlags } from '../lib/featureFlags';

export interface NewsServiceResult {
  success: boolean;
  data: NewsArticle[];
  total: number;
  hasMore: boolean;
  source?: 'supabase' | 'static' | 'cache';
  error?: string;
  fallbackUsed?: boolean;
  pagination?: { limit?: number; offset?: number };
}

interface TtlMetric {
  count: number;
  totalTTL: number;
}

interface NewsServiceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorCount: number;
  ttlMetrics: Record<string, TtlMetric>;
}

class NewsService {
  private cacheManager = new CacheService<NewsArticle[]>();
  private stats: NewsServiceStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    errorCount: 0,
    ttlMetrics: {},
  };
  private responseTimes: number[] = [];
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  // expose cache for tests
  get cache() {
    return this.cacheManager.cache;
  }

  get MAX_CACHE_SIZE() {
    return this.cacheManager.maxSize;
  }

  set MAX_CACHE_SIZE(value: number) {
    this.cacheManager.maxSize = value;
  }

  private getCacheKey(options: NewsQueryOptions = {}): string {
    return JSON.stringify(options);
  }

  private calculateTTL(options: NewsQueryOptions, data: NewsArticle[]): number {
    let ttl = this.DEFAULT_TTL;

    if (options.category) {
      const category = options.category.toLowerCase();
      if (['breaking', 'sports'].includes(category)) {
        ttl = 60 * 1000;
      } else {
        ttl = 10 * 60 * 1000;
      }
    }

    const avgViews = data.reduce((sum, item) => sum + (item.views || 0), 0) / (data.length || 1);
    if (avgViews > 1000) {
      ttl = Math.min(ttl, 2 * 60 * 1000);
    }

    return ttl;
  }

  private updateStats(responseTime: number, fromCache: boolean, hasError = false): void {
    this.stats.totalRequests++;
    if (fromCache) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }
    if (hasError) this.stats.errorCount++;
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) this.responseTimes.shift();
    this.stats.averageResponseTime =
      this.responseTimes.reduce((sum, t) => sum + t, 0) / this.responseTimes.length;
  }

  private getFromStaticData(options: NewsQueryOptions = {}): NewsServiceResult {
    let data = [...newsArticles];

    if (options.category) {
      data = data.filter(a => a.category === options.category);
    }

    if (options.search) {
      const term = options.search.toLowerCase();
      data = data.filter(
        a => a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term)
      );
    }

    if (options.sortBy) {
      data.sort((a, b) => {
        let aValue: number | string = '';
        let bValue: number | string = '';
        switch (options.sortBy) {
          case 'date':
            aValue = new Date((a as any).publishedAt || a.date).getTime();
            bValue = new Date((b as any).publishedAt || b.date).getTime();
            break;
          case 'views':
            aValue = a.views || 0;
            bValue = b.views || 0;
            break;
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
        }
        if (aValue < bValue) return options.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return options.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = data.length;
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = start + (options.limit || total);
      data = data.slice(start, end);
    }

    return {
      success: true,
      data,
      total,
      hasMore: (options.offset || 0) + data.length < total,
      source: 'static',
      pagination: { limit: options.limit, offset: options.offset },
    };
  }

  async getPublicNews(options: NewsQueryOptions = {}): Promise<NewsServiceResult> {
    const start = Date.now();
    const key = this.getCacheKey(options);

    const cached = this.cacheManager.get(key);
    if (cached) {
      const responseTime = Date.now() - start;
      this.updateStats(responseTime, true);
      return {
        success: true,
        data: cached,
        total: cached.length,
        hasMore: false,
        source: 'cache',
        pagination: { limit: options.limit, offset: options.offset },
      };
    }

    const dynamic = featureFlags.getFlag('USE_DYNAMIC_DATA');

    try {
      let result: NewsServiceResult;
      if (dynamic) {
        try {
          const repoResult = await newsRepository.getPublicNews(options);
          result = {
            success: true,
            data: repoResult.data,
            total: repoResult.total,
            hasMore: repoResult.hasMore,
            source: 'supabase',
            pagination: { limit: options.limit, offset: options.offset },
          };
        } catch (err) {
          console.warn('Falling back to static data:', err);
          result = { ...this.getFromStaticData(options), fallbackUsed: true };
        }
      } else {
        result = this.getFromStaticData(options);
      }

      const ttl = this.calculateTTL(options, result.data);
      const metricKey = options.category || 'general';
      const metric = this.stats.ttlMetrics[metricKey] || { count: 0, totalTTL: 0 };
      metric.count++;
      metric.totalTTL += ttl;
      this.stats.ttlMetrics[metricKey] = metric;
      this.cacheManager.set(key, result.data, ttl);

      const responseTime = Date.now() - start;
      this.updateStats(responseTime, false);

      return result;
    } catch (error) {
      const responseTime = Date.now() - start;
      this.updateStats(responseTime, false, true);
      return {
        success: false,
        data: [],
        total: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getNewsById(id: string): Promise<NewsArticle | null> {
    const start = Date.now();
    const dynamic = featureFlags.getFlag('USE_DYNAMIC_DATA');
    try {
      let article: NewsArticle | null;
      if (dynamic) {
        try {
          article = await newsRepository.getNewsById(id);
        } catch (err) {
          console.warn('Falling back to static data for single article:', err);
          article = newsArticles.find(a => a.id === id) || null;
        }
      } else {
        article = newsArticles.find(a => a.id === id) || null;
      }
      const responseTime = Date.now() - start;
      this.updateStats(responseTime, false);
      return article;
    } catch (err) {
      const responseTime = Date.now() - start;
      this.updateStats(responseTime, false, true);
      console.error('Error fetching news by ID:', err);
      return null;
    }
  }

  async getRelatedNews(articleId: string, limit = 3): Promise<NewsArticle[]> {
    try {
      const current = await this.getNewsById(articleId);
      if (!current) return [];
      const result = await this.getPublicNews({ category: current.category, limit: limit + 1 });
      return result.data.filter(a => a.id !== articleId).slice(0, limit);
    } catch (err) {
      console.error('Error fetching related news:', err);
      return [];
    }
  }

  async getFeaturedNews(): Promise<NewsServiceResult> {
    const result = await this.getPublicNews();
    return { ...result, data: result.data.filter(a => (a as any).isFeatured || (a as any).featured) };
  }

  async getUrgentNews(): Promise<NewsServiceResult> {
    const result = await this.getPublicNews();
    return {
      ...result,
      data: result.data.filter(
        a => (a as any).isUrgent || (a as any).urgent || (a.tags && a.tags.includes('urgent'))
      ),
    };
  }

  getCacheSize(): number {
    return this.cacheManager.size();
  }

  clearCache(): void {
    this.cacheManager.clear();
  }

  invalidateCache(pattern?: string): void {
    this.cacheManager.invalidate(pattern);
  }

  invalidateCacheByCategory(category: string): void {
    this.invalidateCache(category);
  }

  getCacheStats() {
    return { size: this.getCacheSize() };
  }

  getServiceStats() {
    return {
      cache: this.getCacheStats(),
      requests: {
        total: this.stats.totalRequests,
        cacheHits: this.stats.cacheHits,
        cacheMisses: this.stats.cacheMisses,
      },
      errors: { total: this.stats.errorCount },
      performance: { averageResponseTime: this.stats.averageResponseTime },
    };
  }

  async incrementViews(id: string): Promise<boolean> {
    if (!featureFlags.getFlag('USE_DYNAMIC_DATA')) return false;
    try {
      return await newsRepository.incrementViews(id);
    } catch (err) {
      console.error('Error incrementing views:', err);
      return false;
    }
  }
}

const newsService = new NewsService();
export default newsService;
