import React from 'react';
import { Settings, Database, Zap, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDynamicData, useProgressiveMigration, useMigrationMetrics, useFeatureFlags } from '../../hooks/useFeatureFlags';
import newsService from '../../services/newsService';

/**
 * Componente para controle da migração progressiva
 * Permite alternar entre dados estáticos e dinâmicos
 */
export function MigrationControl() {
  const {
    useDynamic,
    useRealTime,
    enableDynamicData,
    disableDynamicData,
    toggleDynamicData,
  } = useDynamicData();

  const {
    migrationStatus,
    startMigration,
    rollbackMigration,
    canMigrate,
    canRollback,
  } = useProgressiveMigration();

  const { metrics } = useMigrationMetrics();
  const { flags, toggleFlag, resetToDefaults } = useFeatureFlags();

  const handleMigration = async () => {
    if (canMigrate) {
      await startMigration();
      // Notifica o serviço sobre a mudança
      NewsService.onFeatureFlagChange();
    }
  };

  const handleRollback = () => {
    if (canRollback) {
      rollbackMigration();
      NewsService.onFeatureFlagChange();
    }
  };

  const getStatusColor = (phase: string) => {
    switch (phase) {
      case 'static': return 'text-gray-600';
      case 'hybrid': return 'text-yellow-600';
      case 'dynamic': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (phase: string) => {
    switch (phase) {
      case 'static': return <Database className="w-5 h-5" />;
      case 'hybrid': return <AlertTriangle className="w-5 h-5" />;
      case 'dynamic': return <CheckCircle className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Controle de Migração
        </h2>
      </div>

      {/* Status Atual */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Status Atual</h3>
          <div className={`flex items-center gap-2 ${getStatusColor(migrationStatus.phase)}`}>
            {getStatusIcon(migrationStatus.phase)}
            <span className="font-medium capitalize">
              {migrationStatus.phase === 'static' && 'Dados Estáticos'}
              {migrationStatus.phase === 'hybrid' && 'Migração em Andamento'}
              {migrationStatus.phase === 'dynamic' && 'Dados Dinâmicos'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${migrationStatus.progress}%` }}
          />
        </div>

        <div className="text-sm text-gray-600">
          Progresso: {migrationStatus.progress}%
        </div>

        {/* Erros */}
        {migrationStatus.errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Erros na Migração</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {migrationStatus.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Controles de Migração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleMigration}
          disabled={!canMigrate || migrationStatus.phase === 'hybrid'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Zap className="w-4 h-4" />
          Iniciar Migração
        </button>

        <button
          onClick={handleRollback}
          disabled={!canRollback || migrationStatus.phase === 'hybrid'}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Database className="w-4 h-4" />
          Rollback
        </button>
      </div>

      {/* Métricas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Métricas</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Fonte de Dados</div>
            <div className="font-medium capitalize">
              {metrics.dataSource === 'dynamic' ? 'Dinâmica' : 'Estática'}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Tempo de Carga</div>
            <div className="font-medium">{metrics.loadTime}ms</div>
          </div>
          <div>
            <div className="text-gray-600">Taxa de Erro</div>
            <div className="font-medium">{metrics.errorRate}</div>
          </div>
          <div>
            <div className="text-gray-600">Cache Hit Rate</div>
            <div className="font-medium">{metrics.cacheHitRate}%</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Última atualização: {metrics.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Feature Flags</h3>
        
        <div className="space-y-3">
          {Object.entries(flags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <button
                onClick={() => toggleFlag(key as keyof typeof flags)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={resetToDefaults}
          className="mt-4 w-full px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Resetar para Padrão
        </button>
      </div>

      {/* Informações de Debug */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Modo: {import.meta.env.MODE}</div>
            <div>Dynamic Data: {useDynamic ? 'Ativo' : 'Inativo'}</div>
            <div>Real Time: {useRealTime ? 'Ativo' : 'Inativo'}</div>
            <div>Console: window.featureFlags disponível</div>
          </div>
        </div>
      )}
    </div>
  );
}