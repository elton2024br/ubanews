import React, { useState, useMemo } from 'react';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { MobileNewsCard } from '../components/MobileNewsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicNews } from '../hooks/usePublicNews';
import { NewsItem } from '../types/news';
import { Newspaper, TrendingUp, MapPin, Users, Building, Heart, Leaf, Car, GraduationCap, AlertTriangle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count?: number;
}

const categories: Category[] = [
  {
    id: 'politica',
    name: 'Política',
    description: 'Notícias sobre política local, estadual e federal',
    icon: Newspaper,
    color: 'bg-blue-500'
  },
  {
    id: 'economia',
    name: 'Economia',
    description: 'Negócios, mercado, finanças e desenvolvimento econômico',
    icon: TrendingUp,
    color: 'bg-green-500'
  },
  {
    id: 'infraestrutura',
    name: 'Infraestrutura',
    description: 'Obras, transporte, energia e desenvolvimento urbano',
    icon: Building,
    color: 'bg-orange-500'
  },
  {
    id: 'saude',
    name: 'Saúde',
    description: 'Notícias sobre saúde pública, hospitais e bem-estar',
    icon: Heart,
    color: 'bg-red-500'
  },
  {
    id: 'educacao',
    name: 'Educação',
    description: 'Escolas, universidades, políticas educacionais e eventos',
    icon: GraduationCap,
    color: 'bg-purple-500'
  },
  {
    id: 'meio-ambiente',
    name: 'Meio Ambiente',
    description: 'Natureza, sustentabilidade, clima e preservação',
    icon: Leaf,
    color: 'bg-emerald-500'
  },
  {
    id: 'turismo',
    name: 'Turismo',
    description: 'Eventos, atrações, hospedagem e economia turística',
    icon: MapPin,
    color: 'bg-teal-500'
  },
  {
    id: 'seguranca',
    name: 'Segurança',
    description: 'Polícia, crimes, trânsito e segurança pública',
    icon: AlertTriangle,
    color: 'bg-yellow-500'
  },
  {
    id: 'esportes',
    name: 'Esportes',
    description: 'Futebol, competições, atletas e eventos esportivos',
    icon: Car,
    color: 'bg-indigo-500'
  },
  {
    id: 'comunidade',
    name: 'Comunidade',
    description: 'Eventos locais, associações, cultura e sociedade',
    icon: Users,
    color: 'bg-pink-500'
  }
];

const Categories: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { news, loading, error } = usePublicNews();

  // Filtrar notícias por categoria
  const categorizedNews = useMemo(() => {
    if (!news) return {};
    
    const categorized: Record<string, NewsItem[]> = {};
    categories.forEach(cat => {
      categorized[cat.id] = news.filter(item => 
        item.category?.toLowerCase() === cat.name.toLowerCase()
      );
    });
    
    return categorized;
  }, [news]);

  // Contar notícias por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = categorizedNews[cat.id]?.length || 0;
    });
    return counts;
  }, [categorizedNews]);

  // Notícias mais recentes (todas as categorias)
  const latestNews = useMemo(() => {
    if (!news) return [];
    return [...news]
      .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
      .slice(0, 6);
  }, [news]);

  // Notícias mais lidas
  const trendingNews = useMemo(() => {
    if (!news) return [];
    return [...news]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 6);
  }, [news]);

  const renderNewsGrid = (items: NewsItem[]) => {
    if (loading) {
      return (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma notícia encontrada</h3>
          <p className="text-muted-foreground">
            Não há notícias disponíveis nesta categoria no momento.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {items.map((item) => (
          <MobileNewsCard key={item.id} news={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Categorias
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Explore as notícias organizadas por tema. Encontre rapidamente as informações que você procura.
          </p>
        </section>

        {/* Categories Overview */}
        <section className="mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Todas as Categorias</CardTitle>
              <CardDescription>
                Clique em uma categoria para ver as notícias relacionadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = categoryCounts[category.id];
                  
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center space-y-2 text-center"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className={`p-2 rounded-full ${category.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count} notícias
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* News by Category */}
        <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="latest">Recentes</TabsTrigger>
            <TabsTrigger value="trending">Populares</TabsTrigger>
            {categories.slice(0, 3).map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Todas as Notícias</h2>
              {renderNewsGrid(news || [])}
            </div>
          </TabsContent>

          <TabsContent value="latest" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Notícias Recentes</h2>
              {renderNewsGrid(latestNews)}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Mais Lidas</h2>
              {renderNewsGrid(trendingNews)}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-full ${category.color} text-white`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                {renderNewsGrid(categorizedNews[category.id] || [])}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {error && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar notícias</h3>
            <p className="text-muted-foreground">
              Não foi possível carregar as notícias. Tente novamente mais tarde.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;