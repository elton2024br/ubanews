import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ArrowRight } from "lucide-react";

interface VoteItemProps {
  title: string;
  description: string;
  votes: number;
  category: string;
  status: "Infraestrutura" | "Transporte" | "Educação";
}

const VoteItem = ({ title, description, votes, category, status }: VoteItemProps) => (
  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {status}
      </span>
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>{votes}</span>
      </div>
    </div>
    
    <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm mb-4">{description}</p>
    
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{category}</span>
      <Button variant="outline" size="sm">
        Comentar
      </Button>
    </div>
  </div>
);

const VoteSection = () => {
  const voteItems = [
    {
      title: "Instalação de Wi-Fi gratuito nas praças públicas",
      description: "Projeto prevê a instalação de pontos de internet gratuita em 5 praças do centro de Ubatuba...",
      votes: 128,
      category: "Infraestrutura • Digital",
      status: "Infraestrutura" as const
    },
    {
      title: "Ciclovia conectando as principais praias",
      description: "Projeto de 15km de ciclovia ligando as principais praias de Ubatuba para facilitar a mobilidade...",
      votes: 97,
      category: "Transporte • Sustentabilidade",
      status: "Transporte" as const
    }
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <Users className="w-6 h-6 text-accent" />
            <span>Vote em Ubatuba</span>
          </h2>
          <Button variant="news-ghost" className="text-accent hover:text-accent/80">
            Ver todos os projetos
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Participe das decisões da cidade! Vote nos projetos que estão em discussão e contribua 
          com sua opinião para melhorar nossa cidade.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {voteItems.map((item, index) => (
            <VoteItem key={index} {...item} />
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-12 bg-vote-section text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Participe do desenvolvimento de Ubatuba
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Cadastre-se para votar nos projetos, receber notificações sobre sua região e contribuir 
            com suas sugestões para melhorar nossa cidade.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="news-cta" size="lg">
              Criar uma conta
            </Button>
            <Button variant="ghost" size="lg" className="text-white border-white hover:bg-white/10">
              Saiba mais
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoteSection;