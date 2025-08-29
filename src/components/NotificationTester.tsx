// Componente NotificationTester - Para testar o sistema de notificações em tempo real
// Interface para demonstrar e testar todas as funcionalidades de notificação

import React, { useState, useEffect } from 'react';
import {
  TestTube,
  Send,
  Users,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  NotificationType,
  Notification,
  CreateNotificationParams,
  NotificationTitles,
  NotificationIcons,
  NotificationColors
} from '../types/notifications';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPreferences } from './NotificationPreferences';

interface NotificationTesterProps {
  userId: string;
  className?: string;
}

/**
 * Componente para testar o sistema de notificações em tempo real
 */
export const NotificationTester: React.FC<NotificationTesterProps> = ({
  userId,
  className = ''
}) => {
  // Hook de notificações
  const {
    notifications,
    unreadCount,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    isConnected
  } = useNotifications({
    userId,
    autoRefresh: true,
    refreshInterval: 5000
  });

  // Estados do componente
  const [activeTab, setActiveTab] = useState<'tester' | 'bell' | 'center' | 'preferences'>('tester');
  const [testType, setTestType] = useState<NotificationType>('news_published');
  const [testTitle, setTestTitle] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testData, setTestData] = useState('{}');
  const [sending, setSending] = useState(false);
  const [autoTest, setAutoTest] = useState(false);
  const [testInterval, setTestInterval] = useState<NodeJS.Timeout | null>(null);
  const [testCount, setTestCount] = useState(0);
  const [showRealtime, setShowRealtime] = useState(true);
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);

  // Limpa intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (testInterval) {
        clearInterval(testInterval);
      }
    };
  }, [testInterval]);

  // Monitora eventos em tempo real
  useEffect(() => {
    if (!showRealtime) return;

    const channel = supabase
      .channel('notification_tester')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const event = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            event: payload.eventType,
            table: payload.table,
            data: payload.new || payload.old
          };
          
          setRealtimeEvents(prev => [event, ...prev.slice(0, 9)]); // Mantém apenas os 10 mais recentes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, showRealtime]);

  // Atualiza campos de teste baseado no tipo
  useEffect(() => {
    setTestTitle(NotificationTitles[testType] || 'Teste de Notificação');
    
    const messages = {
      news_published: 'Nova notícia "Evento em Ubatuba" foi publicada',
      news_approved: 'Sua notícia "Praia do Félix" foi aprovada',
      news_rejected: 'Sua notícia precisa de ajustes',
      comment_new: 'Novo comentário na sua notícia',
      comment_mention: 'Você foi mencionado em um comentário',
      deadline_approaching: 'Prazo de entrega se aproxima em 2 horas',
      system_update: 'Sistema será atualizado às 02:00',
      user_action: 'Perfil atualizado com sucesso',
      approval_request: 'Nova notícia aguarda aprovação'
    };
    
    setTestMessage(messages[testType] || 'Mensagem de teste');
    
    const dataExamples = {
      news_published: JSON.stringify({ newsId: '123', category: 'eventos', author: 'Admin' }, null, 2),
      comment_new: JSON.stringify({ commentId: '456', newsId: '123', author: 'João' }, null, 2),
      deadline_approaching: JSON.stringify({ taskId: '789', deadline: '2024-01-20T14:00:00Z' }, null, 2)
    };
    
    setTestData(dataExamples[testType] || '{}');
  }, [testType]);

  // Envia notificação de teste
  const sendTestNotification = async () => {
    try {
      setSending(true);
      
      let parsedData = {};
      try {
        parsedData = JSON.parse(testData);
      } catch (e) {
        console.warn('Invalid JSON data, using empty object');
      }

      const params: CreateNotificationParams = {
        userId,
        type: testType,
        title: testTitle,
        message: testMessage,
        data: parsedData
      };

      await createNotification(params);
      setTestCount(prev => prev + 1);
      
    } catch (err: any) {
      console.error('Error sending test notification:', err);
    } finally {
      setSending(false);
    }
  };

  // Inicia/para teste automático
  const toggleAutoTest = () => {
    if (autoTest) {
      if (testInterval) {
        clearInterval(testInterval);
        setTestInterval(null);
      }
      setAutoTest(false);
    } else {
      const interval = setInterval(() => {
        sendTestNotification();
      }, 3000);
      setTestInterval(interval);
      setAutoTest(true);
    }
  };

  // Limpa todas as notificações (para teste)
  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
        
      if (error) throw error;
      
      await refreshNotifications();
      setTestCount(0);
    } catch (err: any) {
      console.error('Error clearing notifications:', err);
    }
  };

  const allNotificationTypes: NotificationType[] = [
    'news_published', 'news_approved', 'news_rejected',
    'comment_new', 'comment_mention',
    'deadline_approaching', 'system_update',
    'user_action', 'approval_request'
  ];

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TestTube className="w-6 h-6 mr-2" />
              Sistema de Notificações - Teste
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Teste e demonstração do sistema de notificações em tempo real
            </p>
          </div>
          
          {/* Status de Conexão */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </div>
            
            <div className="text-sm text-gray-600">
              {unreadCount} não lidas
            </div>
            
            <NotificationBell userId={userId} />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'tester', label: 'Tester', icon: TestTube },
            { id: 'bell', label: 'Sino', icon: Bell },
            { id: 'center', label: 'Central', icon: Users },
            { id: 'preferences', label: 'Preferências', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <div className="p-6">
        {activeTab === 'tester' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Painel de Teste */}
            <div className="space-y-6">
              {/* Controles de Teste */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Notificação de Teste
                </h2>
                
                <div className="space-y-4">
                  {/* Tipo de Notificação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Notificação
                    </label>
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as NotificationType)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {allNotificationTypes.map(type => (
                        <option key={type} value={type}>
                          {NotificationIcons[type]} {NotificationTitles[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Título da notificação"
                    />
                  </div>
                  
                  {/* Mensagem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem
                    </label>
                    <textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Conteúdo da notificação"
                    />
                  </div>
                  
                  {/* Dados JSON */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dados (JSON)
                    </label>
                    <textarea
                      value={testData}
                      onChange={(e) => setTestData(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleAutoTest}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                          autoTest
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {autoTest ? (
                          <><Pause className="w-4 h-4 mr-2" />Parar Auto-Teste</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" />Iniciar Auto-Teste</>
                        )}
                      </button>
                      
                      <span className="text-sm text-gray-600">
                        {testCount} enviadas
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={clearAllNotifications}
                        className="px-4 py-2 text-red-600 hover:text-red-800 text-sm transition-colors"
                      >
                        Limpar Todas
                      </button>
                      
                      <button
                        onClick={sendTestNotification}
                        disabled={sending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <Send className={`w-4 h-4 mr-2 ${sending ? 'animate-pulse' : ''}`} />
                        {sending ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Estatísticas */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                    <div className="text-sm text-blue-800">Total</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
                    <div className="text-sm text-red-800">Não Lidas</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</div>
                    <div className="text-sm text-green-800">Lidas</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{testCount}</div>
                    <div className="text-sm text-purple-800">Enviadas</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Painel de Monitoramento */}
            <div className="space-y-6">
              {/* Eventos em Tempo Real */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Eventos em Tempo Real
                  </h3>
                  
                  <button
                    onClick={() => setShowRealtime(!showRealtime)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center ${
                      showRealtime
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {showRealtime ? (
                      <><Eye className="w-4 h-4 mr-1" />Ativo</>
                    ) : (
                      <><EyeOff className="w-4 h-4 mr-1" />Inativo</>
                    )}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {realtimeEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Aguardando eventos...</p>
                    </div>
                  ) : (
                    realtimeEvents.map((event) => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            event.event === 'INSERT' ? 'bg-green-100 text-green-800' :
                            event.event === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.event}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <strong>{event.data?.title || 'Sem título'}</strong>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          {event.data?.message || 'Sem mensagem'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Lista de Notificações Recentes */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notificações Recentes</h3>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={refreshNotifications}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Marcar Todas como Lidas
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        notification.status === 'unread'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{NotificationIcons[notification.type]}</span>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {notification.status === 'unread' && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação encontrada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'bell' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Componente NotificationBell</h2>
            <p className="text-gray-600 mb-6">Demonstração do componente sino de notificações:</p>
            
            <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
              <div className="scale-150">
                <NotificationBell userId={userId} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'center' && (
          <NotificationCenter userId={userId} />
        )}
        
        {activeTab === 'preferences' && (
          <NotificationPreferences userId={userId} />
        )}
      </div>
      
      {/* Mensagens de Erro */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTester;