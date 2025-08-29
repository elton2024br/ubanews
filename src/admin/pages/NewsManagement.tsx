import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Archive,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { AdminNews, NewsFilters, PaginationInfo } from '../types/admin';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Validation Schema
const newsSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título muito longo'),
  content: z.string().min(50, 'Conteúdo deve ter pelo menos 50 caracteres'),
  summary: z.string().min(20, 'Resumo deve ter pelo menos 20 caracteres').max(300, 'Resumo muito longo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  tags: z.string().optional(),
  featured_image: z.string().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived', 'pending']),
  publish_date: z.string().optional()
});

type NewsFormData = z.infer<typeof newsSchema>;

const NewsManagement: React.FC = () => {
  const { user, hasPermission } = useAdmin();
  const [news, setNews] = useState<AdminNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NewsFilters>({
    status: 'all',
    category: 'all',
    author: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedNews, setSelectedNews] = useState<AdminNews | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
      summary: '',
      category: '',
      tags: '',
      featured_image: '',
      status: 'draft',
      publish_date: ''
    }
  });

  const categories = [
    'Política',
    'Economia',
    'Esportes',
    'Cultura',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Meio Ambiente',
    'Turismo',
    'Geral'
  ];

  const getImageUrl = (path: string) => {
    if (!path) return '';
    return path.startsWith('http')
      ? path
      : supabase.storage.from('news-images').getPublicUrl(path).data.publicUrl;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas arquivos de imagem são permitidos');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `news-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('news-images')
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl }
      } = supabase.storage.from('news-images').getPublicUrl(filePath);

      form.setValue('featured_image', filePath, { shouldValidate: true });
      setImagePreview(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
      form.setError('featured_image', { message: 'Erro ao enviar imagem' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const fetchNews = async () => {
    try {
      console.log('[NewsManagement] Iniciando busca de notícias:', {
        page: pagination.page,
        limit: pagination.limit,
        filters,
        user_id: user?.id
      });
      
      setLoading(true);
      let query = supabase
        .from('admin_news')
        .select('*, author:admin_users(name)', { count: 'exact' });

      // Apply filters
      if (filters.status !== 'all') {
        console.log('[NewsManagement] Aplicando filtro de status:', filters.status);
        query = query.eq('status', filters.status);
      }
      if (filters.category !== 'all') {
        console.log('[NewsManagement] Aplicando filtro de categoria:', filters.category);
        query = query.eq('category', filters.category);
      }
      if (filters.author !== 'all') {
        console.log('[NewsManagement] Aplicando filtro de autor:', filters.author);
        query = query.eq('author_id', filters.author);
      }
      if (filters.search) {
        console.log('[NewsManagement] Aplicando filtro de busca:', filters.search);
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      console.log('[NewsManagement] Aplicando paginação:', { from, to, page: pagination.page, limit: pagination.limit });
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('[NewsManagement] Erro do Supabase ao buscar notícias:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          filters,
          pagination: { from, to }
        });
        
        let errorMessage = 'Erro ao carregar notícias';
        if (error.code === 'PGRST116') {
          errorMessage = 'Sem permissão para acessar as notícias';
        } else if (error.message.includes('admin_users')) {
          errorMessage = 'Erro ao carregar dados do autor das notícias';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      console.log('[NewsManagement] Notícias carregadas com sucesso:', {
        count: data?.length || 0,
        totalCount: count,
        hasAuthors: data?.some(news => news.author) || false
      });

      setNews(data || []);
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / prev.limit)
      }));
    } catch (error) {
      console.error('[NewsManagement] Erro crítico ao buscar notícias:', error);
      
      let errorMessage = 'Erro interno ao carregar notícias';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [filters, pagination.page]);

  const handleCreateNews = async (data: NewsFormData) => {
    try {
      console.log('[NewsManagement] Iniciando criação de notícia:', {
        title: data.title,
        category: data.category,
        status: data.status,
        user_id: user?.id
      });
      
      // Validação crítica do author_id
      if (!user?.id) {
        console.error('[NewsManagement] Erro: usuário não autenticado ou ID ausente');
        toast.error('Erro: usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Validação adicional dos dados obrigatórios
      if (!data.title?.trim()) {
        console.error('[NewsManagement] Erro: título é obrigatório');
        toast.error('Título é obrigatório');
        return;
      }
      
      if (!data.content?.trim()) {
        console.error('[NewsManagement] Erro: conteúdo é obrigatório');
        toast.error('Conteúdo é obrigatório');
        return;
      }
      
      if (!data.category?.trim()) {
        console.error('[NewsManagement] Erro: categoria é obrigatória');
        toast.error('Categoria é obrigatória');
        return;
      }
      
      const newsData = {
        ...data,
        author_id: user.id, // Garantir que não é undefined
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        publish_date: data.publish_date || null,
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[NewsManagement] Dados da notícia preparados:', {
        author_id: newsData.author_id,
        title: newsData.title,
        category: newsData.category,
        tags_count: newsData.tags.length
      });

      const { data: insertedData, error } = await supabase
        .from('admin_news')
        .insert([newsData])
        .select();

      if (error) {
        console.error('[NewsManagement] Erro do Supabase ao criar notícia:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        let errorMessage = 'Erro ao criar notícia';
        if (error.code === '23505') {
          errorMessage = 'Já existe uma notícia com este título';
        } else if (error.code === '23503') {
          errorMessage = 'Erro de referência: verifique os dados informados';
        } else if (error.message.includes('author_id')) {
          errorMessage = 'Erro de autenticação: faça login novamente';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      console.log('[NewsManagement] Notícia criada com sucesso:', insertedData?.[0]?.id);
      toast.success('Notícia criada com sucesso!');
      setIsCreateDialogOpen(false);
      form.reset();
      setImagePreview(null);
      fetchNews();
    } catch (error) {
      console.error('[NewsManagement] Erro crítico ao criar notícia:', error);
      
      let errorMessage = 'Erro interno ao criar notícia';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleUpdateNews = async (data: NewsFormData) => {
    if (!selectedNews) {
      console.error('[NewsManagement] Erro: nenhuma notícia selecionada para edição');
      toast.error('Erro: nenhuma notícia selecionada para edição');
      return;
    }

    try {
      console.log('[NewsManagement] Iniciando atualização de notícia:', {
        id: selectedNews.id,
        title: data.title,
        category: data.category,
        status: data.status,
        user_id: user?.id
      });
      
      // Validação do usuário autenticado
      if (!user?.id) {
        console.error('[NewsManagement] Erro: usuário não autenticado para atualização');
        toast.error('Erro: usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Validação dos dados obrigatórios
      if (!data.title?.trim()) {
        console.error('[NewsManagement] Erro: título é obrigatório para atualização');
        toast.error('Título é obrigatório');
        return;
      }
      
      if (!data.content?.trim()) {
        console.error('[NewsManagement] Erro: conteúdo é obrigatório para atualização');
        toast.error('Conteúdo é obrigatório');
        return;
      }
      
      if (!data.category?.trim()) {
        console.error('[NewsManagement] Erro: categoria é obrigatória para atualização');
        toast.error('Categoria é obrigatória');
        return;
      }
      
      const newsData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        publish_date: data.publish_date || null,
        updated_at: new Date().toISOString()
      };
      
      console.log('[NewsManagement] Dados da notícia preparados para atualização:', {
        id: selectedNews.id,
        title: newsData.title,
        category: newsData.category,
        tags_count: newsData.tags.length
      });

      const { data: updatedData, error } = await supabase
        .from('admin_news')
        .update(newsData)
        .eq('id', selectedNews.id)
        .select();

      if (error) {
        console.error('[NewsManagement] Erro do Supabase ao atualizar notícia:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          news_id: selectedNews.id
        });
        
        let errorMessage = 'Erro ao atualizar notícia';
        if (error.code === '23505') {
          errorMessage = 'Já existe uma notícia com este título';
        } else if (error.code === '23503') {
          errorMessage = 'Erro de referência: verifique os dados informados';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Notícia não encontrada ou sem permissão para editar';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      if (!updatedData || updatedData.length === 0) {
        console.warn('[NewsManagement] Aviso: nenhuma linha foi atualizada');
        toast.error('Notícia não encontrada ou não foi possível atualizar');
        return;
      }
      
      console.log('[NewsManagement] Notícia atualizada com sucesso:', updatedData[0]?.id);
      toast.success('Notícia atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedNews(null);
      form.reset();
      setImagePreview(null);
      fetchNews();
    } catch (error) {
      console.error('[NewsManagement] Erro crítico ao atualizar notícia:', error);
      
      let errorMessage = 'Erro interno ao atualizar notícia';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      console.log('[NewsManagement] Iniciando exclusão de notícia:', {
        id,
        user_id: user?.id
      });
      
      // Validação do usuário autenticado
      if (!user?.id) {
        console.error('[NewsManagement] Erro: usuário não autenticado para exclusão');
        toast.error('Erro: usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Validação do ID da notícia
      if (!id?.trim()) {
        console.error('[NewsManagement] Erro: ID da notícia é obrigatório para exclusão');
        toast.error('Erro: ID da notícia inválido');
        return;
      }

      const { data: deletedData, error } = await supabase
        .from('admin_news')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('[NewsManagement] Erro do Supabase ao excluir notícia:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          news_id: id
        });
        
        let errorMessage = 'Erro ao excluir notícia';
        if (error.code === 'PGRST116') {
          errorMessage = 'Notícia não encontrada ou sem permissão para excluir';
        } else if (error.code === '23503') {
          errorMessage = 'Não é possível excluir: notícia possui dependências';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      if (!deletedData || deletedData.length === 0) {
        console.warn('[NewsManagement] Aviso: nenhuma linha foi excluída');
        toast.error('Notícia não encontrada ou não foi possível excluir');
        return;
      }
      
      console.log('[NewsManagement] Notícia excluída com sucesso:', id);
      toast.success('Notícia excluída com sucesso!');
      fetchNews();
    } catch (error) {
      console.error('[NewsManagement] Erro crítico ao excluir notícia:', error);
      
      let errorMessage = 'Erro interno ao excluir notícia';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (newsId: string, newStatus: string) => {
    try {
      console.log('[NewsManagement] Iniciando alteração de status:', {
        id: newsId,
        newStatus,
        user_id: user?.id
      });
      
      // Validação do usuário autenticado
      if (!user?.id) {
        console.error('[NewsManagement] Erro: usuário não autenticado para alteração de status');
        toast.error('Erro: usuário não autenticado. Faça login novamente.');
        return;
      }
      
      // Validação do ID da notícia
      if (!newsId?.trim()) {
        console.error('[NewsManagement] Erro: ID da notícia é obrigatório para alteração de status');
        toast.error('Erro: ID da notícia inválido');
        return;
      }
      
      // Validação do novo status
      const validStatuses = ['draft', 'published', 'archived', 'pending'];
      if (!validStatuses.includes(newStatus)) {
        console.error('[NewsManagement] Erro: status inválido:', newStatus);
        toast.error('Erro: status inválido');
        return;
      }

      const updateData: {
        status: string;
        updated_at: string;
        publish_date?: string;
      } = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'published' && !news.find(n => n.id === newsId)?.publish_date) {
        updateData.publish_date = new Date().toISOString();
      }

      const { data: updatedData, error } = await supabase
        .from('admin_news')
        .update(updateData)
        .eq('id', newsId)
        .select();

      if (error) {
        console.error('[NewsManagement] Erro do Supabase ao alterar status:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          news_id: newsId,
          attempted_status: newStatus
        });
        
        let errorMessage = 'Erro ao alterar status da notícia';
        if (error.code === 'PGRST116') {
          errorMessage = 'Notícia não encontrada ou sem permissão para alterar';
        } else if (error.code === '23503') {
          errorMessage = 'Erro de referência: verifique os dados';
        }
        
        toast.error(errorMessage);
        return;
      }
      
      if (!updatedData || updatedData.length === 0) {
        console.warn('[NewsManagement] Aviso: nenhuma linha foi atualizada para alteração de status');
        toast.error('Notícia não encontrada ou não foi possível alterar o status');
        return;
      }
      
      console.log('[NewsManagement] Status alterado com sucesso:', {
        id: newsId,
        newStatus
      });

      toast.success(`Notícia ${newStatus === 'published' ? 'publicada' : newStatus === 'archived' ? 'arquivada' : 'atualizada'} com sucesso!`);
      fetchNews();
    } catch (error) {
      console.error('[NewsManagement] Erro crítico ao alterar status:', error);
      
      let errorMessage = 'Erro interno ao alterar status da notícia';
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = (error as { message: string }).message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const openEditDialog = (newsItem: AdminNews) => {
    setSelectedNews(newsItem);
    form.reset({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary,
      category: newsItem.category,
      tags: Array.isArray(newsItem.tags) ? newsItem.tags.join(', ') : '',
      featured_image: newsItem.featured_image || '',
      status: newsItem.status,
      publish_date: newsItem.publish_date ? format(new Date(newsItem.publish_date), 'yyyy-MM-dd\'T\'HH:mm') : ''
    });
    setImagePreview(newsItem.featured_image ? getImageUrl(newsItem.featured_image) : null);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (newsItem: AdminNews) => {
    setSelectedNews(newsItem);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Publicado', variant: 'default' as const, icon: CheckCircle },
      draft: { label: 'Rascunho', variant: 'secondary' as const, icon: FileText },
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      archived: { label: 'Arquivado', variant: 'destructive' as const, icon: Archive }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const NewsForm: React.FC<{ onSubmit: (data: NewsFormData) => void; submitLabel: string }> = ({ onSubmit, submitLabel }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o título da notícia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo *</FormLabel>
              <FormControl>
                <Textarea placeholder="Breve resumo da notícia" rows={3} {...field} />
              </FormControl>
              <FormDescription>Resumo que aparecerá na listagem de notícias</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo *</FormLabel>
              <FormControl>
                <Textarea placeholder="Conteúdo completo da notícia" rows={8} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    {hasPermission('news', 'publish') && (
                      <SelectItem value="published">Publicado</SelectItem>
                    )}
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="Digite as tags separadas por vírgula" {...field} />
              </FormControl>
              <FormDescription>Ex: política, eleições, governo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="featured_image"
          render={() => (
            <FormItem>
              <FormLabel>Imagem Destacada</FormLabel>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Pré-visualização"
                  className="w-32 h-32 object-cover rounded mb-2"
                />
              )}
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </FormControl>
              <FormDescription>Envie uma imagem (máx. 5MB)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="publish_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Publicação</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>Deixe em branco para publicar imediatamente</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Notícias</h1>
          <p className="text-muted-foreground">Gerencie todas as notícias do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchNews} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {hasPermission('news', 'create') && (
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (open) setImagePreview(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Notícia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Notícia</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para criar uma nova notícia.
                  </DialogDescription>
                </DialogHeader>
                <NewsForm onSubmit={handleCreateNews} submitLabel="Criar Notícia" />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Título ou conteúdo..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: 'all', category: 'all', author: 'all', search: '' })}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notícias ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
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
                        <div>
                          <p className="font-medium">{newsItem.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {newsItem.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{newsItem.category}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(newsItem.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {newsItem.author?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(newsItem.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {newsItem.views || 0}
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
                            <DropdownMenuItem onClick={() => openViewDialog(newsItem)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            {hasPermission('news', 'update') && (
                              <DropdownMenuItem onClick={() => openEditDialog(newsItem)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {newsItem.status !== 'published' && hasPermission('news', 'publish') && (
                              <DropdownMenuItem onClick={() => handleStatusChange(newsItem.id, 'published')}>
                                <Send className="mr-2 h-4 w-4" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            {newsItem.status !== 'archived' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(newsItem.id, 'archived')}>
                                <Archive className="mr-2 h-4 w-4" />
                                Arquivar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {hasPermission('news', 'delete') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a notícia "{newsItem.title}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteNews(newsItem.id)} className="bg-red-600 hover:bg-red-700">
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Notícia</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na notícia.
            </DialogDescription>
          </DialogHeader>
          <NewsForm onSubmit={handleUpdateNews} submitLabel="Salvar Alterações" />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Notícia</DialogTitle>
          </DialogHeader>
          {selectedNews && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedNews.title}</h2>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <span>Por {selectedNews.author?.name}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedNews.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  <span>•</span>
                  <Badge variant="outline">{selectedNews.category}</Badge>
                  <span>•</span>
                  {getStatusBadge(selectedNews.status)}
                </div>
              </div>
              
              {selectedNews.featured_image && (
                <img
                  src={getImageUrl(selectedNews.featured_image)}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Resumo</h3>
                <p className="text-muted-foreground">{selectedNews.summary}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Conteúdo</h3>
                <div className="prose max-w-none">
                  {selectedNews.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
              
              {selectedNews.tags && selectedNews.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManagement;