import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DebugInfo {
  envVars: {
    url: string | undefined;
    anonKey: string | undefined;
    urlLength: number;
    anonKeyLength: number;
  };
  clientStatus: string;
  connectionTest: {
    status: 'pending' | 'success' | 'error';
    message: string;
    details?: any;
  };
}

export const SupabaseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    envVars: {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
      anonKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    },
    clientStatus: 'Checking...',
    connectionTest: {
      status: 'pending',
      message: 'Testing connection...'
    }
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('[SupabaseDebug] Iniciando teste de conexão...');
        console.log('[SupabaseDebug] URL:', debugInfo.envVars.url);
        console.log('[SupabaseDebug] ANON_KEY length:', debugInfo.envVars.anonKeyLength);
        
        // Verificar se o cliente foi criado
        if (!supabase) {
          setDebugInfo(prev => ({
            ...prev,
            clientStatus: 'Cliente não foi criado',
            connectionTest: {
              status: 'error',
              message: 'Cliente Supabase não foi inicializado'
            }
          }));
          return;
        }

        setDebugInfo(prev => ({
          ...prev,
          clientStatus: 'Cliente criado com sucesso'
        }));

        // Teste simples de conexão - apenas verificar se conseguimos fazer uma requisição
        console.log('[SupabaseDebug] Testando conexão com Supabase...');
        
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .limit(1);

        if (error) {
          console.error('[SupabaseDebug] Erro na conexão:', error);
          setDebugInfo(prev => ({
            ...prev,
            connectionTest: {
              status: 'error',
              message: `Erro: ${error.message}`,
              details: error
            }
          }));
        } else {
          console.log('[SupabaseDebug] Conexão bem-sucedida:', data);
          setDebugInfo(prev => ({
            ...prev,
            connectionTest: {
              status: 'success',
              message: 'Conexão estabelecida com sucesso!',
              details: data
            }
          }));
        }
      } catch (err) {
        console.error('[SupabaseDebug] Erro inesperado:', err);
        setDebugInfo(prev => ({
          ...prev,
          connectionTest: {
            status: 'error',
            message: `Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
            details: err
          }
        }));
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Supabase Debug Info</h2>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Variáveis de Ambiente</h3>
          <div className="space-y-1 text-sm">
            <div>URL: {debugInfo.envVars.url ? '✅ Definida' : '❌ Não definida'} ({debugInfo.envVars.urlLength} chars)</div>
            <div>ANON_KEY: {debugInfo.envVars.anonKey ? '✅ Definida' : '❌ Não definida'} ({debugInfo.envVars.anonKeyLength} chars)</div>
            <div className="mt-2 text-xs text-gray-600">
              URL: {debugInfo.envVars.url || 'undefined'}
            </div>
            <div className="text-xs text-gray-600">
              ANON_KEY: {debugInfo.envVars.anonKey ? `${debugInfo.envVars.anonKey.substring(0, 20)}...` : 'undefined'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Status do Cliente</h3>
          <div className="text-sm">{debugInfo.clientStatus}</div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Teste de Conexão</h3>
          <div className="space-y-2">
            <div className={`text-sm ${
              debugInfo.connectionTest.status === 'success' ? 'text-green-600' :
              debugInfo.connectionTest.status === 'error' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              Status: {debugInfo.connectionTest.status}
            </div>
            <div className="text-sm">{debugInfo.connectionTest.message}</div>
            {debugInfo.connectionTest.details && (
              <details className="text-xs">
                <summary className="cursor-pointer">Detalhes</summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo.connectionTest.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded border">
          <h3 className="font-semibold mb-2">Todas as Variáveis VITE_</h3>
          <div className="text-xs">
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(
                Object.entries(import.meta.env)
                  .filter(([key]) => key.startsWith('VITE_'))
                  .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDebug;