import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Gauge, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface WebVital {
  id: string;
  name: string;
  value: number;
  rating: string;
  url: string | null;
  created_at: string;
}

interface Alert {
  id: number;
  metric_name: string;
  metric_value: number;
  threshold: number;
  created_at: string;
}

const Performance: React.FC = () => {
  const [metrics, setMetrics] = useState<WebVital[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: metricsData } = await supabase
        .from('web_vitals')
        .select('id,name,value,rating,url,created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      setMetrics(metricsData || []);

      const { data: alertsData } = await supabase
        .from('web_vital_alerts')
        .select('id,metric_name,metric_value,threshold,created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      setAlerts(alertsData || []);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" /> Últimas métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Métrica</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Quando</th>
                  <th className="py-2">URL</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="py-2 pr-4 font-medium">{m.name}</td>
                    <td className="py-2 pr-4">{m.value.toFixed(2)}</td>
                    <td className="py-2 pr-4">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 max-w-xs truncate">{m.url}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {metrics.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma métrica registrada.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta registrado.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map(a => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>
                    {a.metric_name} {a.metric_value.toFixed(2)}ms
                  </span>
                  <Badge variant="destructive">&gt;{a.threshold}ms</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;
