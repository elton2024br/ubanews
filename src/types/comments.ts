// Tipos para o sistema de comentários

export type CommentStatus = 'published' | 'pending' | 'hidden' | 'deleted';
export type ReactionType = 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad';
export type ReportReason = 
  | 'spam' 
  | 'harassment' 
  | 'hate_speech' 
  | 'misinformation' 
  | 'off_topic' 
  | 'inappropriate_content'
  | 'copyright_violation';

export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'dismissed';
export type ModerationAction = 
  | 'approved' 
  | 'hidden' 
  | 'deleted' 
  | 'edited' 
  | 'warned' 
  | 'banned';

// Interface base para comentários
export interface Comment {
  id: string;
  newsId: string;
  parentId: string | null;
  userId: string;
  content: string;
  status: CommentStatus;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Dados do usuário (join)
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  
  // Estatísticas
  totalReactions?: number;
  likes?: number;
  dislikes?: number;
  loves?: number;
  laughs?: number;
  angry?: number;
  sad?: number;
  reportsCount?: number;
  replyCount?: number;
  
  // Reações do usuário atual
  userReactions?: ReactionType[];
}

// Interface para criação de comentários
export interface CreateCommentData {
  newsId: string;
  parentId?: string;
  content: string;
}

// Interface para atualização de comentários
export interface UpdateCommentData {
  content: string;
}

// Interface para reações
export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: string;
}

// Interface para reports
export interface CommentReport {
  id: string;
  commentId: string;
  reporterId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Interface para moderação
export interface CommentModeration {
  id: string;
  commentId: string;
  moderatorId: string;
  action: ModerationAction;
  reason?: string;
  details?: Record<string, any>;
  createdAt: string;
}

// Interface para comentários em árvore (hierárquica)
export interface CommentTree extends Comment {
  depth: number;
  path: string[];
  children: CommentTree[];
}

// Interface para paginação de comentários
export interface CommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Interface para filtros de comentários
export interface CommentsFilters {
  status?: CommentStatus;
  newsId?: string;
  userId?: string;
  parentId?: string | null;
  search?: string;
  sortBy?: 'created_at' | 'likes' | 'reply_count';
  sortOrder?: 'asc' | 'desc';
}

// Interface para configuração de comentários
export interface CommentsConfig {
  enabled: boolean;
  requireApproval: boolean;
  maxDepth: number;
  maxLength: number;
  allowReactions: boolean;
  allowReplies: boolean;
  allowEditing: boolean;
  allowDeleting: boolean;
  allowReporting: boolean;
  autoModeration: {
    enabled: boolean;
    spamKeywords: string[];
    blockedUsers: string[];
  };
}

// Interface para estatísticas de comentários
export interface CommentsStats {
  totalComments: number;
  publishedComments: number;
  pendingComments: number;
  hiddenComments: number;
  deletedComments: number;
  totalReactions: number;
  totalReports: number;
  reportsPending: number;
  reportsApproved: number;
  reportsRejected: number;
}

// Interface para resposta da API
export interface CommentsResponse {
  comments: Comment[];
  pagination: CommentsPagination;
  stats?: CommentsStats;
}

// Interface para comentários do usuário
export interface UserComment extends Comment {
  newsTitle: string;
  newsUrl: string;
  newsCategory: string;
}

// Interface para notificações de comentários
export interface CommentNotification {
  id: string;
  type: 'new_comment' | 'reply' | 'reaction' | 'report';
  commentId: string;
  newsId: string;
  newsTitle: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// Interface para webhook de moderação
export interface ModerationWebhook {
  action: ModerationAction;
  commentId: string;
  userId: string;
  reason?: string;
  moderatorId: string;
  timestamp: string;
}

// Interface para análise de sentimento
export interface SentimentAnalysis {
  score: number; // -1 a 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

// Interface para detecção de spam
export interface SpamDetection {
  isSpam: boolean;
  confidence: number;
  reasons: string[];
}

// Interface para configuração de notificações
export interface CommentNotificationSettings {
  newComments: boolean;
  replies: boolean;
  reactions: boolean;
  reports: boolean;
  moderation: boolean;
  email: boolean;
  push: boolean;
}

// Interface para cache de comentários
export interface CommentsCache {
  comments: Map<string, Comment>;
  trees: Map<string, CommentTree[]>;
  stats: Map<string, CommentsStats>;
  lastUpdated: Map<string, number>;
}

// Interface para webhooks
export interface CommentWebhook {
  event: 
    | 'comment.created'
    | 'comment.updated'
    | 'comment.deleted'
    | 'comment.moderated'
    | 'reaction.added'
    | 'reaction.removed'
    | 'report.created'
    | 'report.updated';
  data: {
    comment?: Comment;
    reaction?: CommentReaction;
    report?: CommentReport;
    moderation?: CommentModeration;
    timestamp: string;
  };
}

// Interface para rate limiting
export interface CommentRateLimit {
  maxCommentsPerMinute: number;
  maxCommentsPerHour: number;
  maxCommentsPerDay: number;
  currentCount: number;
  resetTime: number;
}

// Interface para validação de comentários
export interface CommentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Interface para busca de comentários
export interface CommentSearch {
  query: string;
  filters: CommentsFilters;
  results: Comment[];
  total: number;
  highlights: Array<{
    commentId: string;
    field: string;
    matches: string[];
  }>;
}

// Interface para exportação de comentários
export interface CommentExport {
  format: 'json' | 'csv' | 'xml';
  comments: Comment[];
  metadata: {
    exportedAt: string;
    total: number;
    filters: CommentsFilters;
  };
}

// Interface para importação de comentários
export interface CommentImport {
  format: 'json' | 'csv' | 'xml';
  comments: CreateCommentData[];
  options: {
    skipDuplicates: boolean;
    validateContent: boolean;
    autoModerate: boolean;
  };
  results: {
    imported: number;
    skipped: number;
    errors: string[];
  };
}

// Interface para análise de engajamento
export interface CommentEngagement {
  commentId: string;
  views: number;
  reactions: number;
  replies: number;
  shares: number;
  engagementRate: number;
  trending: boolean;
  lastActivity: string;
}

// Interface para dashboard de moderação
export interface ModerationDashboard {
  stats: CommentsStats;
  recentReports: CommentReport[];
  pendingModeration: Comment[];
  flaggedUsers: Array<{
    userId: string;
    userName: string;
    reportCount: number;
    lastReport: string;
  }>;
  systemHealth: {
    queueSize: number;
    processingTime: number;
    errorRate: number;
  };
}