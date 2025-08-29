// Service Worker para Push Notifications
// Gerencia notificações push em background e interações do usuário

const CACHE_NAME = 'ubanews-v1';
const NOTIFICATION_TAG = 'ubanews-notification';

// URLs para cache offline
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Força a ativação imediata
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assume controle de todas as abas
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições para cache offline
self.addEventListener('fetch', (event) => {
  // Só intercepta requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se disponível
        if (response) {
          return response;
        }

        // Faz a requisição e adiciona ao cache
        return fetch(event.request).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para o cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Recebimento de Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let notificationData = {
    title: 'UbaNews',
    body: 'Nova notificação disponível',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: NOTIFICATION_TAG,
    requireInteraction: false,
    silent: false,
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  // Parse dos dados da notificação se disponível
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Personalização baseada no tipo de notificação
  if (notificationData.data.type) {
    switch (notificationData.data.type) {
      case 'news_published':
        notificationData.icon = '/icons/news.png';
        notificationData.badge = '/icons/news-badge.png';
        notificationData.actions = [
          {
            action: 'view',
            title: 'Ver Notícia',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dispensar',
            icon: '/icons/dismiss.png'
          }
        ];
        break;
        
      case 'comment_new':
        notificationData.icon = '/icons/comment.png';
        notificationData.badge = '/icons/comment-badge.png';
        notificationData.actions = [
          {
            action: 'reply',
            title: 'Responder',
            icon: '/icons/reply.png'
          },
          {
            action: 'view',
            title: 'Ver Comentário',
            icon: '/icons/view.png'
          }
        ];
        break;
        
      case 'system_update':
        notificationData.icon = '/icons/system.png';
        notificationData.badge = '/icons/system-badge.png';
        notificationData.requireInteraction = true;
        break;
        
      case 'deadline_approaching':
        notificationData.icon = '/icons/warning.png';
        notificationData.badge = '/icons/warning-badge.png';
        notificationData.requireInteraction = true;
        notificationData.silent = false;
        break;
    }
  }

  // Exibe a notificação
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      actions: notificationData.actions || [],
      timestamp: notificationData.data.timestamp
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Fecha a notificação
  notification.close();
  
  // Determina a URL de destino
  let targetUrl = data.url || '/';
  
  // Ações específicas
  switch (action) {
    case 'view':
      if (data.news_id) {
        targetUrl = `/news/${data.news_id}`;
      } else if (data.comment_id) {
        targetUrl = `/comments/${data.comment_id}`;
      }
      break;
      
    case 'reply':
      if (data.comment_id) {
        targetUrl = `/comments/${data.comment_id}#reply`;
      }
      break;
      
    case 'dismiss':
      // Apenas fecha a notificação
      return;
      
    default:
      // Clique na notificação sem ação específica
      if (data.news_id) {
        targetUrl = `/news/${data.news_id}`;
      } else if (data.comment_id) {
        targetUrl = `/comments/${data.comment_id}`;
      }
      break;
  }
  
  // Abre ou foca na janela do app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Procura por uma janela já aberta com a URL
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Procura por qualquer janela do app aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'navigate' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        
        // Abre uma nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Fechamento da notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Analytics ou tracking do fechamento
  if (data.tracking_id) {
    // Enviar evento de fechamento para analytics
    fetch('/api/analytics/notification-closed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tracking_id: data.tracking_id,
        timestamp: Date.now()
      })
    }).catch(error => {
      console.error('[SW] Error tracking notification close:', error);
    });
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      syncNotifications()
    );
  }
});

// Função para sincronizar notificações
async function syncNotifications() {
  try {
    console.log('[SW] Syncing notifications...');
    
    // Busca notificações pendentes do IndexedDB ou localStorage
    const pendingNotifications = await getPendingNotifications();
    
    for (const notification of pendingNotifications) {
      try {
        // Envia notificação para o servidor
        await fetch('/api/notifications/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notification)
        });
        
        // Remove da lista de pendentes
        await removePendingNotification(notification.id);
        
      } catch (error) {
        console.error('[SW] Error syncing notification:', error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Error in sync process:', error);
  }
}

// Funções auxiliares para gerenciar notificações pendentes
async function getPendingNotifications() {
  // Implementar busca no IndexedDB ou localStorage
  return [];
}

async function removePendingNotification(id) {
  // Implementar remoção do IndexedDB ou localStorage
  console.log('[SW] Removing pending notification:', id);
}

// Mensagens do cliente (página web)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: Date.now()
      });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      // Limpa todas as notificações
      self.registration.getNotifications()
        .then(notifications => {
          notifications.forEach(notification => {
            notification.close();
          });
        });
      break;
      
    case 'UPDATE_BADGE':
      // Atualiza badge do app (se suportado)
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(payload.count || 0);
      }
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Error handling global
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');