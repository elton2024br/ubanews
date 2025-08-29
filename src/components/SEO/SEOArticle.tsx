import React, { useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { SEOConfig } from '@/types/seo';

interface SEOArticleProps {
  newsData: {
    id: string;
    title: string;
    content: string;
    excerpt?: string;
    summary?: string;
    image?: {
      src: string;
      alt: string;
    };
    image_url?: string;
    date?: string;
    published_at?: string;
    updated_at?: string;
    category: string;
    author?: string;
    tags?: string[];
  };
  children: React.ReactNode;
}

export const SEOArticle: React.FC<SEOArticleProps> = ({ newsData, children }) => {
  const description = newsData.summary || newsData.excerpt || newsData.content.substring(0, 160);
  const imageUrl = newsData.image_url || newsData.image?.src;
  const publishedTime = newsData.published_at || newsData.date;
  const modifiedTime = newsData.updated_at || newsData.date;
  const authorName = newsData.author || 'UbaNews';
  const categoryName = newsData.category;

  const { seoConfig, generateArticleSchema, generateBreadcrumbSchema } = useSEO({
    title: newsData.title,
    description,
    keywords: newsData.tags || [categoryName],
    image: imageUrl,
    type: 'article',
    publishedTime,
    modifiedTime,
    author: authorName,
    category: categoryName,
  });

  useEffect(() => {
    // Generate article schema
    const cleanupArticle = generateArticleSchema({
      title: newsData.title,
      description,
      image: imageUrl ? [imageUrl] : [`${window.location.origin}/default-news-image.jpg`],
      publishedAt: publishedTime,
      modifiedAt: modifiedTime,
      author: authorName,
      authorUrl: `${window.location.origin}/autores/${authorName.toLowerCase().replace(/\s+/g, '-')}`,
      category: categoryName,
      tags: newsData.tags || [categoryName],
      url: `${window.location.origin}/noticia/${newsData.id}`,
    });

    // Generate breadcrumb schema
    const cleanupBreadcrumb = generateBreadcrumbSchema([
      { name: "Início", url: "https://ubanews.com.br" },
      { name: categoryName, url: `https://ubanews.com.br/categoria/${categoryName.toLowerCase()}` },
      { name: newsData.title, url: `https://ubanews.com.br/noticia/${newsData.id}` }
    ]);

    return () => {
      cleanupArticle();
      cleanupBreadcrumb();
    };
  }, [newsData, description, imageUrl, publishedTime, modifiedTime, authorName, categoryName, generateArticleSchema, generateBreadcrumbSchema]);

  return (
    <>
      {/* SEO meta tags are handled by the useSEO hook */}
      {children}
    </>
  );
};

export const SEOCategory: React.FC<{
  categoryName: string;
  categoryDescription?: string;
  children: React.ReactNode;
}> = ({ categoryName, categoryDescription, children }) => {
  const { seoConfig, generateBreadcrumbSchema } = useSEO({
    title: `${categoryName} - UbaNews`,
    description: categoryDescription || `Todas as notícias sobre ${categoryName.toLowerCase()} em Ubatuba e região do Litoral Norte.`,
    keywords: [categoryName.toLowerCase(), 'notícias', 'Ubatuba', 'litoral norte'],
    type: 'website',
  });

  useEffect(() => {
    const cleanup = generateBreadcrumbSchema([
      { name: "Início", url: "https://ubanews.com.br" },
      { name: categoryName, url: `https://ubanews.com.br/categoria/${categoryName.toLowerCase()}` }
    ]);

    return cleanup;
  }, [categoryName, generateBreadcrumbSchema]);

  return <>{children}</>;
};