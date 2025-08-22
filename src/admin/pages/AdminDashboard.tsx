import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Cell
} from 'recharts';
import {
  FileText,
  Users,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw
} from 'lucide-react';
import { DashboardStats } from '../types/admin';
import { supabase } from '@/lib/supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  name: string;
  value: number;
  date?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard: React.FC = () => {
  const { user, hasPermission } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalNews: 0,
    publishedNews: 0,
    draftNews: 0,
    totalUsers: 0,
    totalViews: 0,
    pendingApprovals: 0
  });
  const [chartData, setChartData] = useState<{
    newsPerDay: ChartData[];
    newsByStatus: ChartData[];
    viewsPerDay: ChartData[];
  }>({
    newsPerDay: [],
    newsByStatus: [],
    viewsPerDay: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [newsResult, usersResult] = await Promise.all([
        supabase.from('admin_news').select('*'),
        hasPermission('users', 'read') ? supabase.from('admin_users').select('*') : null
      ]);

      if (newsResult.data) {
        const totalNews = newsResult.data.length;
        const publishedNews = newsResult.data.filter(n => n.status === 'published').length;
        const draftNews = newsResult.data.filter(n => n.status === 'draft').length;
        const pendingApprovals = newsResult.data.filter(n => n.status === 'pending').length;
        
        // Calculate total views (mock data for now)
        const totalViews = newsResult.data.reduce((sum, news) => sum + (news.views || 0), 0);

        setStats({
          totalNews,
          publishedNews,
          draftNews,
          totalUsers: usersResult?.data?.length || 0,
          totalViews,
          pendingApprovals
        });

        // Prepare chart data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i);
          return {
            name: format(date, 'dd/MM', { locale: ptBR }),
            date: format(date, 'yyyy-MM-dd'),
            value: 0
          };
        }).reverse();

        // News per day (last 7 days)
        const newsPerDay = last7Days.map(day => {
          const dayNews = newsResult.data.filter(news => {
            const newsDate = format(new Date(news.created_at), 'yyyy-MM-dd');
            return newsDate === day.date;
          });
          return {
            ...day,
            value: dayNews.length
          };
        });

        // News by status
        const newsByStatus = [
          { name: 'Publicadas', value: publishedNews },
          { name: 'Rascunhos', value: draftNews },
          { name: 'Pendentes', value: pendingApprovals }
        ].filter(item => item.value > 0);

        // Views per day (mock data)
        const viewsPerDay = last7Days.map(day => ({
          ...day,
          value: Math.floor(Math.random() * 1000) + 100
        }));

        setChartData({
          newsPerDay,
          newsByStatus,
          viewsPerDay
        });
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: number;
    color?: string;
  }> = ({ title, value, description, icon: Icon, trend, color = 'text-blue-600' }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend !== undefined && (
          <div className="flex items-center pt-1">
            <TrendingUp className={`h-3 w-3 mr-1 ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
            <span className={`text-xs ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? '+' : ''}{trend}% vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do sistema de notícias</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name}! Aqui está um resumo do sistema.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Atualizado {format(lastUpdate, 'HH:mm', { locale: ptBR })}
          </Badge>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Notícias"
          value={stats.totalNews}
          description="Todas as notícias no sistema"
          icon={FileText}
          trend={12}
        />
        <StatCard
          title="Notícias Publicadas"
          value={stats.publishedNews}
          description="Visíveis para o público"
          icon={CheckCircle}
          color="text-green-600"
          trend={8}
        />
        <StatCard
          title="Visualizações"
          value={stats.totalViews}
          description="Total de visualizações"
          icon={Eye}
          color="text-purple-600"
          trend={15}
        />
        {hasPermission('users', 'read') && (
          <StatCard
            title="Usuários Ativos"
            value={stats.totalUsers}
            description="Usuários cadastrados"
            icon={Users}
            color="text-orange-600"
            trend={5}
          />
        )}
      </div>

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Aprovações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Existem {stats.pendingApprovals} notícias aguardando aprovação.
            </p>
            <Button className="mt-2" size="sm">
              Ver Pendências
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* News per Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Notícias por Dia
            </CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.newsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* News by Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2" />
              Status das Notícias
            </CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.newsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.newsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Views Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Tendência de Visualizações
          </CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.viewsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex-col space-y-2">
              <FileText className="w-6 h-6" />
              <span>Nova Notícia</span>
            </Button>
            {hasPermission('users', 'create') && (
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Users className="w-6 h-6" />
                <span>Novo Usuário</span>
              </Button>
            )}
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Activity className="w-6 h-6" />
              <span>Ver Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;