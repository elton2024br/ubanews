-- Criação do sistema de notificações em tempo real
-- Baseado no roadmap Fase 2 - UbaNews

-- Tabela principal de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'news_approved',
    'news_rejected', 
    'news_published',
    'comment_new',
    'comment_mention',
    'deadline_approaching',
    'system_update',
    'user_action',
    'approval_request'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT notifications_user_id_idx UNIQUE (id, user_id)
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Tabela de preferências de notificação por usuário
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  news_approved BOOLEAN DEFAULT true,
  news_rejected BOOLEAN DEFAULT true,
  comment_new BOOLEAN DEFAULT true,
  comment_mention BOOLEAN DEFAULT true,
  deadline_approaching BOOLEAN DEFAULT true,
  system_update BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read_at = NOW()
  WHERE id = p_notification_id 
    AND user_id = p_user_id 
    AND read_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE notifications 
  SET read_at = NOW()
  WHERE user_id = p_user_id 
    AND read_at IS NULL;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter contagem de notificações não lidas
CREATE OR REPLACE FUNCTION get_unread_count(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id AND read_at IS NULL;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Políticas RLS para notification_preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Trigger para criar preferências padrão quando um novo admin_user é criado
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_notification_preferences_on_user_creation
  AFTER INSERT ON admin_users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Trigger para notificar sobre aprovação/rejeição de notícias
CREATE OR REPLACE FUNCTION notify_news_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title VARCHAR(255);
  notification_message TEXT;
BEGIN
  -- Só processa se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        notification_title := 'Notícia Aprovada';
        notification_message := 'Sua notícia "' || NEW.title || '" foi aprovada e publicada.';
        
        PERFORM create_notification(
          NEW.author_id,
          'news_approved',
          notification_title,
          notification_message,
          jsonb_build_object(
            'news_id', NEW.id,
            'news_title', NEW.title,
            'approved_by', auth.uid()
          )
        );
        
      WHEN 'rejected' THEN
        notification_title := 'Notícia Rejeitada';
        notification_message := 'Sua notícia "' || NEW.title || '" foi rejeitada.';
        
        PERFORM create_notification(
          NEW.author_id,
          'news_rejected',
          notification_title,
          notification_message,
          jsonb_build_object(
            'news_id', NEW.id,
            'news_title', NEW.title,
            'rejected_by', auth.uid(),
            'rejection_reason', COALESCE(NEW.rejection_reason, '')
          )
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_news_status_change
  AFTER UPDATE ON admin_news
  FOR EACH ROW EXECUTE FUNCTION notify_news_status_change();

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Sistema de notificações em tempo real para administradores';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';
COMMENT ON FUNCTION create_notification IS 'Cria uma nova notificação para um usuário';
COMMENT ON FUNCTION mark_notification_read IS 'Marca uma notificação específica como lida';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marca todas as notificações de um usuário como lidas';
COMMENT ON FUNCTION get_unread_count IS 'Retorna o número de notificações não lidas de um usuário';