// Service Worker para UbaNews - Cache Estratégico
const CACHE_NAME = 'ubanews-v1';
const STATIC_CACHE = 'ubanews-static-v1';
const DYNAMIC_CACHE = 'ubanews-dynamic-v1';
const IMAGE_CACHE = 'ubanews-images-v1';

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // CSS e JS principais serão adicionados automaticamente pelo Vite
];

// Recursos para cache em runtime
const RUNTIME_CACHE_PATTERNS = [
  // API endpoints
  /\/api\//,
  // Imagens
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/,
  // Fontes
  /\.(woff|woff2|ttf|eot)$/,
  // CSS e JS
  /\.(css|js)$/
];

// Configurações de cache por tipo
const CACHE_STRATEGIES = {
  // Cache First para recursos estáticos
  static: {
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 100
  },
  // Network First para conteúdo dinâmico
  dynamic: {
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    maxEntries: 50
  },
  // Cache First para imagens com fallback
  images: {
    cacheName: IMAGE_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 200
  }
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Critical resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache critical resources:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return ![
                STATIC_CACHE,
                DYNAMIC_CACHE,
                IMAGE_CACHE
              ].includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia baseada no tipo de recurso
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticResource(request)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Verificar se é requisição de imagem
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(request.url);
}

// Verificar se é recurso estático
function isStaticResource(request) {
  return request.destination === 'style' ||
         request.destination === 'script' ||
         request.destination === 'font' ||
         /\.(css|js|woff|woff2|ttf|eot)$/i.test(request.url);
}

// Verificar se é requisição de API
function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('api.');
}

// Cache First para imagens
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Verificar se não expirou
      const dateHeader = cachedResponse.headers.get('date');
      if (dateHeader) {
        const cachedDate = new Date(dateHeader);
        const now = new Date();
        if (now - cachedDate < CACHE_STRATEGIES.images.maxAge) {
          return cachedResponse;
        }
      }
    }
    
    // Buscar da rede
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clonar para cache
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      // Limpar cache se necessário
      await cleanupCache(IMAGE_CACHE, CACHE_STRATEGIES.images.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image request failed:', error);
    
    // Tentar cache como fallback
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar imagem placeholder
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="200" y="150" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="16">Imagem não disponível</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Cache First para recursos estáticos
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(STATIC_CACHE, CACHE_STRATEGIES.static.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    
    const cache = await caches.open(STATIC_CACHE);
    return await cache.match(request) || new Response('Recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First para APIs
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request, {
      timeout: 5000 // 5 segundos timeout
    });
    
    if (networkResponse.ok) {
      // Cache apenas GET requests
      if (request.method === 'GET') {
        const cache = await caches.open(DYNAMIC_CACHE);
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        await cleanupCache(DYNAMIC_CACHE, CACHE_STRATEGIES.dynamic.maxEntries);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // Fallback para cache apenas em GET requests
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return new Response(
      JSON.stringify({
        error: 'Sem conexão com a internet',
        message: 'Verifique sua conexão e tente novamente',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Network First para conteúdo dinâmico
async function handleDynamicRequest(request) {
  try {
    // Verificar se a URL é válida antes de fazer fetch
    const url = new URL(request.url);
    
    // Evitar fetch de recursos que sabemos que não existem
    if (url.pathname.includes('logo-ubatuba.webp')) {
      throw new Error('Resource not found: logo-ubatuba.webp');
    }
    
    const networkResponse = await fetch(request, {
      cache: 'no-cache',
      mode: 'cors'
    });
    
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(DYNAMIC_CACHE, CACHE_STRATEGIES.dynamic.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Dynamic request failed:', error);
    
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Página offline para navegação
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>UbaNews - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
            .retry { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>UbaNews</h1>
          <div class="offline">
            <h2>Você está offline</h2>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button class="retry" onclick="window.location.reload()">Tentar Novamente</button>
          </div>
        </body>
        </html>`,
        {
          headers: {
            'Content-Type': 'text/html'
          }
        }
      );
    }
    
    return new Response('Sem conexão', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Limpeza de cache por limite de entradas
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', payload: size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Obter tamanho do cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

// Limpar todos os caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Executar sincronização em background
async function doBackgroundSync() {
  try {
    // Sincronizar dados pendentes
    console.log('[SW] Background sync executed');
    
    // Aqui você pode implementar lógica para:
    // - Enviar dados pendentes
    // - Atualizar cache com novos conteúdos
    // - Limpar dados expirados
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');