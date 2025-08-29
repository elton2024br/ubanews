export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  author?: string;
  image?: string;
  url: string;
  type: 'website' | 'article' | 'news' | 'profile';
  siteName: string;
  locale: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  robots?: string;
  twitter?: {
    card: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
  };
  og?: {
    title: string;
    description: string;
    image?: string;
    url: string;
    type: string;
    siteName: string;
    locale: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
}

export interface SchemaOrgArticle {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  articleSection?: string;
  keywords?: string[];
  url: string;
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
}

export interface SchemaOrgBreadcrumb {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

export interface SchemaOrgOrganization {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint?: {
    '@type': string;
    telephone?: string;
    email?: string;
    contactType: string;
  };
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface Sitemap {
  entries: SitemapEntry[];
  generatedAt: string;
}

export interface NewsSitemapEntry extends SitemapEntry {
  title: string;
  keywords: string[];
  publicationDate: string;
  categories: string[];
  author: string;
  image: string;
}