import React, { useState } from 'react';
import { useNewsletterSubscription } from '@/hooks/useNewsletter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NewsletterSubscriptionProps {
  className?: string;
  showPreferences?: boolean;
  onSuccess?: () => void;
}

export const NewsletterSubscription: React.FC<NewsletterSubscriptionProps> = ({
  className,
  showPreferences = false,
  onSuccess
}) => {
  const { subscribe, unsubscribe, loading, error } = useNewsletterSubscription();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState({
    daily_news: true,
    breaking_news: false,
    weekly_digest: true
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showUnsubscribe, setShowUnsubscribe] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    const response = await subscribe({
      email,
      name,
      preferences: showPreferences ? preferences : undefined
    });

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Inscrição realizada com sucesso!');
      setIsSubscribed(true);
      setEmail('');
      setName('');
      onSuccess?.();
    }
  };

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    const response = await unsubscribe(email);

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Você foi removido da newsletter');
      setIsSubscribed(false);
      setEmail('');
      setShowUnsubscribe(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Newsletter
        </CardTitle>
        <CardDescription>
          {isSubscribed 
            ? 'Você está inscrito na nossa newsletter!'
            : 'Receba as últimas notícias diretamente no seu email.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showUnsubscribe ? (
          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div>
              <Label htmlFor="unsubscribe-email">Email</Label>
              <Input
                id="unsubscribe-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Remover
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUnsubscribe(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            {showPreferences && (
              <div className="space-y-3">
                <Label>Preferências</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.daily_news}
                      onChange={(e) => setPreferences(prev => ({ ...prev, daily_news: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Notícias diárias</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.breaking_news}
                      onChange={(e) => setPreferences(prev => ({ ...prev, breaking_news: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Notícias urgentes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferences.weekly_digest}
                      onChange={(e) => setPreferences(prev => ({ ...prev, weekly_digest: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Resumo semanal</span>
                  </label>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Inscrever-se'
              )}
            </Button>

            {isSubscribed && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowUnsubscribe(true)}
                className="w-full"
              >
                Remover inscrição
              </Button>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

// Inline newsletter subscription component for footer/sidebar
export const InlineNewsletterSubscription: React.FC<{
  onSuccess?: () => void;
}> = ({ onSuccess }) => {
  const { subscribe, loading, error } = useNewsletterSubscription();
  const [email, setEmail] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    const response = await subscribe({ email });

    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Inscrição realizada com sucesso!');
      setEmail('');
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="flex-1"
        required
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Inscrever'
        )}
      </Button>
    </form>
  );
};