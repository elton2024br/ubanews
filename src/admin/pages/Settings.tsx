import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import SettingsSection from './components/SettingsSection';

const Settings = () => {
  // In a real app, settings would be fetched from a hook
  // const { settings, isLoading } = useSettings();
  // For now, we use mock data grouped by category.

  const mockSettings = {
    general: [
      { key: 'site_name', value: 'Ubatuba News', description: 'O nome do site, exibido no topo da página.', type: 'text' },
      { key: 'site_description', value: 'Notícias de Ubatuba e região.', description: 'Uma breve descrição para SEO.', type: 'textarea' },
    ],
    security: [
      { key: 'force_2fa', value: false, description: 'Obrigar todos os usuários a usarem autenticação de dois fatores.', type: 'boolean' },
      { key: 'password_policy', value: 'medium', description: 'Política de força de senha para novos usuários.', type: 'select', options: ['low', 'medium', 'high'] },
    ],
    notifications: [
      { key: 'admin_email', value: 'admin@ubanews.com', description: 'Email para receber notificações administrativas.', type: 'email' },
    ],
    integrations: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais e de segurança do sistema.
          </p>
        </div>
        <Button>Salvar Alterações</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsSection title="Configurações Gerais" description="Ajustes básicos do site." settings={mockSettings.general} />
        </TabsContent>
        <TabsContent value="security">
          <SettingsSection title="Configurações de Segurança" description="Políticas de senha, 2FA e mais." settings={mockSettings.security} />
        </TabsContent>
        <TabsContent value="notifications">
          <SettingsSection title="Configurações de Notificação" description="Para onde enviar alertas e emails." settings={mockSettings.notifications} />
        </TabsContent>
        <TabsContent value="integrations">
          <SettingsSection title="Integrações" description="Conecte-se a serviços de terceiros." settings={mockSettings.integrations} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
