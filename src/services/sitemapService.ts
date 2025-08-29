import { supabase } from '@/lib/supabase';
import { SitemapEntry, NewsSitemapEntry } from '@/types/seo';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://ubanews.com.br';

export class SitemapService {
  static async generateSitemap(): Promise<string> {
    const entries = await this.getAllSitemapEntries();
    return this.formatSitemap(entries);
  }

  static async generateNewsSitemap(): Promise<string> {
    const newsEntries = await this.getNewsSitemapEntries();
    return this.formatNewsSitemap(newsEntries);
  }

  private static async getAllSitemapEntries(): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];

    // Static pages
    const staticPages = [
      { url: '/', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
      { url: '/noticias', lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
      { url: '/categorias', lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
      { url: '/sobre', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: '/contato', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: '/politica-privacidade', lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
      { url: '/termos-uso', lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    ];

    entries.push(...staticPages.map(page => ({
      url: `${SITE_URL}${page.url}`,
      lastModified: page.lastModified.toISOString(),
      changeFrequency: page.changeFrequency,
      priority: page.priority
    })));

    // News articles
    const { data: news, error } = await supabase
      .from('admin_news')
      .select('id, title, slug, published_at, updated_at, category, tags, author')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && news) {
      entries.push(...news.map(article => ({
        url: `${SITE_URL}/noticia/${article.slug || article.id}`,
        lastModified: new Date(article.updated_at || article.published_at).toISOString(),
        changeFrequency: 'daily' as const,
        priority: 0.8
      })));
    }

    // Categories
    const categories = ['politica', 'economia', 'esportes', 'cultura', 'turismo', 'saude', 'educacao', 'meio-ambiente'];
    entries.push(...categories.map(category => ({
      url: `${SITE_URL}/categoria/${category}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.7
    })));

    return entries;
  }

  private static async getNewsSitemapEntries(): Promise<NewsSitemapEntry[]> {
    const { data: news, error } = await supabase
      .from('admin_news')
      .select('id, title, slug, published_at, category, tags, author, image_url')
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()) // Last 2 days
      .order('published_at', { ascending: false });

    if (error || !news) {
      return [];
    }

    return news.map(article => ({
      url: `${SITE_URL}/noticia/${article.slug || article.id}`,
      lastModified: new Date(article.published_at).toISOString(),
      changeFrequency: 'daily',
      priority: 0.8,
      title: article.title,
      keywords: article.tags || [],
      publicationDate: new Date(article.published_at).toISOString(),
      categories: [article.category],
      author: article.author || 'Redação UbaNews',
      image: article.image_url || `${SITE_URL}/og-default.jpg`
    }));
  }

  private static formatSitemap(entries: SitemapEntry[]): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(entry => `  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  private static formatNewsSitemap(entries: NewsSitemapEntry[]): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map(entry => `  <url>
    <loc>${this.escapeXml(entry.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>UbaNews</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${entry.publicationDate}</news:publication_date>
      <news:title>${this.escapeXml(entry.title)}</news:title>
      <news:keywords>${entry.keywords.map(k => this.escapeXml(k)).join(', ')}</news:keywords>
    </news:news>
    <image:image>
      <image:loc>${this.escapeXml(entry.image)}</image:loc>
    </image:image>
  </url>`).join('\n')}
</urlset>`;

    return xml;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  static async pingSearchEngines(): Promise<void> {
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    
    // Google
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    } catch (error) {
      console.warn('Failed to ping Google:', error);
    }

    // Bing
    try {
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    } catch (error) {
      console.warn('Failed to ping Bing:', error);
    }
  }

  static async getLastModifiedDate(table: string, id?: string): Promise<string> {
    let query = supabase
      .from(table)
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (id) {
      query = query.eq('id', id);
    }

    const { data, error } = await query;
    
    if (error || !data || data.length === 0) {
      return new Date().toISOString();
    }

    return new Date(data[0].updated_at).toISOString();
  }
}