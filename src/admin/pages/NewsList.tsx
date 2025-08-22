import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/config';
import { updateNews, deleteNews } from '../api/adminNews';
import { toast } from 'sonner';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  views: number;
  category?: string;
  tags?: string[];
}

interface Filters {
  search: string;
  status: string;
  author: string;
  dateRange: string;
}

export const NewsList: React.FC = () => {
  const { user } = useAdmin();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    author: 'all',
    dateRange: 'all'
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<NewsItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadNews();
  }, [currentPage, filters]);

  const loadNews = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('admin_news')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.author !== 'all') {
        query = query.eq('author_name', filters.author);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading news:', error);
        toast.error('Erro ao carregar notícias');
        return;
      }

      setNews(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Erro ao carregar notícias');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      const { error } = await deleteNews(newsToDelete.id);

      if (error) {
        console.error('Error deleting news:', error);
        toast.error('Erro ao excluir notícia');
        return;
      }

      toast.success('Notícia excluída com sucesso');
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast.error('Erro ao excluir notícia');
    }
  };

  const handleStatusChange = async (newsId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await updateNews(newsId, updateData);

      if (error) {
        console.error('Error updating news status:', error);
        toast.error('Erro ao atualizar status da notícia');
        return;
      }

      toast.success('Status da notícia atualizado com sucesso');
      loadNews();
    } catch (error) {
      console.error('Error updating news status:', error);
      toast.error('Erro ao atualizar status da notícia');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Publicado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <FileText className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
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

  const canEditNews = (newsItem: NewsItem) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'editor') return true;
    if (user?.role === 'columnist' && newsItem.author_name === user.name) return true;
    return false;
  };

  const canDeleteNews = (newsItem: NewsItem) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'editor') return true;
    return false;
  };

  const canChangeStatus = (newsItem: NewsItem) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'editor') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Notícias</h1>
          <p className="text-gray-600">
            Visualize, edite e gerencie todas as notícias do sistema
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/news/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova Notícia
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notícias..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.author}
              onValueChange={(value) => setFilters(prev => ({ ...prev, author: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Autor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os autores</SelectItem>
                {/* Add dynamic authors here */}
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* News Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notícias ({news.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {news.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Visualizações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((newsItem) => (
                    <TableRow key={newsItem.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <h4 className="font-medium truncate">{newsItem.title}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {newsItem.content.substring(0, 100)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(newsItem.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{newsItem.author_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <div>{formatDate(newsItem.created_at)}</div>
                            {newsItem.published_at && (
                              <div className="text-xs text-gray-500">
                                Pub: {formatDate(newsItem.published_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{newsItem.views || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/news/${newsItem.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            {canEditNews(newsItem) && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/news/${newsItem.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {canChangeStatus(newsItem) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                {newsItem.status !== 'published' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(newsItem.id, 'published')}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Publicar
                                  </DropdownMenuItem>
                                )}
                                {newsItem.status !== 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(newsItem.id, 'pending')}
                                  >
                                    <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                                    Pendente
                                  </DropdownMenuItem>
                                )}
                                {newsItem.status !== 'rejected' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(newsItem.id, 'rejected')}
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {canDeleteNews(newsItem) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setNewsToDelete(newsItem);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notícia encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                Não há notícias que correspondam aos filtros selecionados.
              </p>
              <Button asChild>
                <Link to="/admin/news/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira notícia
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a notícia "{newsToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNews}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};