import React, { Suspense, useEffect } from "react";
import MobileHeader from "@/components/MobileHeader";
import HeroBanner from "@/components/HeroBanner";
import { LoadingSpinner } from "@/components/LazyComponents";
import Footer from "@/components/Footer";
import { TrendingUp, Radar } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { NewsletterSubscription } from "@/components/Newsletter/NewsletterSubscription";

const MobileNewsFeed = React.lazy(() => import("@/components/MobileNewsFeed"));

const Index = () => {
  const { seoConfig, generateBreadcrumbSchema } = useSEO({
    title: "UbaNews - Notícias de Ubatuba e Litoral Norte",
    description: "Acompanhe as últimas notícias de Ubatuba e região do Litoral Norte. Informação atualizada sobre política, economia, esportes, cultura e muito mais.",
    keywords: ["notícias", "Ubatuba", "litoral norte", "São Paulo", "política", "economia", "esportes", "cultura"],
    type: "website",
  });

  useEffect(() => {
    // Generate breadcrumb schema for homepage
    const cleanup = generateBreadcrumbSchema([
      { name: "Início", url: "https://ubanews.com.br" }
    ]);

    return cleanup;
  }, [generateBreadcrumbSchema]);

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main id="main-content" role="main" aria-label="Conteúdo principal">
        <HeroBanner />
        
        <section aria-label="Notícias em destaque">
          <Suspense fallback={<LoadingSpinner message="Carregando notícias..." />}>
            <MobileNewsFeed
              title="📡 Radar da Semana"
              icon={<Radar className="w-5 h-5 text-accent" />}
              variant="featured"
              showFilters={true}
            />
          </Suspense>
        </section>

        <section aria-label="Notícias mais lidas">
          <Suspense fallback={<LoadingSpinner message="Carregando notícias..." />}>
            <MobileNewsFeed
              title="Mais Lidas da Semana"
              icon={<TrendingUp className="w-5 h-5 text-accent" />}
              variant="list"
              showFilters={false}
            />
          </Suspense>
        </section>
      </main>
      
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <NewsletterSubscription />
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
