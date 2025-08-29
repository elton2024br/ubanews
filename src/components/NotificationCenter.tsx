// Componente NotificationCenter - Centro completo de notificações
// Interface completa para gerenciar todas as notificações do usuário

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Filter,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  ChevronDown,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationFilters,
  NotificationIcons,
  NotificationColors,
  NotificationTitles,
  formatNotificationDate,
  groupNotificationsByDate,
  isNotificationRead
} from '../types/notifications';

interface NotificationCenterProps {
  className?: string;
  showPreferences?: boolean;
  onPreferencesClick?: () => void;
}

/**
 * Centro completo de notificações com filtros e gerenciamento
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  showPreferences = true,
  onPreferencesClick
}) => {
  // Estados locais para filtros e UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);

  // Hook de notificações com filtros aplicados
  const filters = useMemo((): NotificationFilters => {
    const result: NotificationFilters = {
      limit: 50
    };

    if (selectedTypes.length > 0) {
      result.type = selectedTypes;
    }

    if (selectedStatus !== 'all') {
      result.status = selectedStatus;
    }

    if (dateRange.from) {
      result.dateFrom = dateRange.from;
    }

    if (dateRange.to) {
      result.dateTo = dateRange.to;
    }

    return result;
  }, [selectedTypes, selectedStatus, dateRange]);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh
  } = useNotifications({
    enableRealtime: true,
    filters
  });

  // Filtrar notificações por termo de busca
  const filteredNotifications = useMemo(() => {
    if (!searchTerm) return notifications;

    const term = searchTerm.toLowerCase();
    return notifications.filter(notification =>
      notification.title.toLowerCase().includes(term) ||
      notification.message?.toLowerCase().includes(term) ||
      NotificationTitles[notification.type].toLowerCase().includes(term)
    );
  }, [notifications, searchTerm]);

  // Agrupar notificações por data se habilitado
  const groupedNotifications = useMemo(() => {
    if (!groupByDate) {
      return { 'Todas': filteredNotifications };
    }
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications, groupByDate]);

  // Handlers para filtros
  const handleTypeToggle = (type: NotificationType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSelectedStatus('all');
    setDateRange({ from: '', to: '' });
    setSearchTerm('');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!isNotificationRead(notification)) {
      await markAsRead(notification.id);
    }

    // Lógica de navegação baseada no tipo de notificação
    if (notification.data.news_id) {
      console.log('Navegar para notícia:', notification.data.news_id);
    } else if (notification.data.comment_id) {
      console.log('Navegar para comentário:', notification.data.comment_id);
    }
  };

  // Renderizar item de notificação
  const renderNotificationItem = (notification: Notification) => {
    const isRead = isNotificationRead(notification);
    const icon = NotificationIcons[notification.type] || '📢';
    const colorClasses = NotificationColors[notification.type] || 'text-gray-600 bg-gray-50';

    return (
      <div
        key={notification.id}
        className={`
          p-4 border border-gray-200 rounded-lg cursor-pointer transition-all
          hover:shadow-md hover:border-gray-300
          ${!isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'}
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start space-x-4">
          {/* Ícone da notificação */}
          <div className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${colorClasses}
          `}>
            <span className="text-lg">{icon}</span>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`
                  text-sm font-semibold mb-1
                  ${!isRead ? 'text-gray-900' : 'text-gray-700'}
                `}>
                  {notification.title}
                </h3>
                
                <p className="text-xs text-gray-500 mb-2">
                  {NotificationTitles[notification.type]} • {formatNotificationDate(notification.created_at)}
                </p>

                {notification.message && (
                  <p className={`
                    text-sm leading-relaxed
                    ${!isRead ? 'text-gray-800' : 'text-gray-600'}
                  `}>
                    {notification.message}
                  </p>
                )}

                {/* Dados adicionais */}
                {notification.data.news_title && (
                  <div className="mt-2 text-xs text-gray-500">
                    📰 {notification.data.news_title}
                  </div>
                )}

                {notification.data.comment_author && (
                  <div className="mt-2 text-xs text-gray-500">
                    👤 {notification.data.comment_author}
                  </div>
                )}
              </div>

              {/* Ações rápidas */}
              <div className="flex items-center space-x-2 ml-4">
                {!isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="
                      p-1 text-gray-400 hover:text-blue-600 rounded
                      transition-colors
                    "
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {/* Indicador de não lida */}
                {!isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar seção de filtros
  const renderFilters = () => {
    if (!showFilters) return null;

    const allTypes: NotificationType[] = [
      'news_approved', 'news_rejected', 'news_published',
      'comment_new', 'comment_mention',
      'deadline_approaching', 'system_update',
      'user_action', 'approval_request'
    ];

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipos de Notificação
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {allTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {NotificationIcons[type]} {NotificationTitles[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtro por status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as NotificationStatus | 'all')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="unread">Não lidas</option>
              <option value="read">Lidas</option>
            </select>
          </div>

          {/* Filtro por data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Data inicial"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Data final"
              />
            </div>
          </div>
        </div>

        {/* Ações dos filtros */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={groupByDate}
                onChange={(e) => setGroupByDate(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Agrupar por data</span>
            </label>
          </div>

          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bell className="w-6 h-6 mr-2" />
              Central de Notificações
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount > 0 ? (
                `${unreadCount} notificação${unreadCount === 1 ? '' : 'ões'} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
              ) : (
                'Todas as notificações estão em dia'
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botão de atualizar */}
            <button
              onClick={refresh}
              disabled={loading}
              className="
                p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                rounded-lg transition-colors disabled:opacity-50
              "
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Botão de marcar todas como lidas */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="
                  px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 
                  hover:bg-blue-50 rounded-lg transition-colors
                "
              >
                <CheckCheck className="w-4 h-4 mr-1 inline" />
                Marcar todas como lidas
              </button>
            )}

            {/* Botão de preferências */}
            {showPreferences && (
              <button
                onClick={onPreferencesClick}
                className="
                  p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                  rounded-lg transition-colors
                "
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de busca e filtros */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              "
            />
          </div>

          {/* Botão de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-colors
              flex items-center space-x-2
              ${showFilters 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Seção de filtros */}
      <div className="px-6 py-4">
        {renderFilters()}
      </div>

      {/* Lista de notificações */}
      <div className="px-6 pb-6">
        {loading && notifications.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-24"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <X className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar notificações</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || selectedTypes.length > 0 || selectedStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Você está em dia com todas as notificações!'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
              <div key={dateGroup}>
                {groupByDate && (
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {dateGroup}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({groupNotifications.length})
                    </span>
                  </h2>
                )}
                
                <div className="space-y-3">
                  {groupNotifications.map(renderNotificationItem)}
                </div>
              </div>
            ))}

            {/* Botão carregar mais */}
            {hasMore && (
              <div className="text-center pt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="
                    px-6 py-3 bg-gray-100 text-gray-700 rounded-lg 
                    hover:bg-gray-200 transition-colors disabled:opacity-50
                    font-medium
                  "
                >
                  {loading ? 'Carregando...' : 'Carregar mais notificações'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;