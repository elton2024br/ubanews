import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { SEOConfig } from '@/types/seo';
import { generateMetaTags, generateSchemaOrgArticle, generateSchemaOrgBreadcrumb, generateSchemaOrgOrganization } from '@/utils/seo';

interface SEOManagerProps {
  config: SEOConfig;
  schema?: {
    type: 'article' | 'breadcrumb' | 'organization' | 'custom';
    data?: any;
  };
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  children?: React.ReactNode;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  config,
  schema,
  breadcrumbs,
  children
}) => {
  useEffect(() => {
    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    if (schema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';

      switch (schema.type) {
        case 'article':
          script.textContent = JSON.stringify(generateSchemaOrgArticle(schema.data));
          break;
        case 'breadcrumb':
          if (breadcrumbs) {
            script.textContent = JSON.stringify(generateSchemaOrgBreadcrumb(breadcrumbs));
          }
          break;
        case 'organization':
          script.textContent = JSON.stringify(generateSchemaOrgOrganization());
          break;
        case 'custom':
          script.textContent = JSON.stringify(schema.data);
          break;
      }

      document.head.appendChild(script);
    }

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [schema, breadcrumbs]);

  const metaTags = generateMetaTags(config);

  return (
    <>
      <Helmet>
        <title>{config.title}</title>
        {metaTags.map((meta, index) => {
          if (meta.property) {
            return <meta key={index} property={meta.property} content={meta.content} />;
          }
          return <meta key={index} name={meta.name} content={meta.content} />;
        })}
        <link rel="canonical" href={config.canonical || config.url} />
      </Helmet>
      {children}
    </>
  );
};

export default SEOManager;