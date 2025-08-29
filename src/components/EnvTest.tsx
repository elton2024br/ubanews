import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const EnvTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testando...');
  const [supabaseData, setSupabaseData] = useState<any>(null);
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  useEffect(() => {
    console.log('=== TESTE COMPLETO SUPABASE NO BROWSER ===');
    console.log('VITE_SUPABASE_URL:', supabaseUrl);
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'DEFINIDA' : 'UNDEFINED');
    console.log('Todas as variáveis VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    
    const testSupabaseConnection = async () => {
      try {
        if (!supabaseUrl || !supabaseKey) {
          setConnectionStatus('❌ Variáveis de ambiente não encontradas');
          return;
        }
        
        console.log('🔄 Criando cliente Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        console.log('🔄 Testando conexão com query simples...');
        const { data, error, count } = await supabase
          .from('admin_users')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('❌ Erro na conexão:', error);
          setConnectionStatus(`❌ Erro: ${error.message}`);
        } else {
          console.log('✅ Conexão bem-sucedida! Count:', count);
          setConnectionStatus(`✅ Conexão OK - ${count} registros encontrados`);
          setSupabaseData({ count, timestamp: new Date().toISOString() });
        }
      } catch (err) {
        console.error('❌ Erro inesperado:', err);
        setConnectionStatus(`❌ Erro inesperado: ${err}`);
      }
    };
    
    testSupabaseConnection();
  }, [supabaseUrl, supabaseKey]);
  
  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #ccc', 
      margin: '20px', 
      backgroundColor: '#f9f9f9',
      borderRadius: '8px'
    }}>
      <h3>🔍 Teste Completo de Variáveis de Ambiente e Supabase</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>📋 Variáveis de Ambiente:</h4>
        <div>
          <strong>VITE_SUPABASE_URL:</strong> 
          <span style={{ color: supabaseUrl ? 'green' : 'red', marginLeft: '10px' }}>
            {supabaseUrl || 'UNDEFINED'}
          </span>
        </div>
        <div>
          <strong>VITE_SUPABASE_ANON_KEY:</strong> 
          <span style={{ color: supabaseKey ? 'green' : 'red', marginLeft: '10px' }}>
            {supabaseKey ? `DEFINIDA (${supabaseKey.length} chars)` : 'UNDEFINED'}
          </span>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>🌐 Teste de Conexão Supabase:</h4>
        <div style={{ 
          padding: '10px', 
          backgroundColor: connectionStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${connectionStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          {connectionStatus}
        </div>
        {supabaseData && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Testado em: {supabaseData.timestamp}
          </div>
        )}
      </div>
      
      <div>
        <h4>🔧 Todas as Variáveis VITE_:</h4>
        <ul style={{ fontSize: '12px' }}>
          {Object.keys(import.meta.env)
            .filter(key => key.startsWith('VITE_'))
            .map(key => (
              <li key={key}>
                <strong>{key}:</strong> {import.meta.env[key]}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default EnvTest;