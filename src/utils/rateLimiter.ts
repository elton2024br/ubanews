import { toast } from 'sonner';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RequestRecord>();
  private configs = new Map<string, RateLimitConfig>();

  constructor() {
    // Configurações padrão para diferentes tipos de endpoints
    this.setConfig('auth', { maxRequests: 5, windowMs: 15 * 60 * 1000 }); // 5 tentativas por 15 min
    this.setConfig('search', { maxRequests: 30, windowMs: 60 * 1000 }); // 30 buscas por minuto
    this.setConfig('news', { maxRequests: 100, windowMs: 60 * 1000 }); // 100 requisições por minuto
    this.setConfig('comments', { maxRequests: 10, windowMs: 60 * 1000 }); // 10 comentários por minuto
    this.setConfig('upload', { maxRequests: 5, windowMs: 60 * 1000 }); // 5 uploads por minuto
    this.setConfig('newsletter', { maxRequests: 3, windowMs: 60 * 1000 }); // 3 inscrições por minuto
    this.setConfig('contact', { maxRequests: 2, windowMs: 60 * 1000 }); // 2 contatos por minuto
    this.setConfig('default', { maxRequests: 60, windowMs: 60 * 1000 }); // Padrão: 60 por minuto
  }

  setConfig(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  private getClientId(): string {
    // Usar uma combinação de fatores para identificar o cliente
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Criar um hash simples baseado nos dados do cliente
    let hash = 0;
    const str = `${userAgent}-${language}-${timezone}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `client_${Math.abs(hash)}`;
  }

  private getKey(endpoint: string, clientId?: string): string {
    const id = clientId || this.getClientId();
    return `${id}:${endpoint}`;
  }

  private cleanupExpiredRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  checkLimit(endpoint: string, clientId?: string): boolean {
    this.cleanupExpiredRecords();
    
    const key = this.getKey(endpoint, clientId);
    const config = this.configs.get(endpoint) || this.configs.get('default')!;
    const now = Date.now();
    
    let record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      // Criar novo registro ou resetar expirado
      record = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.requests.set(key, record);
      return true;
    }
    
    if (record.count >= config.maxRequests) {
      // Limite excedido
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      const message = config.message || 
        `Muitas tentativas. Tente novamente em ${remainingTime} segundos.`;
      
      toast.error(message);
      return false;
    }
    
    // Incrementar contador
    record.count++;
    this.requests.set(key, record);
    return true;
  }

  getRemainingRequests(endpoint: string, clientId?: string): number {
    const key = this.getKey(endpoint, clientId);
    const config = this.configs.get(endpoint) || this.configs.get('default')!;
    const record = this.requests.get(key);
    
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - record.count);
  }

  getResetTime(endpoint: string, clientId?: string): number {
    const key = this.getKey(endpoint, clientId);
    const record = this.requests.get(key);
    
    if (!record || Date.now() > record.resetTime) {
      return 0;
    }
    
    return record.resetTime;
  }

  reset(endpoint?: string, clientId?: string): void {
    if (endpoint) {
      const key = this.getKey(endpoint, clientId);
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  getStats(): { totalEndpoints: number; activeRequests: number } {
    this.cleanupExpiredRecords();
    return {
      totalEndpoints: this.configs.size,
      activeRequests: this.requests.size
    };
  }
}

// Instância singleton do rate limiter
export const rateLimiter = new RateLimiter();

// Hook para usar rate limiting em componentes React
export const useRateLimit = (endpoint: string) => {
  const checkLimit = (clientId?: string) => {
    return rateLimiter.checkLimit(endpoint, clientId);
  };

  const getRemainingRequests = (clientId?: string) => {
    return rateLimiter.getRemainingRequests(endpoint, clientId);
  };

  const getResetTime = (clientId?: string) => {
    return rateLimiter.getResetTime(endpoint, clientId);
  };

  return {
    checkLimit,
    getRemainingRequests,
    getResetTime,
    reset: () => rateLimiter.reset(endpoint)
  };
};

// Decorator para funções que fazem requisições
export const withRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  endpoint: string
): T => {
  return (async (...args: Parameters<T>) => {
    if (!rateLimiter.checkLimit(endpoint)) {
      throw new Error('Rate limit exceeded');
    }
    
    try {
      return await fn(...args);
    } catch (error) {
      // Se a requisição falhar, não contar contra o rate limit
      // (opcional, dependendo da estratégia desejada)
      throw error;
    }
  }) as T;
};

// Middleware para interceptar requisições do Supabase
export const createRateLimitedSupabaseClient = (supabase: any) => {
  const originalFrom = supabase.from.bind(supabase);
  const originalRpc = supabase.rpc.bind(supabase);
  const originalAuth = supabase.auth;

  // Interceptar chamadas para tabelas
  supabase.from = (table: string) => {
    const tableClient = originalFrom(table);
    const originalSelect = tableClient.select.bind(tableClient);
    const originalInsert = tableClient.insert.bind(tableClient);
    const originalUpdate = tableClient.update.bind(tableClient);
    const originalDelete = tableClient.delete.bind(tableClient);

    tableClient.select = (...args: any[]) => {
      if (!rateLimiter.checkLimit('news')) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      return originalSelect(...args);
    };

    tableClient.insert = (...args: any[]) => {
      if (!rateLimiter.checkLimit('news')) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      return originalInsert(...args);
    };

    tableClient.update = (...args: any[]) => {
      if (!rateLimiter.checkLimit('news')) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      return originalUpdate(...args);
    };

    tableClient.delete = (...args: any[]) => {
      if (!rateLimiter.checkLimit('news')) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }
      return originalDelete(...args);
    };

    return tableClient;
  };

  // Interceptar RPC calls
  supabase.rpc = (fn: string, ...args: any[]) => {
    const endpoint = fn.includes('search') ? 'search' : 'default';
    if (!rateLimiter.checkLimit(endpoint)) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    return originalRpc(fn, ...args);
  };

  // Interceptar auth calls
  const originalSignIn = originalAuth.signInWithPassword.bind(originalAuth);
  const originalSignUp = originalAuth.signUp.bind(originalAuth);
  const originalSignOut = originalAuth.signOut.bind(originalAuth);

  supabase.auth.signInWithPassword = (...args: any[]) => {
    if (!rateLimiter.checkLimit('auth')) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    return originalSignIn(...args);
  };

  supabase.auth.signUp = (...args: any[]) => {
    if (!rateLimiter.checkLimit('auth')) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    return originalSignUp(...args);
  };

  supabase.auth.signOut = (...args: any[]) => {
    if (!rateLimiter.checkLimit('auth')) {
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    return originalSignOut(...args);
  };

  return supabase;
};

export default rateLimiter;