import MobileHeader from "@/components/MobileHeader";
import HeroBanner from "@/components/HeroBanner";
import MobileNewsFeed from "@/components/MobileNewsFeed";
import MostReadSection from "@/components/MostReadSection";
import Footer from "@/components/Footer";
import { TrendingUp, Radar } from "lucide-react";
import { usePagePerformance, useComponentPerformance } from "@/hooks/useWebVitals";

const Index = () => {
  // Monitor page performance
  const pageMetrics = usePagePerformance('Home Page');
  const { renderTime, markInteraction } = useComponentPerformance('Index');

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main id="main-content" role="main" aria-label="Conteúdo principal">
        <HeroBanner />
        
        <section aria-label="Notícias em destaque">
          <MobileNewsFeed 
            title="📡 Radar da Semana"
            icon={<Radar className="w-5 h-5 text-accent" />}
            variant="featured"
            showFilters={true}
          />
        </section>
        
        <section aria-label="Notícias mais lidas">
          <MobileNewsFeed 
            title="Mais Lidas da Semana"
            icon={<TrendingUp className="w-5 h-5 text-accent" />}
            variant="list"
            showFilters={false}
          />
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
