// Componente NotificationPreferences - Configurações de notificação do usuário
// Interface para gerenciar todas as preferências de notificação

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Smartphone,
  Clock,
  Save,
  RefreshCw,
  Check,
  X,
  Info,
  TestTube
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  NotificationType,
  NotificationPreferences as NotificationPreferencesType,
  PushNotificationConfig,
  NotificationTitles,
  NotificationIcons
} from '../types/notifications';
import {
  pushNotificationService,
  requestNotificationPermission,
  sendTestPushNotification,
  getPushNotificationStatus
} from '../services/pushNotificationService';

interface NotificationPreferencesProps {
  userId: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Componente para gerenciar preferências de notificação do usuário
 */
export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onClose,
  className = ''
}) => {
  // Estados para preferências
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    user_id: userId,
    email_enabled: true,
    push_enabled: false,
    in_app_enabled: true,
    email_frequency: 'immediate',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    types: {
      news_published: true,
      news_approved: false,
      news_rejected: false,
      comment_new: true,
      comment_mention: true,
      deadline_approaching: true,
      system_update: true,
      user_action: false,
      approval_request: true
    },
    push_config: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pushStatus, setPushStatus] = useState<any>(null);
  const [testingPush, setTestingPush] = useState(false);

  // Carrega preferências do usuário
  useEffect(() => {
    loadPreferences();
    updatePushStatus();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }

    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setError('Erro ao carregar preferências: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePushStatus = () => {
    const status = getPushNotificationStatus();
    setPushStatus(status);
  };

  // Salva preferências
  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Atualiza configuração de push se habilitado
      if (preferences.push_enabled && preferences.push_config) {
        await pushNotificationService.updateConfig(preferences.push_config);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError('Erro ao salvar preferências: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Habilita push notifications
  const enablePushNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setPreferences(prev => ({
          ...prev,
          push_enabled: true,
          push_config: {
            enabled: true,
            sound: true,
            vibration: true,
            showPreview: true,
            quietHours: {
              enabled: prev.quiet_hours_enabled,
              start: prev.quiet_hours_start,
              end: prev.quiet_hours_end
            },
            types: prev.types
          }
        }));
        
        updatePushStatus();
      } else {
        setError('Permissão para notificações negada');
      }
    } catch (err: any) {
      console.error('Error enabling push notifications:', err);
      setError('Erro ao habilitar notificações push: ' + err.message);
    }
  };

  // Desabilita push notifications
  const disablePushNotifications = async () => {
    try {
      await pushNotificationService.unsubscribe();
      
      setPreferences(prev => ({
        ...prev,
        push_enabled: false,
        push_config: null
      }));
      
      updatePushStatus();
    } catch (err: any) {
      console.error('Error disabling push notifications:', err);
      setError('Erro ao desabilitar notificações push: ' + err.message);
    }
  };

  // Testa push notification
  const testPushNotification = async () => {
    try {
      setTestingPush(true);
      const success = await sendTestPushNotification();
      
      if (!success) {
        setError('Erro ao enviar notificação de teste');
      }
    } catch (err: any) {
      console.error('Error testing push notification:', err);
      setError('Erro ao testar notificação: ' + err.message);
    } finally {
      setTestingPush(false);
    }
  };

  // Atualiza tipo de notificação
  const updateNotificationType = (type: NotificationType, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: enabled
      },
      push_config: prev.push_config ? {
        ...prev.push_config,
        types: {
          ...prev.push_config.types,
          [type]: enabled
        }
      } : null
    }));
  };

  // Atualiza horário silencioso
  const updateQuietHours = (field: string, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [`quiet_hours_${field}`]: value,
      push_config: prev.push_config ? {
        ...prev.push_config,
        quietHours: {
          ...prev.push_config.quietHours,
          [field === 'enabled' ? 'enabled' : field]: value
        }
      } : null
    }));
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allNotificationTypes: NotificationType[] = [
    'news_published', 'news_approved', 'news_rejected',
    'comment_new', 'comment_mention',
    'deadline_approaching', 'system_update',
    'user_action', 'approval_request'
  ];

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Preferências de Notificação
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure como e quando você deseja receber notificações
          </p>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <X className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-700">Preferências salvas com sucesso!</span>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Configurações Gerais */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Configurações Gerais
          </h2>

          <div className="space-y-4">
            {/* Notificações no App */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notificações no App</h3>
                <p className="text-sm text-gray-600">Receber notificações dentro da aplicação</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, in_app_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notificações por Email */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                <p className="text-sm text-gray-600">Receber notificações por email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email_enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Frequência de Email */}
            {preferences.email_enabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência de Email
                </label>
                <select
                  value={preferences.email_frequency}
                  onChange={(e) => setPreferences(prev => ({ ...prev, email_frequency: e.target.value as any }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="immediate">Imediato</option>
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Push Notifications
          </h2>

          {/* Status das Push Notifications */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <button
                onClick={updatePushStatus}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Suporte do navegador:</span>
                <span className={pushStatus?.supported ? 'text-green-600' : 'text-red-600'}>
                  {pushStatus?.supported ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Permissão:</span>
                <span className={`
                  ${pushStatus?.permission === 'granted' ? 'text-green-600' : 
                    pushStatus?.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'}
                `}>
                  {pushStatus?.permission === 'granted' ? 'Concedida' :
                   pushStatus?.permission === 'denied' ? 'Negada' : 'Pendente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inscrito:</span>
                <span className={pushStatus?.subscribed ? 'text-green-600' : 'text-gray-600'}>
                  {pushStatus?.subscribed ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>

          {/* Controles de Push */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receber notificações push no navegador</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {preferences.push_enabled ? (
                  <button
                    onClick={disablePushNotifications}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <BellOff className="w-4 h-4 mr-1 inline" />
                    Desabilitar
                  </button>
                ) : (
                  <button
                    onClick={enablePushNotifications}
                    disabled={!pushStatus?.supported}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4 mr-1 inline" />
                    Habilitar
                  </button>
                )}
                
                {preferences.push_enabled && (
                  <button
                    onClick={testPushNotification}
                    disabled={testingPush}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    <TestTube className={`w-4 h-4 mr-1 inline ${testingPush ? 'animate-spin' : ''}`} />
                    Testar
                  </button>
                )}
              </div>
            </div>

            {!pushStatus?.supported && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <Info className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Push notifications não suportadas</p>
                  <p>Seu navegador não suporta push notifications ou você está acessando via HTTP.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Horário Silencioso */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Horário Silencioso
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Ativar Horário Silencioso</h3>
                <p className="text-sm text-gray-600">Não receber notificações durante determinado período</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.quiet_hours_enabled}
                  onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => updateQuietHours('start', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => updateQuietHours('end', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tipos de Notificação
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Escolha quais tipos de notificação você deseja receber
          </p>

          <div className="space-y-4">
            {allNotificationTypes.map((type) => (
              <div key={type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{NotificationIcons[type]}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{NotificationTitles[type]}</h3>
                    <p className="text-sm text-gray-600">
                      {type === 'news_published' && 'Quando uma nova notícia for publicada'}
                      {type === 'news_approved' && 'Quando sua notícia for aprovada'}
                      {type === 'news_rejected' && 'Quando sua notícia for rejeitada'}
                      {type === 'comment_new' && 'Quando alguém comentar em suas notícias'}
                      {type === 'comment_mention' && 'Quando você for mencionado em um comentário'}
                      {type === 'deadline_approaching' && 'Quando um prazo estiver se aproximando'}
                      {type === 'system_update' && 'Atualizações importantes do sistema'}
                      {type === 'user_action' && 'Ações relacionadas à sua conta'}
                      {type === 'approval_request' && 'Solicitações que precisam de aprovação'}
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.types[type]}
                    onChange={(e) => updateNotificationType(type, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={loadPreferences}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
          
          <div className="flex items-center space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            )}
            
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Salvando...' : 'Salvar Preferências'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;