import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SettingsSection from './components/SettingsSection';
import { useSettings } from '../hooks/useSettings';
import { useUpdateSettings } from '../hooks/useUpdateSettings';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const settingsSchema = z.object({
  site_title: z.string().min(1, 'O título do site é obrigatório.'),
  site_description: z.string().optional(),
  maintenance_mode: z.boolean(),
  enable_2fa_for_all: z.boolean(),
  notification_email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const Settings = () => {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_title: '',
      site_description: '',
      maintenance_mode: false,
      enable_2fa_for_all: false,
      notification_email: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        site_title: settings.site_title || '',
        site_description: settings.site_description || '',
        maintenance_mode: settings.maintenance_mode || false,
        enable_2fa_for_all: settings.enable_2fa_for_all || false,
        notification_email: settings.notification_email || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Configurações Salvas",
          description: "Suas alterações foram salvas com sucesso.",
        });
      },
      onError: () => {
        toast({
          title: "Erro",
          description: "Não foi possível salvar as configurações.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="text-red-500">Erro ao carregar configurações: {error.message}</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações gerais e de segurança do sistema.
            </p>
          </div>
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar Alterações
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsSection
              title="Configurações Gerais"
              description="Ajustes básicos do site que afetam a visualização pública."
              fields={[
                { name: 'site_title', label: 'Título do Site', description: 'O nome do site, exibido no topo da página.', type: 'text' },
                { name: 'site_description', label: 'Descrição do Site', description: 'Uma breve descrição para SEO.', type: 'textarea' },
                { name: 'maintenance_mode', label: 'Modo Manutenção', description: 'Desativa o acesso público ao site.', type: 'switch' },
              ]}
            />
          </TabsContent>
          <TabsContent value="security">
            <SettingsSection
              title="Configurações de Segurança"
              description="Políticas de segurança para todos os usuários."
              fields={[
                { name: 'enable_2fa_for_all', label: 'Forçar 2FA', description: 'Obrigar todos os usuários a usarem autenticação de dois fatores.', type: 'switch' },
              ]}
            />
          </TabsContent>
          <TabsContent value="notifications">
            <SettingsSection
              title="Configurações de Notificação"
              description="Para onde enviar alertas e emails importantes."
              fields={[
                { name: 'notification_email', label: 'Email de Notificação', description: 'Endereço para receber notificações administrativas.', type: 'email' },
              ]}
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};

export default Settings;
