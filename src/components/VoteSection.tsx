import { Button } from "@/components/ui/button";
import { TrendingUp, Users, ArrowRight } from "lucide-react";
import { generateAriaLabel } from "@/utils/accessibility";

interface VoteItemProps {
  title: string;
  description: string;
  votes: number;
  category: string;
  status: "Infraestrutura" | "Transporte" | "Educação";
}

const VoteItem = ({ title, description, votes, category, status }: VoteItemProps) => {
  const handleCommentClick = () => {
    // Implementar navegação para comentários
    console.log('Comentar projeto:', title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCommentClick();
    }
  };

  return (
    <article 
      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-accent/50"
      role="article"
      aria-labelledby={`vote-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between mb-3">
        <span 
          className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
          aria-label={`Categoria: ${status}`}
        >
          {status}
        </span>
        <div 
          className="flex items-center space-x-1 text-sm text-muted-foreground"
          aria-label={`${votes} votos`}
        >
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          <span>{votes}</span>
        </div>
      </div>
      
      <h3 
        id={`vote-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className="font-semibold text-lg mb-2 text-foreground"
      >
        {title}
      </h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      
      <div className="flex items-center justify-between">
        <span 
          className="text-xs text-muted-foreground"
          aria-label={`Tags: ${category}`}
        >
          {category}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCommentClick}
          aria-label={generateAriaLabel('comment', 'add', title)}
          className="focus:ring-2 focus:ring-accent/50"
        >
          Comentar
        </Button>
      </div>
    </article>
  );
};

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

  const handleViewAllProjects = () => {
    // Implementar navegação para todos os projetos
    console.log('Ver todos os projetos');
  };

  const handleCreateAccount = () => {
    // Implementar navegação para criação de conta
    console.log('Criar conta');
  };

  const handleLearnMore = () => {
    // Implementar navegação para mais informações
    console.log('Saiba mais');
  };

  return (
    <section 
      className="py-12 bg-background"
      aria-labelledby="vote-section-title"
      role="region"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 
            id="vote-section-title"
            className="text-2xl font-bold text-foreground flex items-center space-x-2"
          >
            <Users className="w-6 h-6 text-accent" aria-hidden="true" />
            <span>Vote em Ubatuba</span>
          </h2>
          <Button 
            variant="news-ghost" 
            className="text-accent hover:text-accent/80 focus:ring-2 focus:ring-accent/50"
            onClick={handleViewAllProjects}
            aria-label="Ver todos os projetos de votação"
          >
            Ver todos os projetos
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-8">
          Participe das decisões da cidade! Vote nos projetos que estão em discussão e contribua 
          com sua opinião para melhorar nossa cidade.
        </p>
        
        <div 
          className="grid md:grid-cols-2 gap-6"
          role="list"
          aria-label="Lista de projetos para votação"
        >
          {voteItems.map((item, index) => (
            <div key={index} role="listitem">
              <VoteItem {...item} />
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <aside 
          className="mt-12 bg-vote-section text-white rounded-lg p-8 text-center"
          role="complementary"
          aria-labelledby="cta-title"
        >
          <h3 id="cta-title" className="text-2xl font-bold mb-4">
            Participe do desenvolvimento de Ubatuba
          </h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Cadastre-se para votar nos projetos, receber notificações sobre sua região e contribuir 
            com suas sugestões para melhorar nossa cidade.
          </p>
          <div className="flex justify-center space-x-4" role="group" aria-label="Ações de participação">
            <Button 
              variant="news-cta" 
              size="lg"
              onClick={handleCreateAccount}
              className="focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-vote-section"
              aria-describedby="create-account-desc"
            >
              Criar uma conta
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-white border-white hover:bg-white/10 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-vote-section"
              onClick={handleLearnMore}
              aria-label="Saiba mais sobre como participar"
            >
              Saiba mais
            </Button>
          </div>
          <div id="create-account-desc" className="sr-only">
            Criar uma conta permite votar em projetos e receber notificações
          </div>
        </aside>
      </div>
    </section>
  );
};

export default VoteSection;