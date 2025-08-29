import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuditLog } from '../hooks/useAuditLog';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Calendar,
  User,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface NewsApproval {
  approval_id: string;
  news_id: string;
  news_title: string;
  news_excerpt: string;
  news_category: string;
  featured_image: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline: string;
  feedback: string | null;
  notes: string | null;
  required_approvals: number;
  current_approvals: number;
  submitted_at: string;
  last_updated: string;
  approved_at: string | null;
  rejected_at: string | null;
  author_email: string;
  author_name: string;
  author_role: string;
  reviewer_email: string | null;
  reviewer_name: string | null;
  reviewer_role: string | null;
  is_overdue: boolean;
  hours_until_deadline: number;
  metadata: Record<string, unknown> | null;
}

interface NewsApprovalsProps {
  className?: string;
}

const NewsApprovals: React.FC<NewsApprovalsProps> = ({ className = '' }) => {
  const [approvals, setApprovals] = useState<NewsApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<NewsApproval | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('deadline');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  
  const { logUserAction, logError } = useAuditLog();

  useEffect(() => {
    fetchCurrentUser();
    fetchApprovals();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', user.email)
          .single();
        setCurrentUser(adminUser);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news_approvals_dashboard')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Erro ao carregar aprovações');
      logError('fetch_approvals_failed', 'news_approvals', null, { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject') => {
    if (!currentUser) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('review_news', {
        p_approval_id: approvalId,
        p_action: action,
        p_reviewer_id: currentUser.id,
        p_feedback: feedback || null,
        p_notes: notes || null
      });

      if (error) throw error;

      toast.success(`Notícia ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      
      // Log the action
      await logUserAction(
        `news_${action}`,
        'news_approval',
        approvalId,
        {
          action,
          feedback,
          notes,
          news_title: selectedApproval?.news_title
        }
      );

      setShowModal(false);
      setSelectedApproval(null);
      setFeedback('');
      setNotes('');
      fetchApprovals();
    } catch (error) {
      console.error(`Error ${action}ing news:`, error);
      toast.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} notícia`);
      logError(`news_${action}_failed`, 'news_approval', approvalId, { error: error.message });
    }
  };

  const openApprovalModal = (approval: NewsApproval) => {
    setSelectedApproval(approval);
    setFeedback(approval.feedback || '');
    setNotes(approval.notes || '');
    setShowModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'normal': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesStatus = filterStatus === 'all' || approval.approval_status === filterStatus;
    const matchesPriority = filterPriority === 'all' || approval.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      approval.news_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.author_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority': {
        const priorityOrder: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      case 'submitted':
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aprovações de Notícias</h2>
        <p className="text-gray-600">Gerencie o workflow editorial e aprove/rejeite notícias pendentes</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todas as Prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="normal">Normal</option>
          <option value="low">Baixa</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="deadline">Ordenar por Prazo</option>
          <option value="priority">Ordenar por Prioridade</option>
          <option value="submitted">Ordenar por Data</option>
        </select>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aprovação encontrada</h3>
            <p className="text-gray-500">Não há notícias pendentes de aprovação no momento.</p>
          </div>
        ) : (
          filteredApprovals.map((approval) => (
            <div
              key={approval.approval_id}
              className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                approval.is_overdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {approval.news_title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getPriorityColor(approval.priority)
                      }`}>
                        {approval.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(approval.approval_status)
                      }`}>
                        {approval.approval_status === 'pending' ? 'PENDENTE' :
                         approval.approval_status === 'approved' ? 'APROVADO' : 'REJEITADO'}
                      </span>
                      {approval.is_overdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                          ATRASADO
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {approval.news_excerpt}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{approval.author_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Prazo: {new Date(approval.deadline).toLocaleDateString('pt-BR')}
                          {approval.hours_until_deadline > 0 && (
                            <span className="ml-1 text-orange-600">
                              ({Math.round(approval.hours_until_deadline)}h restantes)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Enviado em {new Date(approval.submitted_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {approval.approval_status === 'pending' && (
                      <>
                        <button
                          onClick={() => openApprovalModal(approval)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => openApprovalModal(approval)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => window.open(`/admin/news/${approval.news_id}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </button>
                  </div>
                </div>
                
                {(approval.feedback || approval.notes) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {approval.feedback && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Feedback:</span>
                        <p className="text-sm text-gray-600 mt-1">{approval.feedback}</p>
                      </div>
                    )}
                    {approval.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Notas:</span>
                        <p className="text-sm text-gray-600 mt-1">{approval.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal */}
      {showModal && selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revisar: {selectedApproval.news_title}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">{selectedApproval.news_excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Autor: {selectedApproval.author_name}</span>
                <span>Categoria: {selectedApproval.news_category}</span>
                <span>Prioridade: {selectedApproval.priority}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Forneça feedback sobre a notícia..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas internas (opcional)..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleApproval(selectedApproval.approval_id, 'reject')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar
              </button>
              <button
                onClick={() => handleApproval(selectedApproval.approval_id, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsApprovals;