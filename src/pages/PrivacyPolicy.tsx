import React from 'react';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Database, Mail, Clock, UserCheck, FileText, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = "15 de janeiro de 2025";

  const sections = [
    {
      title: "Informações Coletadas",
      icon: Database,
      content: [
        "Dados de navegação: endereço IP, tipo de navegador, páginas visitadas, tempo de acesso",
        "Dados de cadastro: nome, email, telefone (quando fornecidos voluntariamente)",
        "Cookies e tecnologias similares para melhorar a experiência do usuário",
        "Dados de localização aproximada para conteúdo regionalizado"
      ]
    },
    {
      title: "Como Usamos Suas Informações",
      icon: Eye,
      content: [
        "Personalizar o conteúdo e as notícias exibidas",
        "Melhorar a performance e funcionalidade do site",
        "Enviar newsletters e comunicações (com consentimento)",
        "Analisar tendências e métricas de uso",
        "Proteger contra atividades maliciosas ou fraudes"
      ]
    },
    {
      title: "Compartilhamento de Dados",
      icon: UserCheck,
      content: [
        "Não vendemos ou alugamos suas informações pessoais",
        "Podemos compartilhar com fornecedores de serviço confiáveis",
        "Podemos divulgar quando exigido por lei ou para proteger nossos direitos",
        "Anúncios são exibidos com base em contexto, não em perfis pessoais"
      ]
    },
    {
      title: "Seus Direitos (LGPD)",
      icon: Shield,
      content: [
        "Direito de acesso: solicitar cópia dos seus dados",
        "Direito de correção: corrigir dados imprecisos",
        "Direito de exclusão: solicitar remoção dos seus dados",
        "Direito de portabilidade: solicitar transferência dos dados",
        "Direito de oposição: opor-se ao processamento dos dados",
        "Direito de revogar consentimento a qualquer momento"
      ]
    }
  ];

  const dataRetention = [
    {
      type: "Dados de navegação",
      period: "90 dias",
      purpose: "Análise de tráfego e melhoria do site"
    },
    {
      type: "Dados de cadastro",
      period: "Até a exclusão da conta",
      purpose: "Gestão da conta e comunicações"
    },
    {
      type: "Cookies funcionais",
      period: "30 dias",
      purpose: "Manter preferências do usuário"
    },
    {
      type: "Cookies analíticos",
      period: "13 meses",
      purpose: "Análise de uso e melhorias"
    }
  ];

  const cookiesInfo = [
    {
      type: "Essenciais",
      description: "Necessários para o funcionamento básico do site",
      required: true
    },
    {
      type: "Funcionais",
      description: "Lembram suas preferências e configurações",
      required: false
    },
    {
      type: "Analíticos",
      description: "Coletam informações sobre como você usa o site",
      required: false
    },
    {
      type: "Publicidade",
      description: "Exibem anúncios relevantes ao contexto",
      required: false
    }
  ];

  return (
    <>
      <SEO title="Política de Privacidade - UbaNews" description="Saiba como protegemos seus dados" />
      <div className="min-h-screen bg-background">
        <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
              <Shield className="w-4 h-4 mr-2 inline" />
              Privacidade e Proteção de Dados
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Política de Privacidade
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprometidos com a transparência e proteção dos seus dados pessoais, 
              em conformidade com a LGPD (Lei Geral de Proteção de Dados).
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Última atualização: {lastUpdated}
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Resumo Rápido</CardTitle>
            <CardDescription>
              Em poucas palavras, como protegemos seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-blue-50">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Segurança</h3>
                <p className="text-sm text-muted-foreground">Criptografia e medidas de segurança avançadas</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50">
                <Eye className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold mb-1">Transparência</h3>
                <p className="text-sm text-muted-foreground">Você sempre sabe como seus dados são usados</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50">
                <UserCheck className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold mb-1">Controle</h3>
                <p className="text-sm text-muted-foreground">Você tem controle total sobre seus dados</p>
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

        {/* Data Retention */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Retenção de Dados</CardTitle>
                <CardDescription>
                  Por quanto tempo mantemos seus dados armazenados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold">Tipo de Dado</th>
                    <th className="text-left py-2 font-semibold">Período</th>
                    <th className="text-left py-2 font-semibold">Finalidade</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRetention.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-muted-foreground">{item.type}</td>
                      <td className="py-2 font-medium">{item.period}</td>
                      <td className="py-2 text-muted-foreground">{item.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cookies Information */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Cookies e Tecnologias Similares</CardTitle>
                <CardDescription>
                  Como usamos cookies para melhorar sua experiência
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {cookiesInfo.map((cookie, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{cookie.type}</h4>
                    <Badge variant={cookie.required ? "default" : "secondary"}>
                      {cookie.required ? "Obrigatório" : "Opcional"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{cookie.description}</p>
                </div>
              ))}
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
                <CardTitle className="text-xl">Exercer Seus Direitos</CardTitle>
                <CardDescription>
                  Entre em contato para gerenciar seus dados
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Para exercer qualquer direito mencionado acima, entre em contato conosco:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Email</h4>
                  <a 
                    href="mailto:privacidade@ubatubareage.com.br" 
                    className="text-blue-600 hover:underline"
                  >
                    privacidade@ubatubareage.com.br
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Telefone</h4>
                  <a 
                    href="tel:+551238321234" 
                    className="text-blue-600 hover:underline"
                  >
                    (12) 3832-1234
                  </a>
                </div>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">
                  Responderemos sua solicitação em até 15 dias úteis conforme exige a LGPD.
                </p>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="border-0 shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Atualizações desta Política</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas 
              através do site ou por email se você tiver uma conta conosco. Recomendamos revisar esta página 
              regularmente para se manter informado sobre como protegemos suas informações.
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default PrivacyPolicy;