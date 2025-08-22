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

const Users = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

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
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          {/* We will implement filters here later */}
          <p className="text-muted-foreground text-sm">Filtros e busca serão implementados aqui.</p>
        </div>

        <div>
          <UserTable />
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para criar um novo usuário.
            </DialogDescription>
          </DialogHeader>
          <UserForm onClose={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Users;
