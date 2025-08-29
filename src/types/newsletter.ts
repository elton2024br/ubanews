export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  preferences: Record<string, any>;
  subscribed_at: string;
  unsubscribed_at?: string;
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  template_id?: string;
  content: NewsletterContent;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_for?: string;
  sent_at?: string;
  recipients_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterTemplate {
  id: string;
  name: string;
  description?: string;
  html_content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterTracking {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  email: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface NewsletterSegment {
  id: string;
  name: string;
  description?: string;
  criteria: NewsletterCriteria;
  subscriber_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterContent {
  title: string;
  body: string;
  call_to_action?: {
    text: string;
    url: string;
  };
  images?: string[];
  footer?: string;
}

export interface NewsletterCriteria {
  categories?: string[];
  tags?: string[];
  subscribed_after?: string;
  subscribed_before?: string;
  engagement_level?: 'high' | 'medium' | 'low';
  custom_conditions?: Record<string, any>;
}

export interface NewsletterStats {
  total_subscribers: number;
  active_subscribers: number;
  unsubscribed_subscribers: number;
  bounced_subscribers: number;
  campaigns_sent: number;
  campaigns_scheduled: number;
  total_emails_sent: number;
  total_emails_opened: number;
  total_emails_clicked: number;
  average_open_rate: number;
  average_click_rate: number;
  bounce_rate: number;
}

export interface SubscriptionFormData {
  email: string;
  name?: string;
  preferences?: Record<string, any>;
  categories?: string[];
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface CampaignFormData {
  name: string;
  subject: string;
  template_id?: string;
  content: NewsletterContent;
  recipients: {
    type: 'all' | 'segment' | 'individual';
    segment_id?: string;
    emails?: string[];
  };
  scheduled_for?: string;
  send_immediately?: boolean;
}

export interface EmailTemplateVariables {
  [key: string]: string;
  unsubscribe_url: string;
  subscriber_name: string;
  campaign_title: string;
  company_name: string;
  company_address: string;
  company_website: string;
}

export interface NewsletterPreferences {
  categories: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day?: string;
  language?: 'pt-BR' | 'en';
  format?: 'html' | 'text';
}

export interface UnsubscribeData {
  email: string;
  reason?: string;
  feedback?: string;
  unsubscribe_all?: boolean;
}

export interface NewsletterAPIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface NewsletterListResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}