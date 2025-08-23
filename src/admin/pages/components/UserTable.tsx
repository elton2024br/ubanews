import React, { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, ToggleLeft, ToggleRight, Trash2, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User } from '@/admin/types/admin';
import { useDeleteUser } from '../../hooks/useDeleteUser';
import { useToggleUserStatus } from '../../hooks/useToggleUserStatus';
import DeleteUserDialog from './DeleteUserDialog';

interface UserTableProps {
  onEditUser: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({ onEditUser }) => {
  const { data: users, isLoading, error } = useUsers();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const deleteUserMutation = useDeleteUser();
  const toggleUserStatusMutation = useToggleUserStatus();

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const getRoleBadgeVariant = (role: 'admin' | 'editor' | 'columnist') => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      case 'columnist': return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao Carregar Usuários</AlertTitle>
        <AlertDescription>
          Não foi possível buscar os usuários. Tente novamente mais tarde.
          <p className="text-xs mt-2">Detalhes: {error.message}</p>
        </AlertDescription>
      </Alert>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg">
        <h3 className="text-lg font-semibold">Nenhum usuário encontrado</h3>
        <p className="text-muted-foreground">Adicione um novo usuário para começar.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'outline' : 'secondary'} className={user.is_active ? 'text-green-600 border-green-600' : ''}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.two_factor_enabled ? 'Sim' : 'Não'}
              </TableCell>
              <TableCell>
                {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEditUser(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toggleUserStatusMutation.mutate(user.id)}>
                      {user.is_active ? (
                        <ToggleLeft className="mr-2 h-4 w-4" />
                      ) : (
                        <ToggleRight className="mr-2 h-4 w-4" />
                      )}
                      {user.is_active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onSelect={() => handleDeleteClick(user)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
        isPending={deleteUserMutation.isPending}
      />
    </div>
  );
};

export default UserTable;
