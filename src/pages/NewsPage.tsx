import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { NewsDetail } from '../components/NewsDetail';
import { getNewsById } from '../data/newsData';
import newsService from '../services/newsService';
import { useDynamicData, useMigrationMetrics } from '../hooks/useFeatureFlags';
import { NewsArticle } from '@/shared/types/news';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { SEOArticle } from '@/components/SEO/SEOArticle';

const NewsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { useDynamic } = useDynamicData();
  const { recordLoadTime, recordError } = useMigrationMetrics();
  
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!id) {
      return;
    }
    const loadArticle = async () => {
      const startTime = Date.now();
      setLoading(true);
      setError(null);
      
      try {
        let foundArticle: NewsArticle | null = null;
        
        if (useDynamic) {
          // Tentar buscar dados dinâmicos primeiro
          try {
            foundArticle = await newsService.getNewsById(id);
          } catch (dynamicError) {
            console.warn('Erro ao buscar notícia dinâmica, usando fallback estático:', dynamicError);
            recordError();
            // Fallback para dados estáticos
            foundArticle = getNewsById(id) || null;
          }
        } else {
          // Usar dados estáticos diretamente
          foundArticle = getNewsById(id) || null;
        }
        
        if (foundArticle) {
          setArticle(foundArticle);
          // Incrementar visualizações se usando dados dinâmicos
          if (useDynamic) {
            try {
              await newsService.incrementViews(id);
            } catch (viewError) {
              console.warn('Erro ao incrementar visualizações:', viewError);
            }
          }
        } else {
          setError('Notícia não encontrada');
        }
        
        const loadTime = Date.now() - startTime;
        recordLoadTime(loadTime);
      } catch (err) {
        console.error('Erro ao carregar notícia:', err);
        recordError();
        setError('Erro ao carregar a notícia');
      } finally {
        setLoading(false);
      }
    };
    
    loadArticle();
  }, [id, useDynamic, recordLoadTime, recordError]);
  
  if (!id) {
    return <Navigate to="/" replace />;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">
                Carregando notícia{useDynamic ? ' (dinâmica)' : ''}...
              </span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Error state or article not found
  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {error || 'Notícia não encontrada'}
              </h2>
              {useDynamic && error && (
                <p className="text-sm text-amber-600 mb-4">
                  💡 Tentando usar dados estáticos como fallback...
                </p>
              )}
              <button
                onClick={() => window.history.back()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
              >
                Voltar
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <SEOArticle newsData={article}>
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <main className="container mx-auto px-4 py-6">
          <NewsDetail 
            article={article} 
            onBack={() => window.history.back()}
          />
        </main>
        <Footer />
      </div>
    </SEOArticle>
  );
};

export default NewsPage;