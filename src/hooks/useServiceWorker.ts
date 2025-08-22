import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  hasUpdate: boolean;
  error: string | null;
  cacheSize: number;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  update: () => Promise<void>;
  unregister: () => Promise<void>;
  skipWaiting: () => void;
  getCacheSize: () => Promise<number>;
  clearCache: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

type ServiceWorkerHook = ServiceWorkerState & ServiceWorkerActions;

const SW_PATH = '/sw.js';
const SW_SCOPE = '/';

export const useServiceWorker = (): ServiceWorkerHook => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    hasUpdate: false,
    error: null,
    cacheSize: 0
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const hasRegistered = useRef(false);

  // Configurar listeners do service worker
  const setupServiceWorkerListeners = useCallback((reg: ServiceWorkerRegistration) => {
    // Listener para instalação
    if (reg.installing) {
      reg.installing.addEventListener('statechange', (event) => {
        const sw = event.target as ServiceWorker;
        if (sw.state === 'installed') {
          setState(prev => ({
            ...prev,
            isInstalling: false,
            isWaiting: !navigator.serviceWorker.controller
          }));
        }
      });
    }

    // Listener para atualizações
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        setState(prev => ({ ...prev, hasUpdate: true, isInstalling: true }));
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setState(prev => ({
              ...prev,
              hasUpdate: true,
              isInstalling: false,
              isWaiting: true
            }));
          }
        });
      }
    });

    // Listener para controle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setState(prev => ({ ...prev, isControlling: true, hasUpdate: false }));
      window.location.reload();
    });
  }, []);

  // Atualizar service worker
  const update = useCallback(async () => {
    if (!registration) {
      console.warn('[SW Hook] No registration found for update');
      return;
    }

    try {
      await registration.update();
      console.log('[SW Hook] Service Worker update check completed');
    } catch (error) {
      console.error('[SW Hook] Service Worker update failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro na atualização'
      }));
    }
  }, [registration]);

  // Desregistrar service worker
  const unregister = useCallback(async () => {
    if (!registration) {
      console.warn('[SW Hook] No registration found for unregister');
      return;
    }

    try {
      const result = await registration.unregister();
      if (result) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          isControlling: false,
          hasUpdate: false,
          error: null
        }));
        setRegistration(null);
        console.log('[SW Hook] Service Worker unregistered successfully');
      }
    } catch (error) {
      console.error('[SW Hook] Service Worker unregister failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao desregistrar'
      }));
    }
  }, [registration]);

  // Pular espera e ativar novo service worker
  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  // Obter tamanho do cache
  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!navigator.serviceWorker.controller) {
      return 0;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          const size = event.data.payload;
          setState(prev => ({ ...prev, cacheSize: size }));
          resolve(size);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Limpar cache
  const clearCache = useCallback(async () => {
    if (!navigator.serviceWorker.controller) {
      console.warn('[SW Hook] No service worker controller for cache clear');
      return;
    }

    return new Promise<void>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          setState(prev => ({ ...prev, cacheSize: 0 }));
          console.log('[SW Hook] Cache cleared successfully');
          resolve();
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Verificar atualizações
  const checkForUpdates = useCallback(async () => {
    if (registration) {
      await update();
    }
  }, [registration, update]);

  // Registrar service worker
  const register = useCallback(async () => {
    if (!state.isSupported || state.isRegistered) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isInstalling: true, error: null }));

      const reg = await navigator.serviceWorker.register(SW_PATH, {
        scope: SW_SCOPE,
        updateViaCache: 'none'
      });

      setRegistration(reg);

      // Configurar listeners
      setupServiceWorkerListeners(reg);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isInstalling: false,
        isControlling: !!navigator.serviceWorker.controller
      }));

      console.log('[SW Hook] Service Worker registered successfully');
    } catch (error) {
      console.error('[SW Hook] Service Worker registration failed:', error);
      setState(prev => ({
        ...prev,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [state.isSupported, state.isRegistered, setupServiceWorkerListeners]);

  // Efeito para registro automático
  useEffect(() => {
    if (state.isSupported && !state.isRegistered && !hasRegistered.current) {
      hasRegistered.current = true;
      register();
    }
  }, [state.isSupported, state.isRegistered, register]);

  // Efeito para verificar tamanho do cache periodicamente
  useEffect(() => {
    if (state.isControlling) {
      getCacheSize();
      
      const interval = setInterval(() => {
        getCacheSize();
      }, 60000); // A cada minuto

      return () => clearInterval(interval);
    }
  }, [state.isControlling, getCacheSize]);

  // Efeito para verificar atualizações periodicamente
  useEffect(() => {
    if (state.isRegistered) {
      const interval = setInterval(() => {
        checkForUpdates();
      }, 30 * 60 * 1000); // A cada 30 minutos

      return () => clearInterval(interval);
    }
  }, [state.isRegistered, checkForUpdates]);

  return {
    ...state,
    register,
    update,
    unregister,
    skipWaiting,
    getCacheSize,
    clearCache,
    checkForUpdates
  };
};

// Hook para status de conectividade
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar tipo de conexão se disponível
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { type?: string; effectiveType?: string; addEventListener: (event: string, handler: () => void) => void; removeEventListener: (event: string, handler: () => void) => void } }).connection;
      
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g'
  };
};

// Hook para notificações de atualização
export const useUpdateNotification = () => {
  const { hasUpdate, skipWaiting } = useServiceWorker();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (hasUpdate) {
      setShowNotification(true);
    }
  }, [hasUpdate]);

  const acceptUpdate = useCallback(() => {
    skipWaiting();
    setShowNotification(false);
  }, [skipWaiting]);

  const dismissUpdate = useCallback(() => {
    setShowNotification(false);
  }, []);

  return {
    showNotification,
    acceptUpdate,
    dismissUpdate
  };
};