import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOConfig } from '@/types/seo';
import { getDefaultSEOConfig, sanitizeForSEO, generateKeywords } from '@/utils/seo';

interface UseSEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'news' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  tags?: string[];
  canonical?: string;
}

export const useSEO = (config: UseSEOProps = {}) => {
  const location = useLocation();
  const [seoConfig, setSeoConfig] = useState<SEOConfig>(() => {
    const defaultConfig = getDefaultSEOConfig('home');
    return {
      ...defaultConfig,
      url: `${window.location.origin}${location.pathname}`,
      ...config,
    };
  });

  useEffect(() => {
    const currentUrl = `${window.location.origin}${location.pathname}`;
    
    const newConfig: SEOConfig = {
      ...getDefaultSEOConfig(getPageType(location.pathname)),
      url: currentUrl,
      ...config,
    };

    // Sanitize description
    if (newConfig.description) {
      newConfig.description = sanitizeForSEO(newConfig.description);
    }

    // Generate keywords if not provided
    if (!newConfig.keywords?.length && newConfig.description) {
      newConfig.keywords = generateKeywords(newConfig.description);
    }

    setSeoConfig(newConfig);

    // Update meta tags
    updateMetaTags(newConfig);
  }, [location.pathname, config]);

  const updateMetaTags = (config: SEOConfig) => {
    // Update title
    document.title = config.title;

    // Update meta description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', config.description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = config.description;
      document.head.appendChild(meta);
    }

    // Update Open Graph tags
    updateOpenGraphTags(config);
    
    // Update Twitter tags
    updateTwitterTags(config);
  };

  const updateOpenGraphTags = (config: SEOConfig) => {
    const ogTags = [
      { property: 'og:title', content: config.og?.title || config.title },
      { property: 'og:description', content: config.og?.description || config.description },
      { property: 'og:url', content: config.og?.url || config.url },
      { property: 'og:type', content: config.og?.type || config.type },
      { property: 'og:site_name', content: config.og?.siteName || config.siteName },
      { property: 'og:locale', content: config.og?.locale || config.locale },
      { property: 'og:image', content: config.og?.image || config.image },
    ];

    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content || '');
    });
  };

  const updateTwitterTags = (config: SEOConfig) => {
    if (!config.twitter) return;

    const twitterTags = [
      { name: 'twitter:card', content: config.twitter.card },
      { name: 'twitter:title', content: config.title },
      { name: 'twitter:description', content: config.description },
      { name: 'twitter:image', content: config.image },
    ];

    if (config.twitter.site) {
      twitterTags.push({ name: 'twitter:site', content: config.twitter.site });
    }

    if (config.twitter.creator) {
      twitterTags.push({ name: 'twitter:creator', content: config.twitter.creator });
    }

    twitterTags.forEach(tag => {
      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.name = tag.name;
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content || '');
    });
  };

  const generateArticleSchema = (data: {
    title: string;
    description: string;
    image: string[];
    publishedAt: string;
    modifiedAt: string;
    author: string;
    authorUrl?: string;
    category: string;
    tags: string[];
    url: string;
  }) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: data.title,
      description: data.description,
      image: data.image,
      datePublished: new Date(data.publishedAt).toISOString(),
      dateModified: new Date(data.modifiedAt).toISOString(),
      author: {
        '@type': 'Person',
        name: data.author,
        url: data.authorUrl || `${window.location.origin}/autores/${data.author.toLowerCase().replace(/\s+/g, '-')}`
      },
      publisher: {
        '@type': 'Organization',
        name: 'UbaNews',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo-schema.png`
        }
      },
      articleSection: data.category,
      keywords: data.tags,
      url: data.url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url
      }
    });

    document.head.appendChild(script);
    return () => script.remove();
  };

  const generateBreadcrumbSchema = (items: Array<{
    name: string;
    url: string;
  }>) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    });

    document.head.appendChild(script);
    return () => script.remove();
  };

  const getPageType = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/noticia/')) return 'article';
    if (pathname.startsWith('/categoria/')) return 'category';
    if (pathname === '/noticias') return 'news';
    if (pathname === '/busca') return 'search';
    return 'default';
  };

  return {
    seoConfig,
    generateArticleSchema,
    generateBreadcrumbSchema,
    updateMetaTags,
  };
};