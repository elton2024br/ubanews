import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormControl, FormItem, FormMessage, FormDescription } from '@/components/ui/form';

type Field = {
  name: any; // keyof SettingsFormValues, but use any to avoid circular deps
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'switch' | 'email';
};

interface SettingsSectionProps {
  title: string;
  description: string;
  fields: Field[];
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, fields }) => {
  const { control } = useFormContext();

  const renderField = (fieldConfig: Field, field: any) => {
    switch (fieldConfig.type) {
      case 'switch':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <Label htmlFor={fieldConfig.name}>{fieldConfig.label}</Label>
          </div>
        );
      case 'textarea':
        return <Textarea {...field} placeholder={`Digite ${fieldConfig.label.toLowerCase()}...`} />;
      case 'email':
        return <Input type="email" {...field} placeholder="exemplo@email.com" />;
      default:
        return <Input {...field} placeholder={`Digite ${fieldConfig.label.toLowerCase()}...`} />;
    }
  };

  if (fields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma configuração disponível nesta seção.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {fields.map((fieldConfig) => (
          <FormField
            key={fieldConfig.name}
            control={control}
            name={fieldConfig.name}
            render={({ field }) => (
              <FormItem className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-1">
                  <Label className={fieldConfig.type === 'switch' ? 'cursor-pointer' : ''} htmlFor={fieldConfig.name}>{fieldConfig.label}</Label>
                  <FormDescription className="text-xs">
                    {fieldConfig.description}
                  </FormDescription>
                </div>
                <div className="md:col-span-2">
                  <FormControl>
                    {renderField(fieldConfig, field)}
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default SettingsSection;
