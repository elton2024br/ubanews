import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { RichTextEditor } from '../../components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';
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
  Save,
  ArrowLeft,
  Eye,
  Send,
  FileText,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import useCategories from '@/hooks/useCategories';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

// Validation schema
const newsSchema = z.object({
  title: z.string()
    .min(10, 'O título deve ter pelo menos 10 caracteres')
    .max(200, 'O título deve ter no máximo 200 caracteres'),
  content: z.string().refine((val) => {
    const len = stripHtml(val).length;
    return len >= 50 && len <= 10000;
  }, {
    message: 'O conteúdo deve ter entre 50 e 10.000 caracteres'
  }),
  summary: z.string()
    .min(20, 'O resumo deve ter pelo menos 20 caracteres')
    .max(500, 'O resumo deve ter no máximo 500 caracteres'),
  category: z.string()
    .min(1, 'Selecione uma categoria'),
  tags: z.string().optional(),
  status: z.enum(['draft', 'pending', 'published'], {
    required_error: 'Selecione um status'
  }),
  featured_image_url: z.string().url('URL da imagem inválida').optional().or(z.literal('')),
  author_name: z.string().min(1, 'Nome do autor é obrigatório')
});

type NewsFormData = z.infer<typeof newsSchema>;

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'pending' | 'published';
  featured_image_url?: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}


export const NewsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditing = Boolean(id);
  const isNewNews = !isEditing;
  const { categories } = useCategories();

  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
      summary: '',
      category: '',
      tags: '',
      status: 'draft',
      featured_image_url: '',
      author_name: user?.name || user?.email || ''
    }
  });

  const { watch, formState: { isDirty } } = form;
  const watchedValues = watch();

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  useEffect(() => {
    if (isEditing && id) {
      loadNews(id);
    }
  }, [id, isEditing]);

  const loadNews = async (newsId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('admin_news')
        .select('*')
        .eq('id', newsId)
        .single();

      if (error) {
        console.error('Error loading news:', error);
        toast.error('Erro ao carregar notícia');
        navigate('/admin/news');
        return;
      }

      setNewsItem(data);
      
      // Populate form with existing data
      form.reset({
        title: data.title,
        content: data.content,
        summary: data.summary || '',
        category: data.category || '',
        tags: data.tags ? data.tags.join(', ') : '',
        status: data.status,
        featured_image_url: data.featured_image_url || '',
        author_name: data.author_name
      });
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Erro ao carregar notícia');
      navigate('/admin/news');
    } finally {
      setLoading(false);
    }
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

      form.setValue('featured_image_url', publicUrl, {
        shouldValidate: true
      });

      toast.success('Imagem enviada com sucesso');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
      form.setError('featured_image_url', {
        message: 'Erro ao enviar imagem'
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: NewsFormData) => {
    try {
      setSaving(true);
      
      const newsData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
        ...(data.status === 'published' && !newsItem?.published_at && {
          published_at: new Date().toISOString()
        })
      };

      if (isEditing && id) {
        // Update existing news
        const { error } = await supabase
          .from('admin_news')
          .update(newsData)
          .eq('id', id);

        if (error) {
          console.error('Error updating news:', error);
          toast.error('Erro ao atualizar notícia');
          return;
        }

        toast.success('Notícia atualizada com sucesso');
      } else {
        // Create new news
        const { data: createdNews, error: createError } = await supabase
          .from('admin_news')
          .insert({
            ...newsData,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating news:', createError);
          toast.error('Erro ao criar notícia');
          return;
        }

        const newNewsId = createdNews?.id;

        if (newsData.status === 'pending') {
          const { error: approvalError } = await supabase
            .from('news_approvals')
            .insert({
              news_id: newNewsId,
              reviewer_id: user?.id,
              status: 'pending',
              comments: ''
            });

          if (approvalError) {
            console.error('Error creating news approval:', approvalError);
            toast.error('Erro ao enviar notícia para aprovação');
            return;
          }

          toast.success('Notícia criada e enviada para aprovação');
        } else {
          toast.success('Notícia criada com sucesso');
        }
      }

      setHasUnsavedChanges(false);
      navigate('/admin/news');
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Erro ao salvar notícia');
    } finally {
      setSaving(false);
    }
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      setExitDialogOpen(true);
    } else {
      navigate('/admin/news');
    }
  };

  const confirmExit = () => {
    setHasUnsavedChanges(false);
    navigate('/admin/news');
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
            <AlertCircle className="w-3 h-3 mr-1" />
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canPublish = () => {
    return user?.role === 'admin' || user?.role === 'editor';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="space-y-6">
        {/* Preview Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à edição
            </Button>
            <h1 className="text-2xl font-bold">Pré-visualização</h1>
          </div>
          {getStatusBadge(watchedValues.status)}
        </div>

        {/* Preview Content */}
        <Card>
          <CardContent className="p-8">
            {watchedValues.featured_image_url && (
              <img
                src={watchedValues.featured_image_url}
                alt={watchedValues.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{watchedValues.author_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <span>{watchedValues.category}</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold">{watchedValues.title}</h1>
              
              {watchedValues.summary && (
                <p className="text-lg text-gray-600 italic border-l-4 border-blue-500 pl-4">
                  {watchedValues.summary}
                </p>
              )}
              
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: watchedValues.content }}
              />
              
              {watchedValues.tags && (
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {watchedValues.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleExit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifique os dados da notícia' : 'Crie uma nova notícia para o sistema'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            disabled={!watchedValues.title || !stripHtml(watchedValues.content)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Pré-visualizar
          </Button>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo Principal</CardTitle>
                  <CardDescription>
                    Informações principais da notícia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o título da notícia..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/200 caracteres
                        </FormDescription>
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
                          <Textarea
                            placeholder="Digite um resumo da notícia..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 caracteres
                        </FormDescription>
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
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          {stripHtml(field.value || '').length}/10.000 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Status e metadados da notícia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            {canPublish() && (
                              <SelectItem value="published">Publicado</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
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
                    name="author_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autor *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do autor"
                            {...field}
                            disabled={user?.role !== 'admin'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="tag1, tag2, tag3"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Separe as tags com vírgulas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagem de Destaque</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://exemplo.com/imagem.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Informe a URL ou envie uma imagem (máx. 5MB)
                        </FormDescription>
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <>
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                                Enviando...
                              </>
                            ) : (
                              'Escolher arquivo'
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isEditing ? 'Atualizar' : 'Criar'} Notícia
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleExit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={exitDialogOpen} onOpenChange={setExitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="bg-red-600 hover:bg-red-700"
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};