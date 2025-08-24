/**
 * Sistema de Feature Flags para controle de migração progressiva
 * Permite alternar entre dados estáticos e dinâmicos de forma controlada
 */

export interface FeatureFlags {
  USE_DYNAMIC_DATA: boolean;
  ENABLE_REAL_TIME_SYNC: boolean;
  ENABLE_ADVANCED_CACHE: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_ANALYTICS: boolean;
}

// Configuração padrão das feature flags
const DEFAULT_FLAGS: FeatureFlags = {
  USE_DYNAMIC_DATA: false, // Inicia com dados estáticos
  ENABLE_REAL_TIME_SYNC: false,
  ENABLE_ADVANCED_CACHE: true,
  ENABLE_ERROR_REPORTING: true,
  ENABLE_ANALYTICS: false,
};

// Chave para localStorage
const FEATURE_FLAGS_KEY = 'ubanews_feature_flags';

/**
 * Classe para gerenciamento de feature flags
 */
class FeatureFlagManager {
  private flags: FeatureFlags;
  private listeners: Map<keyof FeatureFlags, Set<(value: boolean) => void>> = new Map();

  constructor() {
    this.flags = this.loadFlags();
  }

  /**
   * Carrega flags do localStorage ou usa padrão
   */
  private loadFlags(): FeatureFlags {
    try {
      const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_FLAGS, ...parsed };
      }
    } catch (error) {
      console.warn('Erro ao carregar feature flags:', error);
    }
    return { ...DEFAULT_FLAGS };
  }

  /**
   * Salva flags no localStorage
   */
  private saveFlags(): void {
    try {
      localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Erro ao salvar feature flags:', error);
    }
  }

  /**
   * Obtém o valor de uma feature flag
   */
  getFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
    return this.flags[flag];
  }

  /**
   * Define o valor de uma feature flag
   */
  setFlag<K extends keyof FeatureFlags>(flag: K, value: FeatureFlags[K]): void {
    const oldValue = this.flags[flag];
    this.flags[flag] = value;
    this.saveFlags();

    // Notifica listeners se o valor mudou
    if (oldValue !== value) {
      this.notifyListeners(flag, value);
    }
  }

  /**
   * Alterna o valor de uma feature flag booleana
   */
  toggleFlag(flag: keyof FeatureFlags): void {
    const currentValue = this.flags[flag];
    if (typeof currentValue === 'boolean') {
      this.setFlag(flag, !currentValue);
    }
  }

  /**
   * Obtém todas as flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Reseta todas as flags para o padrão
   */
  resetToDefaults(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveFlags();
    
    // Notifica todos os listeners
    Object.entries(this.flags).forEach(([flag, value]) => {
      this.notifyListeners(flag as keyof FeatureFlags, value);
    });
  }

  /**
   * Adiciona listener para mudanças em uma flag
   */
  addListener<K extends keyof FeatureFlags>(
    flag: K,
    callback: (value: FeatureFlags[K]) => void
  ): () => void {
    if (!this.listeners.has(flag)) {
      this.listeners.set(flag, new Set());
    }
    
    const flagListeners = this.listeners.get(flag)!;
    flagListeners.add(callback as (value: boolean) => void);

    // Retorna função para remover o listener
    return () => {
      flagListeners.delete(callback as (value: boolean) => void);
    };
  }

  /**
   * Notifica listeners sobre mudança em uma flag
   */
  private notifyListeners<K extends keyof FeatureFlags>(
    flag: K,
    value: FeatureFlags[K]
  ): void {
    const flagListeners = this.listeners.get(flag);
    if (flagListeners) {
      flagListeners.forEach(callback => {
        try {
          callback(value as boolean);
        } catch (error) {
          console.error(`Erro ao notificar listener para ${String(flag)}:`, error);
        }
      });
    }
  }

  /**
   * Habilita migração progressiva (ativa dados dinâmicos)
   */
  enableDynamicData(): void {
    this.setFlag('USE_DYNAMIC_DATA', true);
    this.setFlag('ENABLE_REAL_TIME_SYNC', true);
    console.log('✅ Dados dinâmicos habilitados');
  }

  /**
   * Desabilita migração progressiva (volta para dados estáticos)
   */
  disableDynamicData(): void {
    this.setFlag('USE_DYNAMIC_DATA', false);
    this.setFlag('ENABLE_REAL_TIME_SYNC', false);
    console.log('⚠️ Dados dinâmicos desabilitados - usando fallback estático');
  }

  /**
   * Verifica se está em modo de desenvolvimento
   */
  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  /**
   * Obtém configuração de ambiente
   */
  getEnvironmentConfig(): {
    isDev: boolean;
    isProduction: boolean;
    canUseDynamicData: boolean;
  } {
    const isDev = this.isDevelopment();
    const isProduction = import.meta.env.PROD;
    const canUseDynamicData = this.getFlag('USE_DYNAMIC_DATA');

    return {
      isDev,
      isProduction,
      canUseDynamicData,
    };
  }
}

// Instância singleton
export const featureFlags = new FeatureFlagManager();

// Helpers para uso direto
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags.getFlag(flag) as boolean;
};

export const useDynamicData = (): boolean => {
  return featureFlags.getFlag('USE_DYNAMIC_DATA');
};

export const useRealTimeSync = (): boolean => {
  return featureFlags.getFlag('ENABLE_REAL_TIME_SYNC');
};

export const useAdvancedCache = (): boolean => {
  return featureFlags.getFlag('ENABLE_ADVANCED_CACHE');
};

// Expor para debug no console (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  (window as Window & { featureFlags: FeatureFlagManager }).featureFlags = featureFlags;
  console.log('🚀 Feature Flags disponíveis no console: window.featureFlags');
}