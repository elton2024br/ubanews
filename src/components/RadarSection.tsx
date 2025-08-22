import NewsCard from "./NewsCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";

const RadarSection = () => {
  const newsData = [
    {
      title: "Nova UPA do Centro começa a atender 24h a partir de segunda-feira",
      summary: "Unidade de Pronto Atendimento opera com 50 leitos e equipe médica especializada para emergências. A população já pode contar com os serviços.",
      date: "24 Jul, 2024",
      category: "Saúde",
      readTime: "2 min de leitura",
      views: "1.2k visualizações"
    },
    {
      title: "Escolas municipais adotam novo sistema de matrícula online",
      summary: "Pais poderão realizar matrículas e transferências pela portal da prefeitura a partir do próximo ano. Sistema deve agilizar os processos.",
      date: "24 Jul, 2024",
      category: "Educação",
      readTime: "3 min de leitura",
      views: "954 visualizações"
    },
    {
      title: "Nova linha de ônibus ligará Perequê-Mirim ao Centro",
      summary: "Linha 307 fará a ligação com horários regulares que facilitarão a locomoção dos moradores da região central.",
      date: "24 Jul, 2024",
      category: "Transporte",
      readTime: "2 min de leitura",
      views: "743 visualizações"
    },
    {
      title: "Praça do Ipanema recebe revitalização e novo parquinho",
      summary: "Obra inclui nova iluminação, academia ao ar livre e equipamentos modernos para o lazer das famílias do bairro.",
      date: "23 Jul, 2024",
      category: "Infraestrutura",
      readTime: "2 min de leitura",
      views: "892 visualizações"
    },
    {
      title: "Mutirão de saúde oferecerá exames gratuitos no fim de semana",
      summary: "Ação terá testagem para diabetes, aferição de pressão arterial e consultas básicas no posto de saúde de Perequê.",
      date: "23 Jul, 2024",
      category: "Saúde",
      readTime: "2 min de leitura",
      views: "445 visualizações"
    },
    {
      title: "Professores participam de capacitação em tecnologia educacional",
      summary: "Projeto da Secretaria Municipal de Educação oferece treinamentos digitais para modernizar o ensino nas escolas municipais.",
      date: "22 Jul, 2024",
      category: "Educação",
      readTime: "3 min de leitura",
      views: "321 visualizações"
    }
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">📡 Radar da Semana</h2>
          <Button variant="news-ghost" className="text-accent hover:text-accent/80">
            Ver tudo
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* Filter Bar */}
        <div className="flex items-center space-x-4 mb-8 p-4 bg-muted/30 rounded-lg">
          <span className="text-sm font-medium text-foreground">Filtrar por:</span>
          <Button variant="ghost" size="sm" className="text-xs">
            Todas categorias
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Todos bairros
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Ordenar por
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            Mais recentes
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Mais lidas
          </Button>
        </div>
        
        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsData.map((news, index) => (
            <NewsCard key={index} {...news} />
          ))}
        </div>
        
        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Carregar mais notícias
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RadarSection;