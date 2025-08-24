import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details: Record<string, any>;
  created_at: string;
  user?: {
    full_name: string;
  } | null;
}

interface Filters {
  user: string;
  startDate: string;
  endDate: string;
}

export const Audit: React.FC = () => {
  const { user } = useAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ user: 'all', startDate: '', endDate: '' });
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters, currentPage]);

  const loadUsers = async () => {
    const { data, error } = await supabase.from('admin_users').select('id, full_name').order('full_name');
    if (error) {
      console.error('Error loading users:', error);
      return;
    }
    setUsers(data || []);
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select('*, user:admin_users(id, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.user !== 'all') {
        query = query.eq('user_id', filters.user);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading audit logs:', error);
        toast.error('Erro ao carregar logs');
        return;
      }

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error loading audit logs:', err);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, user:admin_users(id, full_name)')
        .order('created_at', { ascending: false });

      if (filters.user !== 'all') {
        query = query.eq('user_id', filters.user);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate + 'T23:59:59');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error exporting logs:', error);
        toast.error('Erro ao exportar logs');
        return;
      }
      const rows = data || [];
      let csv = 'Data,Usuário,Ação,Recurso,Detalhes\n';
      csv += rows
        .map(log => {
          const date = format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss');
          const userName = log.user?.full_name || '';
          const details = JSON.stringify(log.details || {});
          return `"${date}","${userName}","${log.action}","${log.resource}","${details.replace(/"/g, '""')}"`;
        })
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting logs:', err);
      toast.error('Erro ao exportar logs');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-red-600">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Registros de atividades do sistema
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              value={filters.user}
              onValueChange={(value) => {
                setCurrentPage(1);
                setFilters(prev => ({ ...prev, user: value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => {
                setCurrentPage(1);
                setFilters(prev => ({ ...prev, startDate: e.target.value }));
              }}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => {
                setCurrentPage(1);
                setFilters(prev => ({ ...prev, endDate: e.target.value }));
              }}
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{log.user?.full_name || '-'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap text-xs max-w-xs overflow-auto">
                        {JSON.stringify(log.details)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;
