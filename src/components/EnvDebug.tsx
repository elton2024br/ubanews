import React from 'react';

export const EnvDebug: React.FC = () => {
  // Verificar todas as variáveis de ambiente disponíveis
  const allEnvVars = import.meta.env;
  const viteVars = Object.entries(allEnvVars)
    .filter(([key]) => key.startsWith('VITE_'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // Verificar especificamente as variáveis do Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('[EnvDebug] All env vars:', allEnvVars);
  console.log('[EnvDebug] VITE vars:', viteVars);
  console.log('[EnvDebug] Supabase URL:', supabaseUrl);
  console.log('[EnvDebug] Supabase Key:', supabaseKey);

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-3">Environment Debug</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>VITE_SUPABASE_URL:</strong>
          <span className={`ml-2 px-2 py-1 rounded ${supabaseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {supabaseUrl || 'MISSING'}
          </span>
        </div>
        
        <div>
          <strong>VITE_SUPABASE_ANON_KEY:</strong>
          <span className={`ml-2 px-2 py-1 rounded ${supabaseKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {supabaseKey ? `Present (${supabaseKey.length} chars)` : 'MISSING'}
          </span>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-blue-600 font-semibold">All VITE_ Variables</summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(viteVars, null, 2)}
        </pre>
      </details>

      <details className="mt-2">
        <summary className="cursor-pointer text-blue-600 font-semibold">All Environment Variables</summary>
        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(allEnvVars, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default EnvDebug;