import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { Comment, CommentStatus, ReportReason } from '@/types/comments';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CommentsModeration: React.FC = () => {
  const { hasPermission } = useAdmin();
  const {
    comments,
    reports,
    stats,
    loading,
    error,
    loadComments,
    updateCommentStatus,
    moderateComment,
    deleteComment,
    searchComments,
    filterComments
  } = useComments();

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [moderationDialog, setModerationDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'delete'>('approve');

  useEffect(() => {
    if (hasPermission('comments', 'moderate')) {
      loadComments({ status: activeTab as CommentStatus });
    }
  }, [activeTab, hasPermission]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      searchComments(term);
    } else {
      loadComments({ status: activeTab as CommentStatus });
    }
  };

  const handleModerate = async (comment: Comment, action: 'approve' | 'reject' | 'delete') => {
    setSelectedComment(comment);
    setModerationAction(action);
    setModerationDialog(true);
  };

  const confirmModeration = async () => {
    if (!selectedComment) return;

    try {
      switch (moderationAction) {
        case 'approve':
          await updateCommentStatus(selectedComment.id, 'published');
          break;
        case 'reject':
          await moderateComment(selectedComment.id, 'rejected', moderationReason);
          break;
        case 'delete':
          await deleteComment(selectedComment.id);
          break;
      }
      
      setModerationDialog(false);
      setSelectedComment(null);
      setModerationReason('');
      loadComments({ status: activeTab as CommentStatus });
    } catch (error) {
      console.error('Erro ao moderar comentário:', error);
    }
  };

  const getStatusBadge = (status: CommentStatus) => {
    const badges = {
      published: { color: 'bg-green-100 text-green-800', label: 'Publicado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeitado' },
      deleted: { color: 'bg-gray-100 text-gray-800', label: 'Deletado' }
    };
    
    const badge = badges[status] || badges.pending;
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getReportReasonLabel = (reason: ReportReason) => {
    const reasons = {
      spam: 'Spam',
      harassment: 'Assédio',
      hate_speech: 'Discurso de Ódio',
      misinformation: 'Desinformação',
      off_topic: 'Fora do Tópico',
      inappropriate: 'Conteúdo Inapropriado',
      copyright: 'Violação de Direitos Autorais'
    };
    return reasons[reason] || reason;
  };

  if (!hasPermission('comments', 'moderate')) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para moderar comentários.
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
            <CardTitle>Carregando Comentários...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderação de Comentários</h1>
          <p className="text-muted-foreground">
            Gerencie e modere os comentários do sistema.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => loadComments({ status: activeTab as CommentStatus })} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Comentários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Reportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reported || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approvalRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar comentários..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="published">Publicados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="reports">Reportados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {comments.filter(c => c.status === 'pending').map(comment => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{comment.user_name}</span>
                    <Badge variant="outline">{comment.news_title}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(comment.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{comment.content}</p>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleModerate(comment, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment, 'reject')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleModerate(comment, 'delete')}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {comments.filter(c => c.status === 'published').map(comment => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{comment.user_name}</span>
                    <Badge variant="outline">{comment.news_title}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(comment.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{comment.content}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {comment.likes || 0}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {comment.replies || 0} respostas
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {comments.filter(c => c.status === 'rejected').map(comment => (
            <Card key={comment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{comment.user_name}</span>
                    <Badge variant="outline">{comment.news_title}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(comment.status)}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{comment.content}</p>
                {comment.moderation_reason && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Motivo:</strong> {comment.moderation_reason}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Report #{report.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{getReportReasonLabel(report.reason)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Comentário:</p>
                    <p className="text-sm text-muted-foreground">{report.comment_content}</p>
                  </div>
                  {report.description && (
                    <div>
                      <p className="text-sm font-medium">Descrição do Report:</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleModerate(report.comment, 'delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Deletar Comentário
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerate(report.comment, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog} onOpenChange={setModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderar Comentário</DialogTitle>
            <DialogDescription>
              {moderationAction === 'approve' && 'Tem certeza que deseja aprovar este comentário?'}
              {moderationAction === 'reject' && 'Tem certeza que deseja rejeitar este comentário?'}
              {moderationAction === 'delete' && 'Tem certeza que deseja deletar este comentário?'}
            </DialogDescription>
          </DialogHeader>
          
          {(moderationAction === 'reject' || moderationAction === 'delete') && (
            <div>
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Descreva o motivo da moderação..."
                className="mt-2"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmModeration}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentsModeration;