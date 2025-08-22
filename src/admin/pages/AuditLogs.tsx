import React, { useState } from 'react';
import AuditLogItem from './components/AuditLogItem';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Search } from 'lucide-react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useUsers } from '../hooks/useUsers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AuditLogs = () => {
  const { data: logs, isLoading, error } = useAuditLogs();
  const { data: users } = useUsers(); // For the filter dropdown

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  // We will use this later to filter the logs
  const filteredLogs = logs?.filter(log => {
    const userMatch = selectedUser ? log.user_email === selectedUser : true;
    const actionMatch = selectedAction ? log.action.startsWith(selectedAction) : true;
    const searchMatch = searchTerm ? JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return userMatch && actionMatch && searchMatch;
  });

  // Get unique action types from logs for the filter dropdown
  const actionTypes = logs ? [...new Set(logs.map(log => log.action.split('.')[0]))] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Logs de Auditoria</h2>
          <p className="text-muted-foreground">
            Monitore todas as atividades importantes que acontecem no sistema.
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os detalhes do log..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os usuários</SelectItem>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.email}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os módulos</SelectItem>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>{action.charAt(0).toUpperCase() + action.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando logs...</span>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao Carregar Logs</AlertTitle>
            <AlertDescription>
              Não foi possível buscar os logs de auditoria. Tente novamente mais tarde.
              <p className="text-xs mt-2">Detalhes: {error.message}</p>
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && filteredLogs && filteredLogs.length === 0 && (
          <div className="text-center p-8 border rounded-lg">
            <h3 className="text-lg font-semibold">Nenhum log encontrado</h3>
            <p className="text-muted-foreground">Nenhum log corresponde aos filtros aplicados.</p>
          </div>
        )}
        {!isLoading && !error && filteredLogs && filteredLogs.map(log => (
          <AuditLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
};

export default AuditLogs;
