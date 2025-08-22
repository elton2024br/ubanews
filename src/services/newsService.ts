import { supabase } from '../lib/supabase';
import { newsArticles } from '../data/newsData';
import { NewsArticle } from '../types/news';

interface NewsServiceOptions {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  sortBy?: 'date' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface NewsServiceResult {
  success: boolean;
  data: NewsArticle[];
  total: number;
  hasMore: boolean;
  error?: string;
}

interface NewsServiceStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorCount: number;
}

class NewsService {
  private cache = new Map<string, { data: NewsArticle[]; timestamp: number; ttl: number }>();
  private stats: NewsServiceStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    errorCount: 0,
  };
  private responseTimes: number[] = [];
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private useDynamicData = false;

  constructor() {
    // Check if we should use dynamic data based on environment or feature flags
    this.useDynamicData = process.env.NODE_ENV !== 'test';
  }

  setDynamicMode(enabled: boolean) {
    this.useDynamicData = enabled;
  }

  private getCacheKey(options: NewsServiceOptions = {}): string {
    return JSON.stringify(options);
  }

  private isValidCacheEntry(entry: { data: NewsArticle[]; timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private addToCache(key: string, data: NewsArticle[], ttl: number = this.DEFAULT_TTL) {
    // Implement LRU-like behavior
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private updateStats(responseTime: number, fromCache: boolean, hasError: boolean = false) {
    this.stats.totalRequests++;
    
    if (fromCache) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }

    if (hasError) {
      this.stats.errorCount++;
    }

    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    this.stats.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  private async fetchFromSupabase(options: NewsServiceOptions = {}): Promise<NewsServiceResult> {
    try {
      let query = supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.search?.trim()) {
        const searchText = options.search.trim();
        query = query
          .textSearch('title', searchText, { type: 'websearch' })
          .textSearch('content', searchText, { type: 'websearch' });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || [],
        total: count || 0,
        hasMore: (options.offset || 0) + (data?.length || 0) < (count || 0),
      };
    } catch (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }
  }

  private getFromStaticData(options: NewsServiceOptions = {}): NewsServiceResult {
    let filteredData = [...newsArticles];

    // Apply category filter
    if (options.category) {
      filteredData = filteredData.filter(article => article.category === options.category);
    }

    // Apply search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filteredData = filteredData.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filteredData.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'date':
            aValue = new Date(a.publishedAt);
            bValue = new Date(b.publishedAt);
            break;
          case 'views':
            aValue = a.views || 0;
            bValue = b.views || 0;
            break;
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          default:
            return 0;
        }

        if (options.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || filteredData.length;
    const paginatedData = filteredData.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedData,
      total: filteredData.length,
      hasMore: offset + paginatedData.length < filteredData.length,
    };
  }

  async getPublicNews(options: NewsServiceOptions = {}): Promise<NewsServiceResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(options);

    try {
      // Check cache first
      const cachedEntry = this.cache.get(cacheKey);
      if (cachedEntry && this.isValidCacheEntry(cachedEntry)) {
        const responseTime = Date.now() - startTime;
        this.updateStats(responseTime, true);
        return {
          success: true,
          data: cachedEntry.data,
          total: cachedEntry.data.length,
          hasMore: false, // Cache doesn't store pagination info
        };
      }

      let result: NewsServiceResult;

      if (this.useDynamicData) {
        try {
          result = await this.fetchFromSupabase(options);
        } catch (error) {
          console.warn('Falling back to static data due to Supabase error:', error);
          result = this.getFromStaticData(options);
        }
      } else {
        result = this.getFromStaticData(options);
      }

      // Cache the result
      if (result.success) {
        this.addToCache(cacheKey, result.data);
      }

      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false, !result.success);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false, true);
      
      console.error('NewsService error:', error);
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
    const startTime = Date.now();

    try {
      if (this.useDynamicData) {
        try {
          const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', id)
            .eq('status', 'published')
            .single();

          if (error) {
            throw new Error(error.message);
          }

          // Increment view count
          if (data) {
            await supabase
              .from('news')
              .update({ views: (data.views || 0) + 1 })
              .eq('id', id);
            
            data.views = (data.views || 0) + 1;
          }

          const responseTime = Date.now() - startTime;
          this.updateStats(responseTime, false);

          return data;
        } catch (error) {
          console.warn('Falling back to static data for single article:', error);
          // Fall back to static data
          const article = newsArticles.find(article => article.id === id);
          const responseTime = Date.now() - startTime;
          this.updateStats(responseTime, false);
          return article || null;
        }
      } else {
        const article = newsArticles.find(article => article.id === id);
        const responseTime = Date.now() - startTime;
        this.updateStats(responseTime, false);
        return article || null;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false, true);
      console.error('Error fetching news by ID:', error);
      return null;
    }
  }

  async getRelatedNews(articleId: string, limit: number = 3): Promise<NewsArticle[]> {
    try {
      const currentArticle = await this.getNewsById(articleId);
      if (!currentArticle) return [];

      const options: NewsServiceOptions = {
        category: currentArticle.category,
        limit: limit + 1, // Get one extra to exclude current article
      };

      const result = await this.getPublicNews(options);
      
      return result.data
        .filter(article => article.id !== articleId)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching related news:', error);
      return [];
    }
  }

  getStats(): NewsServiceStats {
    return { ...this.stats };
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache();
      return;
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  async incrementViews(id: string): Promise<boolean> {
    try {
      if (this.useDynamicData) {
        const { error } = await supabase
          .from('news')
          .update({ views: supabase.sql('views + 1') })
          .eq('id', id);
        
        return !error;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return false;
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
const newsService = new NewsService();
export default newsService;