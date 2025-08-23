import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import UserTable from "./components/UserTable";
import UserForm from "./components/UserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User } from "../types/admin";

const Users = () => {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const handleOpenDialog = (user: User | null = null) => {
    setUserToEdit(user);
    setIsUserDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsUserDialogOpen(false);
    setUserToEdit(null);
  };

  const isEditing = !!userToEdit;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gerenciamento de Usuários</h2>
            <p className="text-muted-foreground">
              Adicione, edite e gerencie os usuários do sistema.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          {/* We will implement filters here later */}
          <p className="text-muted-foreground text-sm">Filtros e busca serão implementados aqui.</p>
        </div>

        <div>
          <UserTable onEditUser={handleOpenDialog} />
        </div>
      </div>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          // This prevents closing the dialog on background click if a sub-dialog (like a select) is open
          if (e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os detalhes do usuário abaixo."
                : "Preencha os detalhes abaixo para criar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <UserForm initialData={userToEdit} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Users;
