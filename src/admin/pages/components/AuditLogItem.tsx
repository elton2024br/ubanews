import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, UserPlus, FileUp, Settings2, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// This type should be aligned with the one in `types/admin.ts`
interface Log {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

interface AuditLogItemProps {
  log: Log;
}

const getActionIcon = (action: string) => {
  if (action.includes('create')) return <UserPlus className="h-4 w-4" />;
  if (action.includes('publish')) return <FileUp className="h-4 w-4" />;
  if (action.includes('update')) return <Settings2 className="h-4 w-4" />;
  return <ShieldAlert className="h-4 w-4" />;
};

const formatActionText = (log: Log) => {
  const [resource, action] = log.action.split('.');

  switch (log.action) {
    case 'user.create':
      return `criou o usuário ${log.details.name || ''}`;
    case 'news.publish':
      return `publicou a notícia "${log.details.title || ''}"`;
    case 'settings.update':
      return `atualizou a configuração ${log.resource_id}`;
    default:
      return `realizou a ação ${log.action} no recurso ${log.resource}`;
  }
};

const AuditLogItem: React.FC<AuditLogItemProps> = ({ log }) => {
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Collapsible className="border rounded-lg p-4 bg-card">
      <div className="flex items-start space-x-4">
        <Avatar>
          <AvatarImage src={`https://i.pravatar.cc/40?u=${log.user_email}`} />
          <AvatarFallback>{getInitials(log.user_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <p className="text-sm">
            <span className="font-semibold">{log.user_name}</span>{' '}
            {formatActionText(log)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 mt-4 pl-14">
        <h4 className="font-semibold text-sm">Detalhes do Log</h4>
        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
          {JSON.stringify(log, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AuditLogItem;
