import React from 'react';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Shield, Gavel, AlertTriangle, CheckCircle, Mail, Clock } from 'lucide-react';

const TermsOfUse: React.FC = () => {
  const lastUpdated = "15 de janeiro de 2025";

  const sections = [
    {
      title: "Aceitação dos Termos",
      icon: CheckCircle,
      content: [
        "Ao acessar e usar o UbaNews, você concorda com estes Termos de Uso",
        "Se não concordar com algum termo, você não deve usar o site",
        "Reservamo-nos o direito de modificar estes termos a qualquer momento",
        "O uso continuado após modificações constitui aceitação das mudanças"
      ]
    },
    {
      title: "Uso do Serviço",
      icon: BookOpen,
      content: [
        "O UbaNews é um portal de notícias gratuito para uso pessoal e informativo",
        "Você pode ler, compartilhar e interagir com o conteúdo de acordo com estas regras",
        "Não é permitido uso comercial do conteúdo sem autorização expressa",
        "O conteúdo é protegido por direitos autorais e leis de propriedade intelectual"
      ]
    },
    {
      title: "Conteúdo do Usuário",
      icon: Users,
      content: [
        "Comentários e interações devem respeitar as leis e os direitos de terceiros",
        "Proibido conteúdo difamatório, ofensivo, ou ilegal",
        "Reservamo-nos o direito de remover conteúdo inadequado sem aviso prévio",
        "O usuário é responsável pelo conteúdo que publica"
      ]
    },
    {
      title: "Direitos de Propriedade",
      icon: Shield,
      content: [
        "Todo o conteúdo editorial é de propriedade do UbaNews ou de seus licenciadores",
        "Logos, marcas e imagens são protegidos por leis de propriedade intelectual",
        "É permitido compartilhar links para o site com crédito ao UbaNews",
        "Reprodução não autorizada pode resultar em responsabilização legal"
      ]
    }
  ];

  const prohibitedActions = [
    "Usar robôs, spiders ou outros meios automatizados para acessar o site",
    "Tentar interferir na operação normal do site",
    "Coletar informações pessoais de outros usuários",
    "Publicar conteúdo que viole leis ou direitos de terceiros",
    "Engajar-se em atividades fraudulentas ou maliciosas",
    "Violar a segurança ou integridade do site"
  ];

  const disclaimers = [
    {
      title: "Precisão do Conteúdo",
      description: "Embora nos esforcemos pela precisão, não garantimos que todas as informações estejam completas ou atualizadas."
    },
    {
      title: "Links Externos",
      description: "Não somos responsáveis pelo conteúdo de sites de terceiros linkados em nossas páginas."
    },
    {
      title: "Disponibilidade do Serviço",
      description: "Não garantimos disponibilidade ininterrupta do site e podemos suspender ou modificar o serviço."
    },
    {
      title: "Limitação de Responsabilidade",
      description: "Não seremos responsáveis por danos indiretos, incidentais ou consequenciais do uso do site."
    }
  ];

  const contactInfo = [
    {
      type: "Dúvidas sobre os Termos",
      email: "legal@ubatubareage.com.br",
      description: "Para questões relacionadas aos Termos de Uso"
    },
    {
      type: "Reportar Violações",
      email: "report@ubatubareage.com.br",
      description: "Para reportar uso indevido ou violações"
    },
    {
      type: "Suporte Geral",
      email: "contato@ubatubareage.com.br",
      description: "Para questões gerais sobre o site"
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
              <BookOpen className="w-4 h-4 mr-2 inline" />
              Termos e Condições
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Termos de Uso
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Leia atentamente os termos que regem o uso do UbaNews. 
              Seu acesso ao site implica aceitação destas condições.
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Última atualização: {lastUpdated}
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Em Resumo</CardTitle>
            <CardDescription>
              Os pontos principais dos nossos termos de uso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50">
                <CheckCircle className="w-6 h-6 mb-2 text-green-600" />
                <h3 className="font-semibold mb-1">O que você pode fazer</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Ler e compartilhar notícias</li>
                  <li>• Comentar respeitosamente</li>
                  <li>• Usar para fins pessoais</li>
                  <li>• Compartilhar links com crédito</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-red-50">
                <AlertTriangle className="w-6 h-6 mb-2 text-red-600" />
                <h3 className="font-semibold mb-1">O que você não pode fazer</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Uso comercial não autorizado</li>
                  <li>• Publicar conteúdo ilegal</li>
                  <li>• Tentar hackear o site</li>
                  <li>• Violar direitos autorais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Prohibited Actions */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Atividades Proibidas</CardTitle>
                <CardDescription>
                  Ações que resultarão em suspensão ou banimento
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {prohibitedActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <Gavel className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Limitações e Isenções</CardTitle>
                <CardDescription>
                  Informações importantes sobre responsabilidade
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {disclaimers.map((disclaimer, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">{disclaimer.title}</h4>
                  <p className="text-sm text-muted-foreground">{disclaimer.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Modificações nos Termos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Podemos atualizar estes Termos de Uso periodicamente. Quando fizermos mudanças significativas:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Notificaremos por email se você tiver uma conta conosco</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Publicaremos um aviso em destaque no site</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Atualizaremos a data de "última modificação" no topo desta página</span>
                </li>
              </ul>
              <p className="text-muted-foreground">
                Recomendamos revisar periodicamente esta página para se manter informado sobre quaisquer mudanças.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Contato para Questões Legais</CardTitle>
                <CardDescription>
                  Entre em contato para questões relacionadas aos Termos de Uso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {contactInfo.map((contact, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-1">{contact.type}</h4>
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {contact.email}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Responderemos questões sobre termos em até 5 dias úteis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jurisdiction */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Foro e Jurisdição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Estes Termos de Uso são regidos pelas leis do Brasil. Qualquer disputa será resolvida 
              nos tribunais da cidade de Ubatuba, estado de São Paulo. Se você é um consumidor, 
              você pode ter direitos adicionais sob a legislação aplicável que não podem ser renunciados.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfUse;