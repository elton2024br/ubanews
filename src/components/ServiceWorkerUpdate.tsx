import React from 'react';
import { AlertCircle, Download, X, Wifi, WifiOff } from 'lucide-react';
import { useUpdateNotification, useNetworkStatus } from '@/hooks/useServiceWorker';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { generateAriaLabel } from '@/utils/accessibility';

// Componente de notificação de atualização
export const UpdateNotification: React.FC = () => {
  const { showNotification, acceptUpdate, dismissUpdate } = useUpdateNotification();

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert className="border-blue-200 bg-blue-50 shadow-lg animate-in slide-in-from-bottom-4">
        <Download className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-2">
              <p className="font-medium mb-1">Nova versão disponível!</p>
              <p className="text-sm opacity-90">
                Uma atualização do UbaNews está pronta para ser instalada.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={acceptUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Atualizar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={dismissUpdate}
                className="text-blue-600 hover:bg-blue-100"
                aria-label={generateAriaLabel('notificação de atualização', 'fechar')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Componente de status de conectividade
export const NetworkStatus: React.FC = () => {
  const { isOnline, isOffline, connectionType, effectiveType, isSlowConnection } = useNetworkStatus();

  // Não mostrar se estiver online com boa conexão
  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80">
      <Alert 
        className={cn(
          "shadow-lg animate-in slide-in-from-top-4",
          isOffline 
            ? "border-red-200 bg-red-50" 
            : "border-yellow-200 bg-yellow-50"
        )}
      >
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-red-600" />
        ) : (
          <Wifi className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isOffline ? (
                <>
                  <p className="font-medium text-red-800 mb-1">Você está offline</p>
                  <p className="text-sm text-red-700">
                    Algumas funcionalidades podem estar limitadas. O conteúdo em cache ainda está disponível.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-yellow-800 mb-1">Conexão lenta detectada</p>
                  <p className="text-sm text-yellow-700">
                    Usando modo econômico para melhor experiência.
                  </p>
                </>
              )}
            </div>
            <div className="ml-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isOffline 
                    ? "border-red-300 text-red-700" 
                    : "border-yellow-300 text-yellow-700"
                )}
              >
                {isOffline ? 'Offline' : effectiveType.toUpperCase()}
              </Badge>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Componente de informações de cache
interface CacheInfoProps {
  cacheSize: number;
  onClearCache: () => void;
  className?: string;
}

export const CacheInfo: React.FC<CacheInfoProps> = ({ 
  cacheSize, 
  onClearCache, 
  className 
}) => {
  const formatCacheSize = (size: number) => {
    if (size === 0) return '0 itens';
    if (size === 1) return '1 item';
    return `${size} itens`;
  };

  return (
    <div className={cn("flex items-center justify-between p-3 bg-gray-50 rounded-lg", className)}>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Cache do aplicativo
          </p>
          <p className="text-xs text-gray-600">
            {formatCacheSize(cacheSize)} armazenados
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onClearCache}
        disabled={cacheSize === 0}
        className="text-xs"
      >
        Limpar Cache
      </Button>
    </div>
  );
};

// Componente principal que combina todas as funcionalidades
export const ServiceWorkerManager: React.FC = () => {
  return (
    <>
      <UpdateNotification />
      <NetworkStatus />
    </>
  );
};

export default ServiceWorkerManager;