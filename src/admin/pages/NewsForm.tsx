import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdmin } from '../context/AdminProvider';
import { generateAriaLabel, announceToScreenReader } from '../../utils/accessibility';
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
import { useCSRF } from '../../utils/csrf';
import { toast } from 'sonner';

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

const categories = [
  'Política',
  'Economia',
  'Esportes',
  'Cultura',
  'Saúde',
  'Educação',
  'Tecnologia',
  'Meio Ambiente',
  'Turismo',
  'Segurança',
  'Infraestrutura',
  'Eventos'
];

export const NewsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const csrfToken = useCSRF();

  const isEditing = Boolean(id);
  const isNewNews = !isEditing;

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
      announceToScreenReader(isEditing ? 'Atualizando notícia...' : 'Criando notícia...');
      
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
          announceToScreenReader('Erro ao atualizar notícia');
          return;
        }

        toast.success('Notícia atualizada com sucesso');
        announceToScreenReader('Notícia atualizada com sucesso');
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
          announceToScreenReader('Erro ao criar notícia');
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
            announceToScreenReader('Erro ao enviar notícia para aprovação');
            return;
          }

          toast.success('Notícia criada e enviada para aprovação');
          announceToScreenReader('Notícia criada e enviada para aprovação');
        } else {
          toast.success('Notícia criada com sucesso');
          announceToScreenReader('Notícia criada com sucesso');
        }
      }

      setHasUnsavedChanges(false);
      navigate('/admin/news');
    } catch (error) {
      console.error('Error saving news:', error);
      toast.error('Erro ao salvar notícia');
      announceToScreenReader('Erro ao salvar notícia');
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

  const handlePreview = () => {
    const values = form.getValues();
    const previewData = {
      ...values,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      created_at: newsItem?.created_at || new Date().toISOString(),
      id: id || 'preview-id',
    };
    sessionStorage.setItem('news_preview_data', JSON.stringify(previewData));
    window.open('/news/preview', '_blank');
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
      <div 
        className="space-y-6"
        role="status"
        aria-label={generateAriaLabel('Carregando formulário de notícia')}
      >
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        <span className="sr-only">Carregando formulário...</span>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6"
      ref={mainContentRef}
      role="main"
      aria-labelledby="page-title"
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between"
        role="banner"
      >
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => {
              announceToScreenReader('Voltando para lista de notícias');
              handleExit();
            }}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={generateAriaLabel('Voltar para lista de notícias')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Voltar
          </Button>
          <div>
            <h1 
              id="page-title"
              className="text-2xl font-bold"
            >
              {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Modifique os dados da notícia' : 'Crie uma nova notícia para o sistema'}
            </p>
          </div>
        </div>
        <div 
          className="flex items-center space-x-2"
          role="toolbar"
          aria-label="Ações do formulário"
        >
          {hasUnsavedChanges && (
            <Badge 
              variant="outline" 
              className="text-orange-600 border-orange-200"
              aria-label={generateAriaLabel('Existem alterações não salvas no formulário')}
            >
              <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
              Alterações não salvas
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => {
              announceToScreenReader('Abrindo pré-visualização da notícia');
              handlePreview();
            }}
            disabled={!watchedValues.title || !stripHtml(watchedValues.content)}
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={generateAriaLabel('Pré-visualizar notícia em nova aba')}
          >
            <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
            Pré-visualizar
          </Button>
        </div>
      </header>

      {/* Form */}
      <Form {...form}>
        <form 
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6"
          noValidate
          aria-labelledby="page-title"
        >
          <input type="hidden" name="csrf_token" value={csrfToken} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card 
                role="region"
                aria-labelledby="main-content-title"
              >
                <CardHeader>
                  <CardTitle id="main-content-title">Conteúdo Principal</CardTitle>
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
              <Card 
                role="region"
                aria-labelledby="settings-title"
              >
                <CardHeader>
                  <CardTitle id="settings-title">Configurações</CardTitle>
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
                            aria-label={generateAriaLabel('Selecionar arquivo de imagem')}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              announceToScreenReader('Abrindo seletor de arquivo');
                              fileInputRef.current?.click();
                            }}
                            disabled={uploadingImage}
                            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={generateAriaLabel(uploadingImage ? 'Enviando imagem' : 'Escolher arquivo de imagem')}
                          >
                            {uploadingImage ? (
                              <>
                                <div 
                                  className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" 
                                  aria-hidden="true"
                                />
                                Enviando...
                                <span className="sr-only">Enviando imagem...</span>
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
              <Card 
                role="region"
                aria-labelledby="actions-title"
              >
                <CardContent className="pt-6">
                  <h3 id="actions-title" className="sr-only">Ações do formulário</h3>
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      disabled={saving}
                      aria-label={generateAriaLabel(saving ? 'Salvando notícia' : `${isEditing ? 'Atualizar' : 'Criar'} notícia`)}
                    >
                      {saving ? (
                        <>
                          <div 
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" 
                            aria-hidden="true"
                          />
                          Salvando...
                          <span className="sr-only">Salvando notícia...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                          {isEditing ? 'Atualizar' : 'Criar'} Notícia
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => {
                        announceToScreenReader('Cancelando edição');
                        handleExit();
                      }}
                      aria-label={generateAriaLabel('Cancelar edição e voltar')}
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
        <AlertDialogContent 
          role="alertdialog"
          aria-labelledby="exit-dialog-title"
          aria-describedby="exit-dialog-description"
        >
          <AlertDialogHeader>
            <AlertDialogTitle id="exit-dialog-title">Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription id="exit-dialog-description">
              Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={generateAriaLabel('Cancelar e continuar editando')}
            >
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                announceToScreenReader('Saindo sem salvar alterações');
                confirmExit();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label={generateAriaLabel('Confirmar saída sem salvar')}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};