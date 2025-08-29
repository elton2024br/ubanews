import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Comment, CommentReport, ModerationAction } from '@/types/comments';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CommentsModerationProps {
  className?: string;
}

export function CommentsModeration({ className }: CommentsModerationProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [moderationAction, setModerationAction] = useState<ModerationAction>('approve');
  const [currentTab, setCurrentTab] = useState('comments');

  // Carregar comentários
  const loadComments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          news:news_id (title),
          user:user_id (id, email, raw_user_meta_data)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.ilike('content', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  // Carregar reports
  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comment_reports')
        .select(`
          *,
          comment:comment_id (*),
          reporter:reporter_id (id, email, raw_user_meta_data),
          comment_user:comment_id (user_id (id, email, raw_user_meta_data))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar reports:', error);
      toast.error('Erro ao carregar reports');
    } finally {
      setLoading(false);
    }
  };

  // Moderar comentário
  const moderateComment = async (commentId: string, action: ModerationAction, note?: string) => {
    try {
      const updates: any = {
        status: action === 'approve' ? 'published' : 
                action === 'hide' ? 'hidden' : 
                action === 'delete' ? 'deleted' : 'published',
        moderation_note: note,
        moderated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', commentId);

      if (error) throw error;

      // Se for uma ação de report, atualizar o status do report
      if (selectedReport) {
        await supabase
          .from('comment_reports')
          .update({ 
            status: action === 'approve' ? 'rejected' : 'approved',
            resolved_at: new Date().toISOString()
          })
          .eq('id', selectedReport.id);
      }

      toast.success(`Comentário ${action === 'approve' ? 'aprovado' : action === 'hide' ? 'ocultado' : 'deletado'}`);
      
      // Recarregar dados
      loadComments();
      loadReports();
      
      setShowModerationDialog(false);
      setSelectedComment(null);
      setSelectedReport(null);
      setModerationNote('');
    } catch (error) {
      console.error('Erro ao moderar comentário:', error);
      toast.error('Erro ao moderar comentário');
    }
  };

  // Estatísticas
  const getStats = () => {
    const total = comments.length;
    const published = comments.filter(c => c.status === 'published').length;
    const pending = comments.filter(c => c.status === 'pending').length;
    const hidden = comments.filter(c => c.status === 'hidden').length;
    const deleted = comments.filter(c => c.status === 'deleted').length;
    
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const resolvedReports = reports.filter(r => r.status !== 'pending').length;

    return {
      total,
      published,
      pending,
      hidden,
      deleted,
      pendingReports,
      resolvedReports,
    };
  };

  const stats = getStats();

  useEffect(() => {
    loadComments();
    loadReports();
  }, [statusFilter, searchTerm]);

  const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={comment.user?.raw_user_meta_data?.avatar_url} />
              <AvatarFallback>
                {comment.user?.raw_user_meta_data?.full_name?.[0] || 
                 comment.user?.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {comment.user?.raw_user_meta_data?.full_name || comment.user?.email}
              </p>
              <p className="text-xs text-gray-500">
                {comment.news?.title || 'Notícia não encontrada'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge 
              variant={
                comment.status === 'published' ? 'default' :
                comment.status === 'pending' ? 'secondary' :
                comment.status === 'hidden' ? 'destructive' : 'outline'
              }
            >
              {comment.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
          {comment.content}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span>Editado</span>
            )}
          </div>
          <div className="flex gap-2">
            {comment.status !== 'published' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderateComment(comment.id, 'approve')}
              >
                <CheckCircle size={14} className="mr-1" />
                Aprovar
              </Button>
            )}
            {comment.status === 'published' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderateComment(comment.id, 'hide')}
              >
                <EyeOff size={14} className="mr-1" />
                Ocultar
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => moderateComment(comment.id, 'delete')}
            >
              <Trash2 size={14} className="mr-1" />
              Deletar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard = ({ report }: { report: CommentReport }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">Report #{report.id}</p>
            <p className="text-xs text-gray-500">
              Por: {report.reporter?.raw_user_meta_data?.full_name || report.reporter?.email}
            </p>
          </div>
          <Badge 
            variant={
              report.status === 'pending' ? 'secondary' :
              report.status === 'approved' ? 'default' : 'outline'
            }
          >
            {report.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Motivo:</p>
            <Badge variant="outline" className="mt-1">
              {report.reason}
            </Badge>
          </div>
          
          {report.description && (
            <div>
              <p className="text-sm font-medium">Descrição:</p>
              <p className="text-sm text-gray-700">{report.description}</p>
            </div>
          )}

          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Comentário reportado:</p>
            <Card className="p-3 bg-gray-50">
              <p className="text-sm text-gray-700 mb-2">
                {report.comment?.content}
              </p>
              <p className="text-xs text-gray-500">
                Por: {report.comment?.user?.raw_user_meta_data?.full_name || 
                      report.comment?.user?.email}
              </p>
            </Card>
          </div>

          {report.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedReport(report);
                  setSelectedComment(report.comment);
                  setModerationAction('approve');
                  setShowModerationDialog(true);
                }}
              >
                <CheckCircle size={14} className="mr-1" />
                Aprovar Comentário
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setSelectedReport(report);
                  setSelectedComment(report.comment);
                  setModerationAction('delete');
                  setShowModerationDialog(true);
                }}
              >
                <XCircle size={14} className="mr-1" />
                Deletar Comentário
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Moderação de Comentários
          </h2>
          <p className="text-gray-600">Gerenciar comentários e reports</p>
        </div>
        <Button onClick={() => { loadComments(); loadReports(); }}>
          <RefreshCw size={16} className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
            <CardDescription>Total Comentários</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.published}</CardTitle>
            <CardDescription>Publicados</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
            <CardDescription>Pendentes</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.pendingReports}</CardTitle>
            <CardDescription>Reports Pendentes</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar comentários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="comments">Comentários</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {stats.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="hidden">Ocultos</SelectItem>
                <SelectItem value="deleted">Deletados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <div>
              {comments.map(comment => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum comentário encontrado
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <div>
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum report encontrado
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de moderação */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === 'approve' ? 'Aprovar Comentário' :
               moderationAction === 'hide' ? 'Ocultar Comentário' :
               'Deletar Comentário'}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === 'approve' && 'Este comentário será publicado e visível para todos os usuários.'}
              {moderationAction === 'hide' && 'Este comentário será ocultado mas não deletado.'}
              {moderationAction === 'delete' && 'Este comentário será permanentemente deletado.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Comentário:</p>
              <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md">
                {selectedComment?.content}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium">Nota de moderação (opcional):</label>
              <Textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder="Adicione uma nota sobre esta moderação..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowModerationDialog(false);
              setModerationNote('');
            }}>
              Cancelar
            </Button>
            <Button 
              variant={moderationAction === 'delete' ? 'destructive' : 'default'}
              onClick={() => {
                if (selectedComment) {
                  moderateComment(selectedComment.id, moderationAction, moderationNote);
                }
              }}
            >
              {moderationAction === 'approve' ? 'Aprovar' :
               moderationAction === 'hide' ? 'Ocultar' :
               'Deletar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}