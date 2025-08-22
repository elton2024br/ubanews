import { TrendingUp, Clock } from "lucide-react";

interface MostReadItemProps {
  title: string;
  category: string;
  time: string;
  views: string;
}

const MostReadItem = ({ title, category, time, views }: MostReadItemProps) => (
  <div className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer group">
    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
    <div className="flex-1">
      <h4 className="font-medium text-foreground group-hover:text-accent transition-colors mb-1">
        {title}
      </h4>
      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
        <span>{category}</span>
        <span>•</span>
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{time}</span>
        </span>
        <span>•</span>
        <span>{views}</span>
      </div>
    </div>
  </div>
);

const MostReadSection = () => {
  const mostReadNews = [
    {
      title: "Prefeitura anuncia reforma do calçadão da Praia Grande",
      category: "Infraestrutura",
      time: "3.5k visualizações",
      views: "Ler mais"
    },
    {
      title: "Nova UPA do Centro começa a atender 24h a partir de segunda-feira",
      category: "Saúde",
      time: "1.2k visualizações", 
      views: "Ler mais"
    },
    {
      title: "Escolas municipais adotam novo sistema de matrícula online",
      category: "Educação",
      time: "954 visualizações",
      views: "Ler mais"
    },
    {
      title: "Nova linha de ônibus ligará Perequê-Mirim ao Centro",
      category: "Transporte",
      time: "743 visualizações",
      views: "Ler mais"
    },
    {
      title: "Mutirão de saúde oferecerá exames gratuitos no fim de semana",
      category: "Saúde",
      time: "443 visualizações",
      views: "Ler mais"
    }
  ];

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          <span>Mais Lidas da Semana</span>
        </h2>
        
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {mostReadNews.map((item, index) => (
            <MostReadItem key={index} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MostReadSection;