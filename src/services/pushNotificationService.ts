// Serviço de Push Notifications
// Gerencia registro, permissões e envio de push notifications

import { supabase } from '../lib/supabase';
import {
  PushNotificationConfig,
  PushNotificationPayload,
  PushNotificationAction,
  NotificationType
} from '../types/notifications';

/**
 * Configuração padrão para push notifications
 */
const DEFAULT_CONFIG: PushNotificationConfig = {
  enabled: true,
  sound: true,
  vibration: true,
  showPreview: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
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
  }
};

/**
 * Chave pública VAPID para push notifications
 * Em produção, esta chave deve vir de variáveis de ambiente
 */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI2BN4XYqDLoLXgkNsiS3UjOVFJmYUbvQAEt4YEBnDLfVeqTBhHHpau2-c';

/**
 * Classe principal do serviço de push notifications
 */
class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private config: PushNotificationConfig = DEFAULT_CONFIG;
  private userId: string | null = null;

  /**
   * Inicializa o serviço de push notifications
   */
  async initialize(userId?: string): Promise<boolean> {
    try {
      console.log('[Push] Initializing push notification service...');
      
      this.userId = userId || null;
      
      // Verifica suporte a service workers
      if (!('serviceWorker' in navigator)) {
        console.warn('[Push] Service Workers not supported');
        return false;
      }
      
      // Verifica suporte a push notifications
      if (!('PushManager' in window)) {
        console.warn('[Push] Push messaging not supported');
        return false;
      }
      
      // Registra o service worker
      await this.registerServiceWorker();
      
      // Carrega configurações do usuário
      await this.loadUserConfig();
      
      // Verifica permissões existentes
      await this.checkPermissions();
      
      console.log('[Push] Push notification service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('[Push] Error initializing push service:', error);
      return false;
    }
  }
  
  /**
   * Registra o service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[Push] Service Worker registered:', this.registration.scope);
      
      // Aguarda o service worker estar ativo
      if (this.registration.installing) {
        await new Promise<void>((resolve) => {
          this.registration!.installing!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve();
            }
          });
        });
      }
      
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Carrega configurações do usuário
   */
  private async loadUserConfig(): Promise<void> {
    if (!this.userId) {
      console.log('[Push] No user ID, using default config');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('push_config')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        console.warn('[Push] Error loading user config:', error.message);
        return;
      }
      
      if (data?.push_config) {
        this.config = { ...DEFAULT_CONFIG, ...data.push_config };
        console.log('[Push] User config loaded:', this.config);
      }
      
    } catch (error) {
      console.error('[Push] Error loading user config:', error);
    }
  }
  
  /**
   * Verifica permissões atuais
   */
  private async checkPermissions(): Promise<void> {
    const permission = Notification.permission;
    console.log('[Push] Current permission:', permission);
    
    if (permission === 'granted' && this.registration) {
      await this.getExistingSubscription();
    }
  }
  
  /**
   * Busca subscription existente
   */
  private async getExistingSubscription(): Promise<void> {
    if (!this.registration) return;
    
    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('[Push] Existing subscription found');
        await this.syncSubscriptionWithServer();
      }
      
    } catch (error) {
      console.error('[Push] Error getting existing subscription:', error);
    }
  }
  
  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log('[Push] Requesting notification permission...');
      
      const permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    }
  }
  
  /**
   * Cria subscription para push notifications
   */
  async subscribe(): Promise<boolean> {
    if (!this.registration) {
      console.error('[Push] Service Worker not registered');
      return false;
    }
    
    try {
      console.log('[Push] Creating push subscription...');
      
      // Converte a chave VAPID para Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('[Push] Push subscription created:', this.subscription);
      
      // Sincroniza com o servidor
      await this.syncSubscriptionWithServer();
      
      return true;
      
    } catch (error) {
      console.error('[Push] Error creating subscription:', error);
      return false;
    }
  }
  
  /**
   * Remove subscription
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('[Push] No active subscription to remove');
      return true;
    }
    
    try {
      console.log('[Push] Removing push subscription...');
      
      // Remove do servidor
      await this.removeSubscriptionFromServer();
      
      // Remove localmente
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        this.subscription = null;
        console.log('[Push] Push subscription removed successfully');
      }
      
      return success;
      
    } catch (error) {
      console.error('[Push] Error removing subscription:', error);
      return false;
    }
  }
  
  /**
   * Sincroniza subscription com o servidor
   */
  private async syncSubscriptionWithServer(): Promise<void> {
    if (!this.subscription || !this.userId) {
      console.log('[Push] No subscription or user ID for sync');
      return;
    }
    
    try {
      const subscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!)
        }
      };
      
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: this.userId,
          push_subscription: subscriptionData,
          push_enabled: true,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('[Push] Error syncing subscription:', error);
      } else {
        console.log('[Push] Subscription synced with server');
      }
      
    } catch (error) {
      console.error('[Push] Error syncing subscription:', error);
    }
  }
  
  /**
   * Remove subscription do servidor
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          push_subscription: null,
          push_enabled: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('[Push] Error removing subscription from server:', error);
      } else {
        console.log('[Push] Subscription removed from server');
      }
      
    } catch (error) {
      console.error('[Push] Error removing subscription from server:', error);
    }
  }
  
  /**
   * Atualiza configurações de push
   */
  async updateConfig(newConfig: Partial<PushNotificationConfig>): Promise<boolean> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      if (this.userId) {
        const { error } = await supabase
          .from('notification_preferences')
          .upsert({
            user_id: this.userId,
            push_config: this.config,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('[Push] Error updating config:', error);
          return false;
        }
      }
      
      console.log('[Push] Config updated:', this.config);
      return true;
      
    } catch (error) {
      console.error('[Push] Error updating config:', error);
      return false;
    }
  }
  
  /**
   * Envia notificação de teste
   */
  async sendTestNotification(): Promise<boolean> {
    if (!this.subscription) {
      console.error('[Push] No active subscription for test');
      return false;
    }
    
    try {
      const testPayload: PushNotificationPayload = {
        title: 'UbaNews - Teste',
        body: 'Esta é uma notificação de teste do sistema UbaNews!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          type: 'system_update',
          url: '/',
          timestamp: Date.now()
        }
      };
      
      // Em um ambiente real, isso seria enviado pelo servidor
      // Aqui simulamos com uma notificação local
      if ('serviceWorker' in navigator && this.registration) {
        await this.registration.showNotification(testPayload.title, {
          body: testPayload.body,
          icon: testPayload.icon,
          badge: testPayload.badge,
          data: testPayload.data,
          tag: 'test-notification',
          requireInteraction: false
        });
      }
      
      console.log('[Push] Test notification sent');
      return true;
      
    } catch (error) {
      console.error('[Push] Error sending test notification:', error);
      return false;
    }
  }
  
  /**
   * Verifica se está em horário silencioso
   */
  isQuietHours(): boolean {
    if (!this.config.quietHours.enabled) {
      return false;
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.config.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.config.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
  
  /**
   * Verifica se um tipo de notificação está habilitado
   */
  isTypeEnabled(type: NotificationType): boolean {
    return this.config.enabled && this.config.types[type];
  }
  
  /**
   * Obtém status atual do serviço
   */
  getStatus() {
    return {
      supported: 'serviceWorker' in navigator && 'PushManager' in window,
      permission: Notification.permission,
      registered: !!this.registration,
      subscribed: !!this.subscription,
      enabled: this.config.enabled,
      quietHours: this.isQuietHours(),
      config: this.config
    };
  }
  
  /**
   * Utilitários
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }
}

// Instância singleton do serviço
export const pushNotificationService = new PushNotificationService();

// Funções de conveniência
export const initializePushNotifications = (userId?: string) => {
  return pushNotificationService.initialize(userId);
};

export const requestNotificationPermission = () => {
  return pushNotificationService.requestPermission();
};

export const subscribeToPushNotifications = () => {
  return pushNotificationService.subscribe();
};

export const unsubscribeFromPushNotifications = () => {
  return pushNotificationService.unsubscribe();
};

export const updatePushConfig = (config: Partial<PushNotificationConfig>) => {
  return pushNotificationService.updateConfig(config);
};

export const sendTestPushNotification = () => {
  return pushNotificationService.sendTestNotification();
};

export const getPushNotificationStatus = () => {
  return pushNotificationService.getStatus();
};

export default pushNotificationService;