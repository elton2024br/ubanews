import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Calendar,
  Tag,
  Search,
  Filter,
  AlertCircle,
  MessageSquare,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface NewsApproval {
  id: string;
  news_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id?: string;
  reviewer_name?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
  news: {
    id: string;
    title: string;
    content: string;
    summary?: string;
    category?: string;
    tags?: string[];
    author_name: string;
    created_at: string;
    featured_image_url?: string;
  };
}

interface ApprovalAction {
  newsId: string;
  action: 'approve' | 'reject';
  comments: string;
}

export const Approvals: React.FC = () => {
  const { user } = useAdmin();
  const [approvals, setApprovals] = useState<NewsApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedApproval, setSelectedApproval] = useState<NewsApproval | null>(null);
  const [actionDialog, setActionDialog] = useState<ApprovalAction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<NewsApproval | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('news_approvals')
        .select(`
          *,
          news:admin_news(
            id,
            title,
            content,
            summary,
            category,
            tags,
            author_name,
            created_at,
            featured_image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading approvals:', error);
        toast.error('Erro ao carregar aprovações');
        return;
      }

      setApprovals(data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (action: 'approve' | 'reject', comments: string) => {
    if (!actionDialog) return;

    try {
      setProcessing(true);
      
      const { error: approvalError } = await supabase
        .from('news_approvals')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewer_id: user?.id,
          reviewer_name: user?.name || user?.email,
          comments: comments || null,
          updated_at: new Date().toISOString()
        })
        .eq('news_id', actionDialog.newsId);

      if (approvalError) {
        console.error('Error updating approval:', approvalError);
        toast.error('Erro ao processar aprovação');
        return;
      }

      // Update news status if approved
      if (action === 'approve') {
        const { error: newsError } = await supabase
          .from('admin_news')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', actionDialog.newsId);

        if (newsError) {
          console.error('Error updating news status:', newsError);
          toast.error('Erro ao atualizar status da notícia');
          return;
        }
      }

      toast.success(
        action === 'approve' 
          ? 'Notícia aprovada e publicada com sucesso' 
          : 'Notícia rejeitada com sucesso'
      );
      
      setActionDialog(null);
      loadApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Erro ao processar aprovação');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (createdAt: string) => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated >= 3) return 'border-red-200 bg-red-50';
    if (daysSinceCreated >= 1) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200';
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = 
      approval.news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.news.author_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || approval.news.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(approvals.map(a => a.news.category).filter(Boolean))];

  const canApprove = user?.role === 'admin' || user?.role === 'editor';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Aprovações de Notícias</h1>
        <p className="text-gray-600">
          Gerencie as aprovações de notícias pendentes no sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {approvals.filter(a => a.status === 'pending').length}
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
                <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvals.filter(a => a.status === 'approved').length}
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
                  {approvals.filter(a => a.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {approvals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma aprovação encontrada
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há aprovações pendentes no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map((approval) => (
            <Card key={approval.id} className={getPriorityColor(approval.created_at)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {approval.news.title}
                        </h3>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{approval.news.author_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(approval.news.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {approval.news.category && (
                            <div className="flex items-center space-x-1">
                              <Tag className="h-4 w-4" />
                              <span>{approval.news.category}</span>
                            </div>
                          )}
                        </div>
                        
                        {approval.news.summary && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {approval.news.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(approval.status)}
                          
                          {approval.reviewer_name && (
                            <span className="text-sm text-gray-500">
                              Revisado por: {approval.reviewer_name}
                            </span>
                          )}
                        </div>
                        
                        {approval.comments && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                Comentários:
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{approval.comments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDialog(approval)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    
                    {approval.status === 'pending' && canApprove && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => setActionDialog({
                            newsId: approval.news_id,
                            action: 'approve',
                            comments: ''
                          })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setActionDialog({
                            newsId: approval.news_id,
                            action: 'reject',
                            comments: ''
                          })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      {previewDialog && (
        <Dialog open={!!previewDialog} onOpenChange={() => setPreviewDialog(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pré-visualização da Notícia</DialogTitle>
              <DialogDescription>
                Visualize o conteúdo completo antes de aprovar ou rejeitar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {previewDialog.news.featured_image_url && (
                <img
                  src={previewDialog.news.featured_image_url}
                  alt={previewDialog.news.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              
              <div className="space-y-3">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{previewDialog.news.author_name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(previewDialog.news.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {previewDialog.news.category && (
                    <div className="flex items-center space-x-1">
                      <Tag className="h-4 w-4" />
                      <span>{previewDialog.news.category}</span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold">{previewDialog.news.title}</h1>
                
                {previewDialog.news.summary && (
                  <p className="text-lg text-gray-600 italic border-l-4 border-blue-500 pl-4">
                    {previewDialog.news.summary}
                  </p>
                )}
                
                <div className="prose max-w-none">
                  {previewDialog.news.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {previewDialog.news.tags && previewDialog.news.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {previewDialog.news.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Dialog */}
      {actionDialog && (
        <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.action === 'approve' ? 'Aprovar' : 'Rejeitar'} Notícia
              </DialogTitle>
              <DialogDescription>
                {actionDialog.action === 'approve'
                  ? 'A notícia será aprovada e publicada automaticamente.'
                  : 'A notícia será rejeitada e não será publicada.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comentários {actionDialog.action === 'reject' ? '(obrigatório)' : '(opcional)'}
                </label>
                <Textarea
                  placeholder="Adicione comentários sobre sua decisão..."
                  value={actionDialog.comments}
                  onChange={(e) => setActionDialog({
                    ...actionDialog,
                    comments: e.target.value
                  })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialog(null)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleApprovalAction(actionDialog.action, actionDialog.comments)}
                disabled={processing || (actionDialog.action === 'reject' && !actionDialog.comments.trim())}
                className={actionDialog.action === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
                }
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    {actionDialog.action === 'approve' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {actionDialog.action === 'approve' ? 'Aprovar' : 'Rejeitar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};