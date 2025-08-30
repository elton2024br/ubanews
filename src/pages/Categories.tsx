import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { MobileNewsCard } from '../components/MobileNewsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsByCategory } from '@/hooks/useNewsByCategory';
import { NewsArticle } from '@/shared/types/news';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = useNewsByCategory(selectedCategory ?? undefined);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const renderNewsGrid = () => {
    if (isLoading) {
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

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar notícias</h3>
          <p className="text-muted-foreground">{(error as Error).message}</p>
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
        {items.map(item => (
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
                  const count =
                    (queryClient.getQueryData<NewsArticle[]>([
                      'news-by-category',
                      category.id,
                    ]) || []).length;

                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center space-y-2 text-center"
                      onClick={() => handleCategorySelect(category.id)}
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

        {selectedCategory && (
          <section className="space-y-6">
            {(() => {
              const category = categories.find(cat => cat.id === selectedCategory);
              if (!category) return null;
              const Icon = category.icon;
              return (
                <>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-full ${category.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category.name}</h2>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  {renderNewsGrid()}
                </>
              );
            })()}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Categories;
