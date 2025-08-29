import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
  Comment,
  CommentTree,
  CommentsFilters,
  CommentsResponse,
  CommentsStats,
  CreateCommentData,
  UpdateCommentData,
  ReactionType,
  CommentReport,
  ReportReason,
  CommentsConfig,
  CommentValidation,
  CommentNotification,
  CommentEngagement,
} from '@/types/comments';

// Configuração padrão
const defaultConfig: CommentsConfig = {
  enabled: true,
  requireApproval: false,
  maxDepth: 3,
  maxLength: 2000,
  allowReactions: true,
  allowReplies: true,
  allowEditing: true,
  allowDeleting: true,
  allowReporting: true,
  autoModeration: {
    enabled: true,
    spamKeywords: ['spam', 'click here', 'buy now', 'free money'],
    blockedUsers: [],
  },
};

// Hook principal para gerenciar comentários
export function useComments(newsId: string, config: Partial<CommentsConfig> = {}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTree, setCommentTree] = useState<CommentTree[]>([]);
  const [stats, setStats] = useState<CommentsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configState, setConfigState] = useState<CommentsConfig>({ ...defaultConfig, ...config });
  const [notifications, setNotifications] = useState<CommentNotification[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Validar comentário
  const validateComment = useCallback((content: string): CommentValidation => {
    const validation: CommentValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    if (!content.trim()) {
      validation.isValid = false;
      validation.errors.push('O conteúdo do comentário não pode estar vazio.');
    }

    if (content.length > configState.maxLength) {
      validation.isValid = false;
      validation.errors.push(`O comentário não pode ter mais de ${configState.maxLength} caracteres.`);
    }

    if (content.length < 3) {
      validation.warnings.push('O comentário é muito curto. Considere expandir sua mensagem.');
    }

    // Verificar spam keywords
    if (configState.autoModeration.enabled) {
      const spamKeywords = configState.autoModeration.spamKeywords;
      const foundSpam = spamKeywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundSpam.length > 0) {
        validation.warnings.push('O comentário contém palavras que podem ser consideradas spam.');
      }
    }

    return validation;
  }, [configState]);

  // Carregar comentários
  const loadComments = useCallback(async (filters: CommentsFilters = {}, reset = false) => {
    if (!configState.enabled) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('comments_with_stats')
        .select('*')
        .eq('news_id', newsId)
        .eq('parent_id', filters.parentId || null);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.search) {
        query = query.ilike('content', `%${filters.search}%`);
      }

      // Ordenação
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      const offset = reset ? 0 : (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      const newComments = data || [];
      
      if (reset) {
        setComments(newComments);
        setPage(1);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }

      setHasMore(newComments.length === limit);
      setPage(prev => reset ? 2 : prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  }, [newsId, configState.enabled, page, limit]);

  // Criar comentário
  const createComment = useCallback(async (data: CreateCommentData): Promise<Comment | null> => {
    if (!configState.enabled) {
      setError('Sistema de comentários desabilitado');
      return null;
    }

    const validation = validateComment(data.content);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado para comentar');
        return null;
      }

      const commentData = {
        news_id: data.newsId,
        parent_id: data.parentId || null,
        user_id: user.id,
        content: data.content.trim(),
        status: configState.requireApproval ? 'pending' : 'published',
      };

      const { data: newComment, error: supabaseError } = await supabase
        .from('comments')
        .insert(commentData)
        .select('*')
        .single();

      if (supabaseError) throw supabaseError;

      // Recarregar comentários
      await loadComments({}, true);
      
      // Adicionar notificação
      const notification: CommentNotification = {
        id: crypto.randomUUID(),
        type: data.parentId ? 'reply' : 'new_comment',
        commentId: newComment.id,
        newsId: data.newsId,
        newsTitle: 'Notícia', // TODO: Buscar título real
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'Usuário',
        message: `Novo ${data.parentId ? 'resposta' : 'comentário'} adicionado`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      
      setNotifications(prev => [notification, ...prev]);

      return newComment;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar comentário');
      return null;
    }
  }, [configState, validateComment, loadComments]);

  // Atualizar comentário
  const updateComment = useCallback(async (
    commentId: string, 
    data: UpdateCommentData
  ): Promise<boolean> => {
    if (!configState.allowEditing) {
      setError('Edição de comentários desabilitada');
      return false;
    }

    const validation = validateComment(data.content);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('comments')
        .update({
          content: data.content.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

      // Atualizar lista local
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: data.content, isEdited: true, editedAt: new Date().toISOString() }
          : comment
      ));

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar comentário');
      return false;
    }
  }, [configState.allowEditing, validateComment]);

  // Deletar comentário
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    if (!configState.allowDeleting) {
      setError('Exclusão de comentários desabilitada');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('comments')
        .update({ status: 'deleted' })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (supabaseError) throw supabaseError;

      // Atualizar lista local
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, status: 'deleted' }
          : comment
      ));

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar comentário');
      return false;
    }
  }, [configState.allowDeleting]);

  // Adicionar reação
  const addReaction = useCallback(async (
    commentId: string, 
    reactionType: ReactionType
  ): Promise<boolean> => {
    if (!configState.allowReactions) {
      setError('Reações desabilitadas');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('comment_reactions')
        .upsert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        }, {
          onConflict: 'comment_id,user_id,reaction_type',
        });

      if (supabaseError) throw supabaseError;

      // Recarregar comentários para atualizar estatísticas
      await loadComments({}, true);

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar reação');
      return false;
    }
  }, [configState.allowReactions, loadComments]);

  // Remover reação
  const removeReaction = useCallback(async (
    commentId: string, 
    reactionType: ReactionType
  ): Promise<boolean> => {
    if (!configState.allowReactions) {
      setError('Reações desabilitadas');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (supabaseError) throw supabaseError;

      // Recarregar comentários para atualizar estatísticas
      await loadComments({}, true);

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover reação');
      return false;
    }
  }, [configState.allowReactions, loadComments]);

  // Reportar comentário
  const reportComment = useCallback(async (
    commentId: string,
    reason: ReportReason,
    description?: string
  ): Promise<boolean> => {
    if (!configState.allowReporting) {
      setError('Sistema de reports desabilitado');
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado');
        return false;
      }

      const { error: supabaseError } = await supabase
        .from('comment_reports')
        .insert({
          comment_id: commentId,
          reporter_id: user.id,
          reason,
          description: description?.trim(),
        });

      if (supabaseError) throw supabaseError;

      return true;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reportar comentário');
      return false;
    }
  }, [configState.allowReporting]);

  // Obter estatísticas
  const loadStats = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('comments_stats')
        .select('*')
        .eq('news_id', newsId)
        .single();

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw supabaseError;
      }

      setStats(data || {
        totalComments: 0,
        publishedComments: 0,
        pendingComments: 0,
        hiddenComments: 0,
        deletedComments: 0,
        totalReactions: 0,
        totalReports: 0,
        reportsPending: 0,
        reportsApproved: 0,
        reportsRejected: 0,
      });

    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, [newsId]);

  // Construir árvore de comentários
  const buildCommentTree = useCallback((comments: Comment[]): CommentTree[] => {
    const commentMap = new Map<string, CommentTree>();
    const rootComments: CommentTree[] = [];

    // Primeiro, criar todos os nós
    comments.forEach(comment => {
      commentMap.set(comment.id, {
        ...comment,
        depth: 0,
        path: [comment.id],
        children: [],
      });
    });

    // Depois, construir a árvore
    comments.forEach(comment => {
      const node = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent && parent.depth < configState.maxDepth) {
          parent.children.push(node);
          node.depth = parent.depth + 1;
          node.path = [...parent.path, comment.id];
        }
      } else {
        rootComments.push(node);
      }
    });

    return rootComments;
  }, [configState.maxDepth]);

  // Marcar notificações como lidas
  const markNotificationsAsRead = useCallback((notificationIds: string[]) => {
    setNotifications(prev => 
      prev.map(notification => 
        notificationIds.includes(notification.id) 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Limpar notificações antigas
  const clearOldNotifications = useCallback(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    setNotifications(prev => 
      prev.filter(notification => 
        new Date(notification.createdAt) > oneWeekAgo
      )
    );
  }, []);

  // Atualizar configuração
  const updateConfig = useCallback((newConfig: Partial<CommentsConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Recarregar tudo
  const refresh = useCallback(async () => {
    await Promise.all([
      loadComments({}, true),
      loadStats(),
    ]);
  }, [loadComments, loadStats]);

  // Efeitos
  useEffect(() => {
    if (newsId && configState.enabled) {
      loadComments({}, true);
      loadStats();
    }
  }, [newsId, configState.enabled]);

  useEffect(() => {
    if (comments.length > 0) {
      const tree = buildCommentTree(comments);
      setCommentTree(tree);
    }
  }, [comments, buildCommentTree]);

  // Limpar notificações antigas periodicamente
  useEffect(() => {
    const interval = setInterval(clearOldNotifications, 24 * 60 * 60 * 1000); // 24 horas
    return () => clearInterval(interval);
  }, [clearOldNotifications]);

  return {
    comments,
    commentTree,
    stats,
    loading,
    error,
    hasMore,
    notifications,
    config: configState,
    
    // Actions
    loadComments,
    createComment,
    updateComment,
    deleteComment,
    addReaction,
    removeReaction,
    reportComment,
    loadStats,
    markNotificationsAsRead,
    clearOldNotifications,
    updateConfig,
    refresh,
    validateComment,
  };
}