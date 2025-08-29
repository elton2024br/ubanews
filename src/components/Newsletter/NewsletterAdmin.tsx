import React, { useState, useEffect } from 'react';
import { useNewsletter, useNewsletterSubscription, useNewsletterCampaign } from '@/hooks/useNewsletter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Send, Eye, Trash2, Search, Calendar, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const NewsletterAdmin: React.FC = () => {
  const { stats, loading: statsLoading } = useNewsletter();
  const { subscribers, loading: subscribersLoading, pagination: subscribersPagination, fetchSubscribers } = useNewsletterSubscription();
  const { campaigns, loading: campaignsLoading, pagination: campaignsPagination, createCampaign, sendCampaign, fetchCampaigns } = useNewsletterCampaign();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    template_id: '',
    content: '',
    send_immediately: false,
    scheduled_for: '',
    recipients: { type: 'all' }
  });

  useEffect(() => {
    fetchSubscribers();
    fetchCampaigns();
  }, [fetchSubscribers, fetchCampaigns]);

  const handleCreateCampaign = async () => {
    const response = await createCampaign(newCampaign);
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Campanha criada com sucesso!');
      setShowCreateCampaign(false);
      setNewCampaign({
        name: '',
        subject: '',
        template_id: '',
        content: '',
        send_immediately: false,
        scheduled_for: '',
        recipients: { type: 'all' }
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    const response = await sendCampaign(campaignId);
    if (response.error) {
      toast.error(response.error);
    } else {
      toast.success('Campanha enviada com sucesso!');
    }
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', color: 'success' },
      unsubscribed: { label: 'Desinscrito', color: 'destructive' },
      bounced: { label: 'Bounce', color: 'warning' },
      draft: { label: 'Rascunho', color: 'secondary' },
      scheduled: { label: 'Agendado', color: 'warning' },
      sending: { label: 'Enviando', color: 'warning' },
      sent: { label: 'Enviado', color: 'success' },
      failed: { label: 'Falhou', color: 'destructive' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'secondary' };
    
    return <Badge variant={statusInfo.color as any}>{statusInfo.label}</Badge>;
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Newsletter</h1>
        <Button onClick={() => setShowCreateCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Inscritos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_subscribers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_subscribers || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_open_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_emails_opened || 0} emails abertos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.average_click_rate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_emails_clicked || 0} cliques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Campanhas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.campaigns_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.campaigns_scheduled || 0} agendadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscribers">Inscritos</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats?.unsubscribed_subscribers || 0}</div>
                  <div className="text-sm text-muted-foreground">Desinscritos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats?.bounced_subscribers || 0}</div>
                  <div className="text-sm text-muted-foreground">Bounces</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.bounce_rate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Bounce</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats?.total_emails_sent || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Enviados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email ou nome..."
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Inscrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>{subscriber.name || '-'}</TableCell>
                      <TableCell>{formatStatus(subscriber.status)}</TableCell>
                      <TableCell>
                        {format(new Date(subscriber.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou assunto..."
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.subject}</TableCell>
                      <TableCell>{formatStatus(campaign.status)}</TableCell>
                      <TableCell>{campaign.recipients_count}</TableCell>
                      <TableCell>
                        {format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {campaign.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendCampaign(campaign.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
            <DialogDescription>
              Configure uma nova campanha de newsletter para seus inscritos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Nome da Campanha</Label>
              <Input
                id="campaign-name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Campanha de Notícias Semanal"
              />
            </div>

            <div>
              <Label htmlFor="campaign-subject">Assunto do Email</Label>
              <Input
                id="campaign-subject"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Confira as últimas notícias da semana"
              />
            </div>

            <div>
              <Label htmlFor="campaign-content">Conteúdo</Label>
              <Textarea
                id="campaign-content"
                value={newCampaign.content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo da sua newsletter..."
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="send-immediately"
                checked={newCampaign.send_immediately}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, send_immediately: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="send-immediately">Enviar imediatamente</Label>
            </div>

            {!newCampaign.send_immediately && (
              <div>
                <Label htmlFor="scheduled-for">Agendar para</Label>
                <Input
                  id="scheduled-for"
                  type="datetime-local"
                  value={newCampaign.scheduled_for}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduled_for: e.target.value }))}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || !newCampaign.subject}>
                Criar Campanha
              </Button>
              <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};