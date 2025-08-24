-- Tabela para armazenar configurações globais do site
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name TEXT NOT NULL,
    logo_url TEXT,
    feature_flags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas administradores podem gerenciar configurações
CREATE POLICY "Admins can manage site settings" ON site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Registro padrão
INSERT INTO site_settings (site_name, logo_url, feature_flags)
VALUES ('UbaNews', NULL, '{}'::jsonb)
ON CONFLICT DO NOTHING;
