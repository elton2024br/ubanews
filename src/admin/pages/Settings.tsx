import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'Nome do site é obrigatório'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  enableComments: z.boolean(),
  enableBeta: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const Settings: React.FC = () => {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: '',
      logoUrl: '',
      enableComments: true,
      enableBeta: false,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();
      if (error) {
        toast.error('Erro ao carregar configurações');
        return;
      }
      if (data) {
        setSettingsId(data.id);
        setValue('siteName', data.site_name);
        setValue('logoUrl', data.logo_url || '');
        const flags = (data.feature_flags as Record<string, any>) || {};
        setValue('enableComments', flags.enableComments ?? true);
        setValue('enableBeta', flags.enableBeta ?? false);
      }
    };
    loadSettings();
  }, [setValue]);

  const onSubmit = async (values: SettingsForm) => {
    const { error } = await supabase.from('site_settings').upsert({
      id: settingsId ?? undefined,
      site_name: values.siteName,
      logo_url: values.logoUrl || null,
      feature_flags: {
        enableComments: values.enableComments,
        enableBeta: values.enableBeta,
      },
    });
    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas com sucesso');
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Nome do Site</Label>
            <Input id="siteName" {...register('siteName')} />
            {errors.siteName && (
              <p className="text-sm text-red-600">{errors.siteName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL do Logo</Label>
            <Input id="logoUrl" {...register('logoUrl')} />
            {errors.logoUrl && (
              <p className="text-sm text-red-600">{errors.logoUrl.message}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableComments" className="mr-4">Habilitar comentários</Label>
            <Switch
              id="enableComments"
              checked={watch('enableComments')}
              onCheckedChange={(checked) => setValue('enableComments', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableBeta" className="mr-4">Habilitar recursos beta</Label>
            <Switch
              id="enableBeta"
              checked={watch('enableBeta')}
              onCheckedChange={(checked) => setValue('enableBeta', checked)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default Settings;

