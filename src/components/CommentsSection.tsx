import React, { useState, useCallback } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CommentTree } from '@/types/comments';
import { 
  MessageCircle, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MoreVertical,
  Edit3,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  newsId: string;
  newsTitle: string;
  className?: string;
}

export function CommentsSection({ newsId, newsTitle, className }: CommentsSectionProps) {
  const { user } = useAuth();
  const {
    comments,
    commentTree,
    stats,
    loading,
    error,
    hasMore,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
    reportComment,
    loadComments,
    validateComment,
  } = useComments(newsId);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const handleCreateComment = useCallback(async () => {
    if (!user) return;

    const validation = validateComment(newComment);
    if (!validation.isValid) return;

    const success = await createComment({
      newsId,
      content: newComment,
    });

    if (success) {
      setNewComment('');
    }
  }, [user, newComment, createComment, newsId, validateComment]);

  const handleCreateReply = useCallback(async (parentId: string) => {
    if (!user) return;

    const validation = validateComment(replyContent);
    if (!validation.isValid) return;

    const success = await createComment({
      newsId,
      content: replyContent,
      parentId,
    });

    if (success) {
      setReplyContent('');
      setReplyingTo(null);
    }
  }, [user, replyContent, createComment, newsId, validateComment]);

  const handleUpdateComment = useCallback(async () => {
    if (!editingCommentId) return;

    const success = await updateComment(editingCommentId, {
      content: editingContent,
    });

    if (success) {
      setEditingCommentId(null);
      setEditingContent('');
    }
  }, [editingCommentId, editingContent, updateComment]);

  const handleDeleteComment = useCallback(async () => {
    if (!deletingCommentId) return;

    const success = await deleteComment(deletingCommentId);

    if (success) {
      setShowDeleteDialog(false);
      setDeletingCommentId(null);
    }
  }, [deletingCommentId, deleteComment]);

  const handleReportComment = useCallback(async () => {
    if (!reportingCommentId) return;

    const success = await reportComment(reportingCommentId, reportReason as any, reportDescription);

    if (success) {
      setShowReportDialog(false);
      setReportingCommentId(null);
      setReportReason('');
      setReportDescription('');
    }
  }, [reportingCommentId, reportReason, reportDescription, reportComment]);

  const handleReaction = useCallback(async (commentId: string, type: 'like' | 'dislike') => {
    if (!user) return;

    const currentComment = comments.find(c => c.id === commentId);
    if (!currentComment) return;

    const userReaction = currentComment.userReactions?.[user.id];
    
    if (userReaction === type) {
      await removeReaction(commentId, type);
    } else {
      if (userReaction) {
        await removeReaction(commentId, userReaction);
      }
      await addReaction(commentId, type);
    }
  }, [user, comments, addReaction, removeReaction]);

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentTree; depth?: number }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingTo === comment.id;

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'pending':
          return <Badge variant="outline" className="text-yellow-600">Pendente</Badge>;
        case 'hidden':
          return <Badge variant="outline" className="text-red-600">Oculto</Badge>;
        case 'deleted':
          return <Badge variant="outline" className="text-gray-500">Deletado</Badge>;
        default:
          return null;
      }
    };

    const getReactionIcon = (type: string, count: number, userReacted: boolean) => {
      const Icon = type === 'like' ? ThumbsUp : ThumbsDown;
      return (
        <button
          onClick={() => handleReaction(comment.id, type as 'like' | 'dislike')}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
            userReacted 
              ? "bg-blue-100 text-blue-600" 
              : "hover:bg-gray-100 text-gray-600"
          )}
        >
          <Icon size={16} />
          <span>{count}</span>
        </button>
      );
    };

    if (comment.status === 'deleted') {
      return (
        <div className="py-4 px-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
          Comentário deletado
        </div>
      );
    }

    return (
      <Card className={cn("p-4", depth > 0 && "ml-8 border-l-2 border-l-gray-200")}>
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.user?.avatar_url} />
            <AvatarFallback>
              {comment.user?.full_name?.[0] || comment.user?.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.user?.full_name || comment.user?.email || 'Usuário'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-400">(editado)</span>
                )}
                {getStatusBadge(comment.status)}
              </div>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {comment.user_id === user.id && comment.status !== 'deleted' && (
                      <>
                        <DropdownMenuItem onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingContent(comment.content);
                        }}>
                          <Edit3 size={14} className="mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setDeletingCommentId(comment.id);
                          setShowDeleteDialog(true);
                        }}>
                          <Trash2 size={14} className="mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </>
                    )}
                    {comment.user_id !== user.id && (
                      <DropdownMenuItem onClick={() => {
                        setReportingCommentId(comment.id);
                        setShowReportDialog(true);
                      }}>
                        <Flag size={14} className="mr-2" />
                        Reportar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateComment}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingCommentId(null);
                    setEditingContent('');
                  }}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">
                  {comment.content}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getReactionIcon('like', comment.like_count || 0, comment.user_reactions?.like || false)}
                    {getReactionIcon('dislike', comment.dislike_count || 0, comment.user_reactions?.dislike || false)}
                  </div>

                  {user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(comment.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      Responder
                    </Button>
                  )}
                </div>

                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCreateReply(comment.id)}>
                        <Send size={14} className="mr-1" />
                        Responder
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {comment.children && comment.children.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {comment.children.map(child => (
                      <CommentItem key={child.id} comment={child} depth={depth + 1} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Faça login para comentar</h3>
          <p className="text-sm text-gray-600">
            Entre na sua conta para participar da discussão sobre "{newsTitle}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Comentários ({stats?.totalComments || 0})
        </h3>
        {stats && (
          <div className="text-sm text-gray-600">
            {stats.publishedComments} publicados
            {stats.pendingComments > 0 && `, ${stats.pendingComments} pendentes`}
          </div>
        )}
      </div>

      {/* Novo comentário */}
      <Card className="p-4">
        <div className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva seu comentário..."
            className="min-h-[80px]"
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {newComment.length}/2000 caracteres
            </span>
            <Button 
              onClick={handleCreateComment}
              disabled={!newComment.trim() || loading}
            >
              <Send size={14} className="mr-2" />
              Comentar
            </Button>
          </div>
        </div>
      </Card>

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Lista de comentários */}
      <div className="space-y-4">
        {commentTree.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {!loading && commentTree.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Seja o primeiro a comentar!</p>
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => loadComments()}
              disabled={loading}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Carregar mais comentários
            </Button>
          </div>
        )}
      </div>

      {/* Diálogo de report */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar Comentário</DialogTitle>
            <DialogDescription>
              Por favor, selecione o motivo do report e forneça uma descrição detalhada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Selecione um motivo</option>
                <option value="spam">Spam</option>
                <option value="harassment">Assédio</option>
                <option value="hate_speech">Discurso de ódio</option>
                <option value="misinformation">Desinformação</option>
                <option value="inappropriate">Conteúdo inapropriado</option>
                <option value="off_topic">Fora do tópico</option>
                <option value="other">Outro</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Descreva o problema em detalhes..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReportDialog(false);
              setReportingCommentId(null);
              setReportReason('');
              setReportDescription('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReportComment}
              disabled={!reportReason}
            >
              Reportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este comentário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setDeletingCommentId(null);
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteComment}
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}