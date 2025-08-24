import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface StatusData {
  status: string;
  count: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface MonthData {
  month: string;
  count: number;
}

interface AuthorData {
  author: string;
  count: number;
}

interface ApprovalData {
  status: string;
  count: number;
}

interface AuditData {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user_id: string;
}

interface ReportData {
  totalNews: number;
  publishedNews: number;
  pendingNews: number;
  rejectedNews: number;
  totalAuthors: number;
  newsPerCategory: Array<{ category: string; count: number }>;
  newsPerMonth: Array<{ month: string; count: number }>;
  approvalStats: Array<{ status: string; count: number }>;
  topAuthors: Array<{ author: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
    user: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const Reports: React.FC = () => {
  const { user } = useAdmin();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      const [
        { data: statusData, error: statusError },
        { data: categoryData, error: categoryError },
        { data: monthData, error: monthError },
        { data: authorData, error: authorError },
        { data: approvalData, error: approvalError }
      ] = await Promise.all([
        supabase.rpc('news_status_counts', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        supabase.rpc('news_by_category', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        supabase.rpc('news_by_month', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        supabase.rpc('author_news_counts', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }),
        supabase.rpc('approval_status_counts', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        })
      ]);

      if (statusError || categoryError || monthError || authorError || approvalError) {
        console.error('Error loading report data:', statusError || categoryError || monthError || authorError || approvalError);
        toast.error('Erro ao carregar dados de relatório');
        return;
      }

      // Load audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (auditError) {
        console.error('Error loading audit data:', auditError);
        // Don't show error for audit logs as it's not critical
      }

      const processedData = processReportData(
        statusData || [],
        categoryData || [],
        monthData || [],
        authorData || [],
        approvalData || [],
        auditData || []
      );
      setReportData(processedData);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Erro ao carregar dados do relatório');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (
    statusData: StatusData[],
    categoryData: CategoryData[],
    monthData: MonthData[],
    authorData: AuthorData[],
    approvalData: ApprovalData[],
    audits: AuditData[]
  ): ReportData => {
    const totalNews = statusData.reduce((sum, s) => sum + s.count, 0);
    const publishedNews = statusData.find(s => s.status === 'published')?.count || 0;
    const pendingNews = statusData.find(s => s.status === 'pending')?.count || 0;
    const rejectedNews = statusData.find(s => s.status === 'rejected')?.count || 0;

    const totalAuthors = authorData.length;
    const newsPerCategory = categoryData;
    const newsPerMonth = monthData.map(m => ({
      month: new Date(m.month).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short'
      }),
      count: m.count
    }));
    const approvalStats = approvalData;
    const topAuthors = authorData
      .sort((a: AuthorData, b: AuthorData) => b.count - a.count)
      .slice(0, 10);

    const recentActivity = audits.map(audit => ({
      id: audit.id,
      action: audit.action || 'Ação desconhecida',
      details: audit.details || 'Sem detalhes',
      timestamp: audit.created_at,
      user: audit.user_id || 'Sistema'
    }));

    return {
      totalNews,
      publishedNews,
      pendingNews,
      rejectedNews,
      totalAuthors,
      newsPerCategory,
      newsPerMonth,
      approvalStats,
      topAuthors,
      recentActivity
    };
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange: `${dateRange} dias`,
      data: reportData
    };
    
    const blob = new Blob([JSON.stringify(reportContent, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ubanews-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erro ao carregar relatórios
          </h3>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar os dados do relatório
          </p>
          <Button onClick={loadReportData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Análises</h1>
          <p className="text-gray-600">
            Visualize estatísticas e métricas do sistema de notícias
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Notícias</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.totalNews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Publicadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.publishedNews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reportData.pendingNews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                <p className="text-2xl font-bold text-red-600">
                  {reportData.rejectedNews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Autores</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.totalAuthors}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News per Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Notícias por Categoria</span>
            </CardTitle>
            <CardDescription>
              Distribuição de notícias por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.newsPerCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {reportData.newsPerCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* News Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Evolução Temporal</span>
            </CardTitle>
            <CardDescription>
              Número de notícias criadas ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.newsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Authors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Top Autores</span>
            </CardTitle>
            <CardDescription>
              Autores com mais notícias publicadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topAuthors.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="author" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approval Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Status de Aprovações</span>
            </CardTitle>
            <CardDescription>
              Distribuição dos status de aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.approvalStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Atividade Recente</span>
          </CardTitle>
          <CardDescription>
            Últimas ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Nenhuma atividade recente encontrada
                </p>
              </div>
            ) : (
              reportData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.details}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {activity.user}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};