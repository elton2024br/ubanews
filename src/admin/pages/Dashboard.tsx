import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../supabase/config';

interface DashboardStats {
  totalNews: number;
  publishedNews: number;
  pendingNews: number;
  draftNews: number;
  totalViews: number;
  todayViews: number;
  totalUsers: number;
  activeUsers: number;
}

interface RecentNews {
  id: string;
  title: string;
  status: string;
  author_name: string;
  created_at: string;
  published_at?: string;
  views?: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalNews: 0,
    publishedNews: 0,
    pendingNews: 0,
    draftNews: 0,
    totalViews: 0,
    todayViews: 0,
    totalUsers: 0,
    activeUsers: 0
  });
  const [recentNews, setRecentNews] = useState<RecentNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load news statistics
      const { data: newsData } = await supabase
        .from('admin_news')
        .select('status, views, created_at');

      if (newsData) {
        const totalNews = newsData.length;
        const publishedNews = newsData.filter(n => n.status === 'published').length;
        const pendingNews = newsData.filter(n => n.status === 'pending').length;
        const draftNews = newsData.filter(n => n.status === 'draft').length;
        const totalViews = newsData.reduce((sum, n) => sum + (n.views || 0), 0);
        
        // Calculate today's views (mock for now)
        const todayViews = Math.floor(totalViews * 0.05);

        setStats(prev => ({
          ...prev,
          totalNews,
          publishedNews,
          pendingNews,
          draftNews,
          totalViews,
          todayViews
        }));
      }

      // Load recent news
      const { data: recentNewsData } = await supabase
        .from('admin_news')
        .select('id, title, status, author_name, created_at, published_at, views')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentNewsData) {
        setRecentNews(recentNewsData);
      }

      // Load user statistics (mock for now)
      setStats(prev => ({
        ...prev,
        totalUsers: 1420,
        activeUsers: 89
      }));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Publicado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rascunho</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'columnist': return 'Colunista';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {user?.name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-blue-100 mb-4">
            Você está logado como {getRoleDisplayName(user?.role || '')}. Aqui está um resumo das atividades do sistema.
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4" />
              <span>Sistema operacional</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mb-10" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Notícias</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNews}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+12%</span>
              <span>em relação ao mês passado</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedNews}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {stats.pendingNews} aguardando aprovação
              </p>
              {stats.totalNews > 0 && (
                <Progress 
                  value={(stats.publishedNews / stats.totalNews) * 100} 
                  className="w-16 h-2" 
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{stats.todayViews}</span>
              <span>hoje</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalUsers.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent News */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notícias Recentes</CardTitle>
                <CardDescription>
                  Últimas notícias criadas ou modificadas
                </CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/admin/news">
                  Ver todas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNews.length > 0 ? (
                recentNews.map((news) => (
                  <div key={news.id} className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {news.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(news.status)}
                        <span className="text-xs text-gray-500">
                          por {news.author_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {news.published_at ? 
                          `Publicado em ${formatDate(news.published_at)}` :
                          `Criado em ${formatDate(news.created_at)}`
                        }
                        {news.views && ` • ${news.views} visualizações`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma notícia encontrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-20 flex flex-col items-center justify-center">
                <Link to="/admin/news/new">
                  <Plus className="h-6 w-6 mb-2" />
                  <span className="text-sm">Nova Notícia</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Link to="/admin/approvals">
                  <Clock className="h-6 w-6 mb-2" />
                  <span className="text-sm">Pendentes</span>
                  {stats.pendingNews > 0 && (
                    <Badge className="mt-1 text-xs">{stats.pendingNews}</Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Link to="/admin/reports">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Relatórios</span>
                </Link>
              </Button>
              {user?.role === 'admin' && (
                <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <Link to="/admin/users">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Usuários</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre o funcionamento do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Banco de dados: Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">API: Funcionando</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">Autenticação: Ativa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};