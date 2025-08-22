import heroImage from "@/assets/hero-ubatuba.jpg";

const HeroBanner = () => {
  return (
    <section className="relative h-80 overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-hero-overlay/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="text-white max-w-2xl">
          <div className="mb-4">
            <span className="inline-block bg-accent/20 text-accent-foreground px-3 py-1 rounded-full label mb-2">
              Notícias • Infraestrutura
            </span>
          </div>
          
          <h1 className="heading-1 mb-4 text-white">
            Prefeitura anuncia reforma do calçadão da Praia Grande
          </h1>
          
          <p className="body-large text-white/90 mb-4">
            Obras começam na próxima semana e devem durar três meses. Moradores poderão opinar sobre o projeto.
          </p>
          
          <div className="flex items-center space-x-4 caption text-white/80">
            <span>📅 24 Jul, 2024</span>
            <span>•</span>
            <span>📍 Praia Grande</span>
            <span>•</span>
            <span>⏱️ 3 min de leitura</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;