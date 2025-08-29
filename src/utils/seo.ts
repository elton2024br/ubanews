import { SEOConfig, SchemaOrgArticle, SchemaOrgBreadcrumb, SchemaOrgOrganization, SitemapEntry, NewsSitemapEntry } from '@/types/seo';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://ubanews.com.br';
const SITE_NAME = 'UbaNews';
const SITE_DESCRIPTION = 'Notícias de Ubatuba e região em tempo real. Acompanhe tudo sobre política, turismo, cultura e muito mais.';

export const generateMetaTags = (config: SEOConfig): HTMLMetaElement[] => {
  const metaTags: HTMLMetaElement[] = [
    { name: 'title', content: config.title },
    { name: 'description', content: config.description },
    { name: 'keywords', content: config.keywords.join(', ') },
    { name: 'author', content: config.author || SITE_NAME },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'robots', content: config.robots || 'index, follow' },
    { name: 'canonical', content: config.canonical || config.url },
    { property: 'og:title', content: config.og?.title || config.title },
    { property: 'og:description', content: config.og?.description || config.description },
    { property: 'og:url', content: config.og?.url || config.url },
    { property: 'og:type', content: config.og?.type || config.type },
    { property: 'og:site_name', content: config.og?.siteName || SITE_NAME },
    { property: 'og:locale', content: config.og?.locale || config.locale },
    { property: 'og:image', content: config.og?.image || config.image || `${SITE_URL}/og-default.jpg` },
  ];

  if (config.og?.publishedTime) {
    metaTags.push({ property: 'article:published_time', content: config.og.publishedTime });
  }

  if (config.og?.modifiedTime) {
    metaTags.push({ property: 'article:modified_time', content: config.og.modifiedTime });
  }

  if (config.og?.section) {
    metaTags.push({ property: 'article:section', content: config.og.section });
  }

  if (config.og?.tags) {
    config.og.tags.forEach(tag => {
      metaTags.push({ property: 'article:tag', content: tag });
    });
  }

  if (config.twitter) {
    metaTags.push(
      { name: 'twitter:card', content: config.twitter.card },
      { name: 'twitter:title', content: config.title },
      { name: 'twitter:description', content: config.description },
      { name: 'twitter:image', content: config.image || `${SITE_URL}/twitter-default.jpg` }
    );

    if (config.twitter.site) {
      metaTags.push({ name: 'twitter:site', content: config.twitter.site });
    }

    if (config.twitter.creator) {
      metaTags.push({ name: 'twitter:creator', content: config.twitter.creator });
    }
  }

  return metaTags;
};

export const generateSchemaOrgArticle = (data: {
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
}): SchemaOrgArticle => {
  return {
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
      url: data.authorUrl || `${SITE_URL}/autores/${data.author.toLowerCase().replace(/\s+/g, '-')}`
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-schema.png`
      }
    },
    articleSection: data.category,
    keywords: data.tags,
    url: data.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url
    }
  };
};

export const generateSchemaOrgBreadcrumb = (items: Array<{
  name: string;
  url: string;
}>): SchemaOrgBreadcrumb => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
};

export const generateSchemaOrgOrganization = (): SchemaOrgOrganization => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://www.facebook.com/ubanews',
      'https://twitter.com/ubanews',
      'https://instagram.com/ubanews',
      'https://www.youtube.com/ubanews'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contato@ubanews.com.br',
      contactType: 'customer service'
    }
  };
};

export const generateSitemapEntry = (data: {
  url: string;
  lastModified: string;
  changeFrequency: SitemapEntry['changeFrequency'];
  priority: number;
}): SitemapEntry => {
  return {
    url: data.url,
    lastModified: new Date(data.lastModified).toISOString(),
    changeFrequency: data.changeFrequency,
    priority: data.priority
  };
};

export const generateNewsSitemapEntry = (data: {
  url: string;
  title: string;
  publishedAt: string;
  keywords: string[];
  categories: string[];
  author: string;
  image: string;
}): NewsSitemapEntry => {
  return {
    url: data.url,
    lastModified: new Date(data.publishedAt).toISOString(),
    changeFrequency: 'daily',
    priority: 0.8,
    title: data.title,
    keywords: data.keywords,
    publicationDate: new Date(data.publishedAt).toISOString(),
    categories: data.categories,
    author: data.author,
    image: data.image
  };
};

export const getDefaultSEOConfig = (page: string): SEOConfig => {
  const configs: Record<string, SEOConfig> = {
    home: {
      title: `${SITE_NAME} - Notícias de Ubatuba em Tempo Real`,
      description: SITE_DESCRIPTION,
      keywords: ['ubatuba', 'notícias', 'turismo', 'política', 'cultura', 'esportes'],
      url: SITE_URL,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'pt_BR',
      twitter: {
        card: 'summary_large_image',
        site: '@ubanews',
        creator: '@ubanews'
      }
    },
    news: {
      title: `Notícias - ${SITE_NAME}`,
      description: 'Todas as notícias de Ubatuba e região organizadas por categoria e data.',
      keywords: ['notícias', 'últimas notícias', 'ubatuba', 'região'],
      url: `${SITE_URL}/noticias`,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'pt_BR'
    },
    search: {
      title: `Buscar - ${SITE_NAME}`,
      description: 'Encontre notícias específicas no UbaNews.',
      keywords: ['busca', 'pesquisa', 'notícias', 'ubatuba'],
      url: `${SITE_URL}/busca`,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'pt_BR'
    }
  };

  return configs[page] || configs.home;
};

export const sanitizeForSEO = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .substring(0, 160); // Limit to 160 chars for meta description
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim();
};

export const generateKeywords = (text: string, maxKeywords: number = 10): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter((word, index, self) => self.indexOf(word) === index);

  const commonWords = new Set(['para', 'com', 'por', 'uma', 'uma', 'dos', 'das', 'que', 'como', 'mais', 'muito', 'sobre', 'entre', 'quando', 'sempre', 'pode', 'cada', 'seu', 'sua', 'ser']);
  
  return words
    .filter(word => !commonWords.has(word))
    .slice(0, maxKeywords);
};