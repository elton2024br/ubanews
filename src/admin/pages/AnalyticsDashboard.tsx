import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AnalyticsDashboard: React.FC = () => {
  const { hasPermission } = useAdmin();
  const { 
    trackPageView, 
    getAnalyticsReport, 
    getNewsMetrics,
    getUserEngagement,
    getDeviceStats,
    loading,
    error 
  } = useAnalytics();

  const [dateRange, setDateRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [newsMetrics, setNewsMetrics] = useState<any[]>([]);
  const [userEngagement, setUserEngagement] = useState<any>(null);
  const [deviceStats, setDeviceStats] = useState<any[]>([]);

  useEffect(() => {
    if (hasPermission('analytics', 'read')) {
      loadAnalyticsData();
      trackPageView('/admin/analytics');
    }
  }, [dateRange, hasPermission]);

  const loadAnalyticsData = async () => {
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      
      const [report, metrics, engagement, devices] = await Promise.all([
        getAnalyticsReport({ days }),
        getNewsMetrics({ limit: 10 }),
        getUserEngagement({ days }),
        getDeviceStats()
      ]);

      setAnalyticsData(report);
      setNewsMetrics(metrics);
      setUserEngagement(engagement);
      setDeviceStats(devices);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const StatCard = ({ title, value, description, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <TrendingUp className={`h-3 w-3 mr-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <span className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!hasPermission('analytics', 'read')) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar o dashboard de analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardHeader>
            <CardTitle>Carregando Analytics...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize métricas e estatísticas detalhadas do sistema.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Visualizações Totais"
          value={analyticsData?.totalViews || 0}
          description="Total de visualizações no período"
          icon={Eye}
        />
        <StatCard
          title="Usuários Únicos"
          value={analyticsData?.uniqueUsers || 0}
          description="Usuários únicos no período"
          icon={Users}
        />
        <StatCard
          title="Tempo Médio"
          value={`${analyticsData?.avgSessionDuration || 0}min`}
          description="Tempo médio de sessão"
          icon={Clock}
        />
        <StatCard
          title="Taxa de Rejeição"
          value={`${analyticsData?.bounceRate || 0}%`}
          description="Taxa de rejeição"
          icon={Activity}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="news">Notícias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visualizações por Dia</CardTitle>
                <CardDescription>Tendência de visualizações</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.viewsByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Hora</CardTitle>
                <CardDescription>Picos de acesso durante o dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.viewsByHour || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notícias Mais Visualizadas</CardTitle>
              <CardDescription>Top 10 notícias por visualizações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsMetrics.map((news, index) => (
                  <div key={news.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{news.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {news.views} visualizações • {news.category}
                      </div>
                    </div>
                    <Badge variant="secondary">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engajamento por Usuário</CardTitle>
                <CardDescription>Métricas de engajamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userEngagement?.engagementByUserType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retenção de Usuários</CardTitle>
                <CardDescription>Taxa de retorno dos usuários</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Dia 1</span>
                    <span className="font-bold">{userEngagement?.retention?.day1 || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dia 7</span>
                    <span className="font-bold">{userEngagement?.retention?.day7 || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dia 30</span>
                    <span className="font-bold">{userEngagement?.retention?.day30 || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
                <CardDescription>Tipos de dispositivos utilizados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {deviceStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Dispositivo</CardTitle>
                <CardDescription>Estatísticas detalhadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceStats.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {device.device === 'desktop' && <Monitor className="h-4 w-4" />}
                        {device.device === 'mobile' && <Smartphone className="h-4 w-4" />}
                        {device.device === 'tablet' && <Tablet className="h-4 w-4" />}
                        <span className="capitalize">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{device.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;