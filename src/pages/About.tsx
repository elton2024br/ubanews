import React from 'react';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Users, Target, Eye, Heart, Shield } from 'lucide-react';

const About: React.FC = () => {
  const team = [
    {
      name: "Equipe Editorial Ubatuba Reage",
      role: "Redação",
      description: "Jornalistas comprometidos com a verdade e a ética profissional",
      icon: Newspaper
    },
    {
      name: "Comunidade Ubatubense",
      role: "Colaboradores",
      description: "Cidadãos que contribuem com informações e denúncias",
      icon: Users
    }
  ];

  const values = [
    {
      title: "Transparência",
      description: "Informações claras, verificadas e sem censura",
      icon: Eye,
      color: "text-blue-600"
    },
    {
      title: "Compromisso",
      description: "Dedicação total à comunidade ubatubense",
      icon: Heart,
      color: "text-red-600"
    },
    {
      title: "Responsabilidade",
      description: "Jornalismo ético e responsável",
      icon: Shield,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
              📰 Sobre o Ubatuba Reage
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Seu Portal de Notícias Local
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprometidos em manter a comunidade ubatubense informada com 
              transparência, responsabilidade e compromisso social.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mb-12">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Nossa Missão</CardTitle>
              <CardDescription className="text-lg">
                Democratizar o acesso à informação de qualidade em Ubatuba
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center max-w-3xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed">
                O Ubatuba Reage nasceu da necessidade de um espaço confiável onde 
                a comunidade pudesse se informar sobre os acontecimentos locais. 
                Acreditamos que o jornalismo local é fundamental para o fortalecimento 
                da democracia e o desenvolvimento da nossa cidade.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Nossos Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <value.icon className={`w-12 h-12 ${value.color} mx-auto mb-3`} />
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Quem Somos</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <member.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <Card className="border-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Faça Parte da Mudança</CardTitle>
              <CardDescription className="text-blue-100">
                Sua contribuição é importante para fortalecer o jornalismo local
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => window.location.href = '/contato'}
              >
                Envie uma Denúncia
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = '/contato'}
              >
                Seja um Colaborador
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;