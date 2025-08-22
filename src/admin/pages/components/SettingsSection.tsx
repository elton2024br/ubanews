import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Setting = {
  key: string;
  value: any;
  description: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'email';
  options?: string[];
};

interface SettingsSectionProps {
  title: string;
  description: string;
  settings: Setting[];
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, settings }) => {
  // We'll manage form state here temporarily for UI interaction.
  // In a real app, this would be handled by react-hook-form passed from the parent.
  const [formState, setFormState] = useState<Record<string, any>>({});

  useEffect(() => {
    const initialState = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
    setFormState(initialState);
  }, [settings]);

  const handleInputChange = (key: string, value: any) => {
    setFormState(prevState => ({ ...prevState, [key]: value }));
  };

  const renderField = (setting: Setting) => {
    const value = formState[setting.key];

    switch (setting.type) {
      case 'boolean':
        return <Switch checked={value} onCheckedChange={(checked) => handleInputChange(setting.key, checked)} />;
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(setting.key, val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'textarea':
        return <Textarea value={value} onChange={(e) => handleInputChange(setting.key, e.target.value)} />;
      case 'email':
        return <Input type="email" value={value} onChange={(e) => handleInputChange(setting.key, e.target.value)} />;
      default:
        return <Input type="text" value={value} onChange={(e) => handleInputChange(setting.key, e.target.value)} />;
    }
  };

  if (settings.length === 0) {
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
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-1">
              <Label htmlFor={setting.key}>{setting.key.replace(/_/g, ' ')}</Label>
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            </div>
            <div className="md:col-span-2">
              {renderField(setting)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SettingsSection;
