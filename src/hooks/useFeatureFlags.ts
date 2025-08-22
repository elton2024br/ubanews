import { useState, useEffect, useCallback } from 'react';
import { featureFlags, FeatureFlags, isFeatureEnabled } from '../lib/featureFlags';

/**
 * Hook para usar feature flags de forma reativa
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flag: K
): [FeatureFlags[K], (value: FeatureFlags[K]) => void] {
  const [value, setValue] = useState<FeatureFlags[K]>(() => featureFlags.getFlag(flag));

  useEffect(() => {
    // Listener para mudanças na flag
    const unsubscribe = featureFlags.addListener(flag, (newValue) => {
      setValue(newValue as FeatureFlags[K]);
    });

    return unsubscribe;
  }, [flag]);

  const setFlag = useCallback((newValue: FeatureFlags[K]) => {
    featureFlags.setFlag(flag, newValue);
  }, [flag]);

  return [value, setFlag];
}

/**
 * Hook para verificar se uma feature está habilitada
 */
export function useIsFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const [enabled] = useFeatureFlag(flag);
  return enabled as boolean;
}

/**
 * Hook para controlar dados dinâmicos
 */
export function useDynamicData() {
  const [useDynamic, setUseDynamic] = useFeatureFlag('USE_DYNAMIC_DATA');
  const [useRealTime, setUseRealTime] = useFeatureFlag('ENABLE_REAL_TIME_SYNC');

  const enableDynamicData = useCallback(() => {
    featureFlags.enableDynamicData();
  }, []);

  const disableDynamicData = useCallback(() => {
    featureFlags.disableDynamicData();
  }, []);

  const toggleDynamicData = useCallback(() => {
    if (useDynamic) {
      disableDynamicData();
    } else {
      enableDynamicData();
    }
  }, [useDynamic, enableDynamicData, disableDynamicData]);

  return {
    useDynamic: useDynamic as boolean,
    useRealTime: useRealTime as boolean,
    enableDynamicData,
    disableDynamicData,
    toggleDynamicData,
    setUseDynamic,
    setUseRealTime,
  };
}

/**
 * Hook para gerenciar todas as feature flags
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(() => featureFlags.getAllFlags());

  useEffect(() => {
    // Listener para mudanças em qualquer flag
    const listeners: (() => void)[] = [];
    
    Object.keys(flags).forEach((flagKey) => {
      const key = flagKey as keyof FeatureFlags;
      const unsubscribe = featureFlags.addListener(key, () => {
        setFlags(featureFlags.getAllFlags());
      });
      listeners.push(unsubscribe);
    });

    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const updateFlag = useCallback(<K extends keyof FeatureFlags>(
    flag: K,
    value: FeatureFlags[K]
  ) => {
    featureFlags.setFlag(flag, value);
  }, []);

  const toggleFlag = useCallback((flag: keyof FeatureFlags) => {
    featureFlags.toggleFlag(flag);
  }, []);

  const resetToDefaults = useCallback(() => {
    featureFlags.resetToDefaults();
  }, []);

  const getEnvironmentConfig = useCallback(() => {
    return featureFlags.getEnvironmentConfig();
  }, []);

  return {
    flags,
    updateFlag,
    toggleFlag,
    resetToDefaults,
    getEnvironmentConfig,
    isEnabled: (flag: keyof FeatureFlags) => flags[flag] as boolean,
  };
}

/**
 * Hook para migração progressiva com fallback automático
 */
export function useProgressiveMigration() {
  const { useDynamic, enableDynamicData, disableDynamicData } = useDynamicData();
  const [migrationStatus, setMigrationStatus] = useState<{
    phase: 'static' | 'hybrid' | 'dynamic';
    progress: number;
    errors: string[];
  }>(() => ({
    phase: useDynamic ? 'dynamic' : 'static',
    progress: useDynamic ? 100 : 0,
    errors: [],
  }));

  const startMigration = useCallback(async () => {
    try {
      setMigrationStatus(prev => ({
        ...prev,
        phase: 'hybrid',
        progress: 25,
        errors: [],
      }));

      // Simula verificações de pré-requisitos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMigrationStatus(prev => ({
        ...prev,
        progress: 50,
      }));

      // Habilita dados dinâmicos
      enableDynamicData();
      
      setMigrationStatus(prev => ({
        ...prev,
        progress: 75,
      }));

      // Finaliza migração
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMigrationStatus(prev => ({
        ...prev,
        phase: 'dynamic',
        progress: 100,
      }));

      console.log('✅ Migração para dados dinâmicos concluída');
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      setMigrationStatus(prev => ({
        ...prev,
        phase: 'static',
        progress: 0,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Erro desconhecido'],
      }));
      disableDynamicData();
    }
  }, [enableDynamicData, disableDynamicData]);

  const rollbackMigration = useCallback(() => {
    disableDynamicData();
    setMigrationStatus({
      phase: 'static',
      progress: 0,
      errors: [],
    });
    console.log('⚠️ Rollback para dados estáticos realizado');
  }, [disableDynamicData]);

  return {
    migrationStatus,
    startMigration,
    rollbackMigration,
    canMigrate: !useDynamic,
    canRollback: useDynamic,
  };
}

/**
 * Hook para monitoramento de performance da migração
 */
export function useMigrationMetrics() {
  const { useDynamic } = useDynamicData();
  const [metrics, setMetrics] = useState({
    dataSource: useDynamic ? 'dynamic' : 'static',
    loadTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    lastUpdated: new Date(),
  });

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(prev => ({
        ...prev,
        dataSource: useDynamic ? 'dynamic' : 'static',
        lastUpdated: new Date(),
      }));
    };

    updateMetrics();
  }, [useDynamic]);

  const recordLoadTime = useCallback((time: number) => {
    setMetrics(prev => ({
      ...prev,
      loadTime: time,
      lastUpdated: new Date(),
    }));
  }, []);

  const recordError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorRate: prev.errorRate + 1,
      lastUpdated: new Date(),
    }));
  }, []);

  const recordCacheHit = useCallback((hit: boolean) => {
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: hit ? prev.cacheHitRate + 1 : prev.cacheHitRate,
      lastUpdated: new Date(),
    }));
  }, []);

  return {
    metrics,
    recordLoadTime,
    recordError,
    recordCacheHit,
  };
}