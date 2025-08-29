// Componente NotificationBell - Ícone de sino com contador e dropdown
// Integra com useNotifications para exibir notificações em tempo real

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Settings } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import {
  Notification,
  NotificationIcons,
  NotificationColors,
  formatNotificationDate,
  isNotificationRead
} from '../types/notifications';

interface NotificationBellProps {
  className?: string;
  maxNotifications?: number;
  showPreferences?: boolean;
  onPreferencesClick?: () => void;
}

/**
 * Componente de sino de notificações com dropdown
 * Exibe contador de não lidas e lista das notificações recentes
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  maxNotifications = 10,
  showPreferences = true,
  onPreferencesClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotifications({
    enableRealtime: true,
    filters: { limit: maxNotifications }
  });

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Fechar dropdown com ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!isNotificationRead(notification)) {
      await markAsRead(notification.id);
    }

    // Aqui você pode adicionar lógica para navegar para a página relacionada
    // baseado no tipo de notificação e dados
    if (notification.data.news_id) {
      // Navegar para a notícia
      console.log('Navegar para notícia:', notification.data.news_id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const renderNotificationItem = (notification: Notification) => {
    const isRead = isNotificationRead(notification);
    const icon = NotificationIcons[notification.type] || '📢';
    const colorClasses = NotificationColors[notification.type] || 'text-gray-600 bg-gray-50';

    return (
      <div
        key={notification.id}
        className={`
          p-3 border-b border-gray-100 cursor-pointer transition-colors
          hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start space-x-3">
          {/* Ícone da notificação */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
            ${colorClasses}
          `}>
            {icon}
          </div>

          {/* Conteúdo da notificação */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`
                text-sm font-medium truncate
                ${!isRead ? 'text-gray-900' : 'text-gray-600'}
              `}>
                {notification.title}
              </h4>
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                {formatNotificationDate(notification.created_at)}
              </span>
            </div>

            {notification.message && (
              <p className={`
                text-sm mt-1 line-clamp-2
                ${!isRead ? 'text-gray-700' : 'text-gray-500'}
              `}>
                {notification.message}
              </p>
            )}

            {/* Indicador de não lida */}
            {!isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão do sino */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className={`
          relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
          rounded-full transition-colors focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:ring-offset-2
          ${isOpen ? 'bg-gray-100 text-gray-900' : ''}
        `}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        
        {/* Contador de não lidas */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 bg-red-500 text-white text-xs 
            rounded-full h-5 w-5 flex items-center justify-center 
            font-medium min-w-[20px]
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg 
            border border-gray-200 z-50 max-h-96 overflow-hidden
          "
        >
          {/* Header do dropdown */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notificações
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'})
                  </span>
                )}
              </h3>
              
              <div className="flex items-center space-x-1">
                {/* Botão de atualizar */}
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="
                    p-1 text-gray-400 hover:text-gray-600 rounded 
                    transition-colors disabled:opacity-50
                  "
                  title="Atualizar"
                >
                  <Bell className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                </button>

                {/* Botão de marcar todas como lidas */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="
                      p-1 text-gray-400 hover:text-gray-600 rounded 
                      transition-colors
                    "
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}

                {/* Botão de preferências */}
                {showPreferences && (
                  <button
                    onClick={onPreferencesClick}
                    className="
                      p-1 text-gray-400 hover:text-gray-600 rounded 
                      transition-colors
                    "
                    title="Configurações de notificação"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                {/* Botão de fechar */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="
                    p-1 text-gray-400 hover:text-gray-600 rounded 
                    transition-colors
                  "
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p className="text-sm">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Tentar novamente
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(renderNotificationItem)
            )}
          </div>

          {/* Footer com link para ver todas */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aqui você pode navegar para a página completa de notificações
                  console.log('Navegar para página de notificações');
                }}
                className="
                  w-full text-sm text-blue-600 hover:text-blue-800 
                  font-medium transition-colors
                "
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;