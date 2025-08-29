import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export const DirectSupabaseTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  useEffect(() => {
    const runTests = async () => {
      // Limpar resultados anteriores
      setResults([]);

      // Teste 1: Verificar variáveis de ambiente
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('[DirectTest] URL:', url);
      console.log('[DirectTest] KEY:', key);
      console.log('[DirectTest] All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
      
      addResult({
        step: 'Verificar variáveis de ambiente',
        status: url && key ? 'success' : 'error',
        message: `URL: ${url ? 'OK' : 'MISSING'}, KEY: ${key ? 'OK' : 'MISSING'}`,
        data: { url, keyLength: key?.length }
      });

      if (!url || !key) {
        addResult({
          step: 'Teste interrompido',
          status: 'error',
          message: 'Variáveis de ambiente não encontradas'
        });
        return;
      }

      // Teste 2: Criar cliente manualmente
      try {
        const client = createClient(url, key, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        addResult({
          step: 'Criar cliente Supabase',
          status: 'success',
          message: 'Cliente criado com sucesso'
        });

        // Teste 3: Verificar se o cliente tem as credenciais
        const clientUrl = (client as any).supabaseUrl;
        const clientKey = (client as any).supabaseKey;
        
        addResult({
          step: 'Verificar credenciais do cliente',
          status: clientUrl && clientKey ? 'success' : 'error',
          message: `Cliente URL: ${clientUrl ? 'OK' : 'MISSING'}, Cliente KEY: ${clientKey ? 'OK' : 'MISSING'}`,
          data: { clientUrl, clientKeyLength: clientKey?.length }
        });

        // Teste 4: Fazer uma requisição simples
        addResult({
          step: 'Testando conexão',
          status: 'pending',
          message: 'Fazendo requisição...'
        });

        const { data, error } = await client
          .from('admin_users')
          .select('id')
          .limit(1);

        if (error) {
          addResult({
            step: 'Testando conexão',
            status: 'error',
            message: `Erro: ${error.message}`,
            data: error
          });
        } else {
          addResult({
            step: 'Testando conexão',
            status: 'success',
            message: 'Conexão bem-sucedida!',
            data: data
          });
        }

      } catch (err) {
        addResult({
          step: 'Criar cliente Supabase',
          status: 'error',
          message: `Erro ao criar cliente: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
          data: err
        });
      }
    };

    runTests();
  }, []);

  return (
    <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Teste Direto do Supabase</h2>
      
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="bg-white p-3 rounded border">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${
                result.status === 'success' ? 'bg-green-500' :
                result.status === 'error' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></span>
              <span className="font-semibold">{result.step}</span>
            </div>
            <div className="text-sm text-gray-700 ml-5">{result.message}</div>
            {result.data && (
              <details className="text-xs mt-2 ml-5">
                <summary className="cursor-pointer text-blue-600">Ver detalhes</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {results.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Executando testes...
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <strong>Variáveis disponíveis:</strong>
        <pre className="mt-1">
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
  );
};

export default DirectSupabaseTest;