import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCSRF } from '../../../utils/csrf';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '../../types/admin';
import { useCreateUser } from '../../hooks/useCreateUser';
import { useUpdateUser } from '../../hooks/useUpdateUser';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  initialData?: User | null;
  onClose: () => void;
}

const userFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  role: z.enum(['admin', 'editor', 'columnist'], { required_error: "Selecione uma role." }),
  password: z.string().optional(),
});

const getDynamicSchema = (isEditing: boolean) => {
  return isEditing
    ? userFormSchema.extend({
        password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }).optional().or(z.literal('')),
      })
    : userFormSchema.extend({
        password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
      });
};

type UserFormValues = z.infer<ReturnType<typeof getDynamicSchema>>;

const generatePassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

const UserForm: React.FC<UserFormProps> = ({ initialData, onClose }) => {
  const isEditing = !!initialData;
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const csrfToken = useCSRF();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(getDynamicSchema(isEditing)),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'columnist',
      password: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        password: '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        role: 'columnist',
        password: '',
      });
    }
  }, [initialData, form]);

  const onSubmit = (data: UserFormValues) => {
    const mutationData = { ...data };
    if (isEditing && !mutationData.password) {
      delete mutationData.password;
    }

    if (isEditing && initialData) {
      updateUserMutation.mutate({ id: initialData.id, ...mutationData }, {
        onSuccess: () => onClose(),
      });
    } else {
      createUserMutation.mutate(mutationData, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <fieldset disabled={isPending} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="exemplo@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="columnist">Columnist</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEditing ? 'Nova Senha' : 'Senha'}</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="********" {...field} />
                    <Button type="button" variant="outline" onClick={() => form.setValue('password', generatePassword())}>
                      Gerar
                    </Button>
                  </div>
                </FormControl>
                {isEditing && <FormDescription>Deixe em branco para não alterar a senha.</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Criar Usuário'
              )}
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
};

export default UserForm;
