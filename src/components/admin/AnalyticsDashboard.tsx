import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, Pie, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsDashboardProps {
  className?: string;
}

interface NewsStats {
  id: string;
  title: string;
  totalViews: number;
  uniqueViews: number;
  avgDuration: number;
  category: string;
  publishedAt: string;
}

interface DeviceStats {
  device: string;
  count: number;
  percentage: number;
}

interface TimeStats {
  hour: number;
  views: number;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { getAnalyticsReport, getTopNews, getNewsStats } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedNews, setSelectedNews] = useState<string | null>(null);
  const [newsStats, setNewsStats] = useState<NewsStats[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStats[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
  });

  // Cores para os gráficos
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  };

  const deviceColors = [COLORS.primary, COLORS.secondary, COLORS.success];

  // Carregar dados iniciais
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const startDate = subDays(new Date(), dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);
      const endDate = new Date();

      // Carregar relatório geral
      const report = await getAnalyticsReport({
        startDate: startOfDay(startDate).toISOString(),
        endDate: endOfDay(endDate).toISOString(),
      });

      if (report) {
        setOverviewStats({
          totalViews: report.summary.totalViews,
          uniqueVisitors: report.summary.uniqueVisitors,
          avgSessionDuration: report.summary.avgSessionDuration,
          bounceRate: report.summary.bounceRate,
        });
      }

      // Carregar top notícias
      const topNews = await getTopNews(20);
      setNewsStats(topNews.map(news => ({
        id: news.news_id,
        title: news.title || 'Notícia sem título',
        totalViews: news.total_views,
        uniqueViews: news.unique_views,
        avgDuration: news.avg_duration || 0,
        category: news.category || 'Geral',
        publishedAt: news.published_at,
      })));

      // Gerar dados de dispositivos (mock)
      setDeviceStats([
        { device: 'Desktop', count: 1250, percentage: 45 },
        { device: 'Mobile', count: 1100, percentage: 40 },
        { device: 'Tablet', count: 420, percentage: 15 },
      ]);

      // Gerar dados de horários (mock)
      setTimeStats([
        { hour: 6, views: 120 },
        { hour: 7, views: 180 },
        { hour: 8, views: 250 },
        { hour: 9, views: 320 },
        { hour: 10, views: 380 },
        { hour: 11, views: 420 },
        { hour: 12, views: 450 },
        { hour: 13, views: 380 },
        { hour: 14, views: 350 },
        { hour: 15, views: 400 },
        { hour: 16, views: 420 },
        { hour: 17, views: 390 },
        { hour: 18, views: 350 },
        { hour: 19, views: 380 },
        { hour: 20, views: 420 },
        { hour: 21, views: 450 },
        { hour: 22, views: 380 },
        { hour: 23, views: 280 },
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do desempenho do UbaNews
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Visualizações Totais"
          value={formatNumber(overviewStats.totalViews)}
          icon={Eye}
          trend="+12.5% vs período anterior"
        />
        <StatCard
          title="Visitantes Únicos"
          value={formatNumber(overviewStats.uniqueVisitors)}
          icon={Users}
          trend="+8.2% vs período anterior"
        />
        <StatCard
          title="Tempo Médio"
          value={formatDuration(overviewStats.avgSessionDuration)}
          icon={Clock}
          description="por sessão"
        />
        <StatCard
          title="Taxa de Rejeição"
          value={`${overviewStats.bounceRate}%`}
          icon={TrendingUp}
          description="Páginas únicas"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="news">Notícias</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="time">Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visualizações por Dia</CardTitle>
                <CardDescription>
                  Tendência de visualizações nos últimos {dateRange === '7d' ? '7' : dateRange === '30d' ? '30' : '90'} dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Line
                    data={[
                      { date: 'Seg', views: 1200 },
                      { date: 'Ter', views: 1350 },
                      { date: 'Qua', views: 1100 },
                      { date: 'Qui', views: 1450 },
                      { date: 'Sex', views: 1600 },
                      { date: 'Sáb', views: 1800 },
                      { date: 'Dom', views: 2100 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke={COLORS.primary} strokeWidth={2} />
                  </Line>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Categoria</CardTitle>
                <CardDescription>
                  Visualizações por categoria de notícias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Bar
                    data={[
                      { category: 'Política', views: 3200 },
                      { category: 'Esportes', views: 2800 },
                      { category: 'Tecnologia', views: 2400 },
                      { category: 'Entretenimento', views: 2100 },
                      { category: 'Saúde', views: 1900 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill={COLORS.secondary} />
                  </Bar>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notícias Mais Visualizadas</CardTitle>
              <CardDescription>
                Top 10 notícias com mais visualizações no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsStats.slice(0, 10).map((news, index) => (
                  <div key={news.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{news.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {news.category} • {format(new Date(news.publishedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNumber(news.totalViews)}</p>
                      <p className="text-xs text-muted-foreground">visualizações</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
                <CardDescription>
                  Visualizações por tipo de dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Pie>
                    <Pie
                      data={deviceStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ device, percentage }) => `${device} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={deviceColors[index % deviceColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </Pie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Dispositivo</CardTitle>
                <CardDescription>
                  Estatísticas detalhadas por tipo de dispositivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceStats.map((device) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.device)}
                        <span className="text-sm font-medium">{device.device}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">{formatNumber(device.count)}</span>
                        <span className="text-sm text-muted-foreground">{device.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visualizações por Horário</CardTitle>
              <CardDescription>
                Pico de visualizações ao longo do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <Bar
                  data={timeStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `${label}:00`}
                    formatter={(value) => [value, 'Visualizações']}
                  />
                  <Legend />
                  <Bar dataKey="views" fill={COLORS.info} />
                </Bar>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}