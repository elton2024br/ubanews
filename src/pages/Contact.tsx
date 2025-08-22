import React, { useState, useEffect } from 'react';
import MobileHeader from '../components/MobileHeader';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveAlert } from '@/components/ui/live-alert';
import { Mail, Phone, MapPin, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "contato@ubatubareage.com.br",
      description: "Resposta em até 24 horas",
      action: () => window.location.href = 'mailto:contato@ubatubareage.com.br'
    },
    {
      icon: Phone,
      title: "Telefone",
      content: "(12) 3832-1234",
      description: "Segunda a Sexta, 9h às 18h",
      action: () => window.location.href = 'tel:+551238321234'
    },
    {
      icon: MapPin,
      title: "Endereço",
      content: "Av. Iperoig, 314 - Centro",
      description: "Ubatuba/SP - CEP 11680-000",
      action: () => window.open('https://maps.google.com/?q=Av.+Iperoig,+314,+Ubatuba+SP', '_blank')
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Assunto é obrigatório";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Mensagem é obrigatória";
    } else if (formData.message.length < 10) {
      newErrors.message = "Mensagem deve ter pelo menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setFeedback({ type: 'error', message: 'Por favor, corrija os erros no formulário' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simular envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFeedback({
        type: 'success',
        message: 'Mensagem enviada com sucesso! Responderemos em até 24 horas.',
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setErrors({});
    } catch (error) {
      setFeedback({
        type: 'error',
        message: 'Erro ao enviar mensagem. Por favor, tente novamente ou use outro meio de contato.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4 text-lg px-4 py-1">
              📬 Entre em Contato
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fale Conosco
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Sua opinião é fundamental para melhorar nosso jornalismo.
              Estamos aqui para ouvir e ajudar.
            </p>
          </div>
        </section>

        <LiveAlert message={feedback?.message ?? ''} type={feedback?.type ?? null} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo e responderemos o mais breve possível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                        className={errors.name ? "border-red-500" : ""}
                        maxLength={100}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com"
                        className={errors.email ? "border-red-500" : ""}
                        maxLength={255}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Qual é o assunto da sua mensagem?"
                      className={errors.subject ? "border-red-500" : ""}
                      maxLength={200}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Descreva detalhadamente sua mensagem..."
                      className={errors.message ? "border-red-500" : ""}
                      rows={6}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.message && (
                        <p className="text-sm text-red-500">{errors.message}</p>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {formData.message.length}/1000
                      </span>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nós respeitamos sua privacidade. Suas informações não serão compartilhadas.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Send className="w-4 h-4 mr-2 animate-pulse" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Informações de Contato</CardTitle>
                <CardDescription>
                  Escolha a melhor forma de entrar em contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={info.action}
                  >
                    <info.icon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{info.title}</p>
                      <p className="text-sm text-muted-foreground">{info.content}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Horário de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segunda a Sexta:</span>
                    <span>9h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sábado:</span>
                    <span>9h00 - 13h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domingo:</span>
                    <span>Fechado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para denúncias urgentes ou emergências, entre em contato através do WhatsApp (12) 3832-1234
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;