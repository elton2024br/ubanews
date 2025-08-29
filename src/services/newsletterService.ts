import { supabase } from '@/lib/supabaseClient';
import {
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterTemplate,
  NewsletterTracking,
  NewsletterSegment,
  SubscriptionFormData,
  CampaignFormData,
  NewsletterStats,
  NewsletterAPIResponse,
  NewsletterListResponse,
  EmailTemplateVariables,
  UnsubscribeData
} from '@/types/newsletter';

export class NewsletterService {
  // Subscriber management
  async subscribe(subscriptionData: SubscriptionFormData): Promise<NewsletterAPIResponse<NewsletterSubscriber>> {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: subscriptionData.email,
          name: subscriptionData.name,
          preferences: subscriptionData.preferences || {},
          status: 'active'
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Inscrição realizada com sucesso!' };
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      return { data: null as any, error: error.message };
    }
  }

  async unsubscribe(unsubscribeData: UnsubscribeData): Promise<NewsletterAPIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
          preferences: {
            ...unsubscribeData,
            unsubscribe_reason: unsubscribeData.reason,
            unsubscribe_feedback: unsubscribeData.feedback
          }
        })
        .eq('email', unsubscribeData.email);

      if (error) throw error;

      return { data: true, message: 'Você foi removido da newsletter com sucesso.' };
    } catch (error: any) {
      console.error('Error unsubscribing from newsletter:', error);
      return { data: false, error: error.message };
    }
  }

  async getSubscribers(
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      search?: string;
      segment?: string;
    }
  ): Promise<NewsletterListResponse<NewsletterSubscriber>> {
    try {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        per_page: perPage,
        has_next: (count || 0) > page * perPage
      };
    } catch (error: any) {
      console.error('Error getting subscribers:', error);
      return { data: [], total: 0, page, per_page: perPage, has_next: false, error: error.message };
    }
  }

  // Campaign management
  async createCampaign(campaignData: CampaignFormData): Promise<NewsletterAPIResponse<NewsletterCampaign>> {
    try {
      const { data, error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          name: campaignData.name,
          subject: campaignData.subject,
          template_id: campaignData.template_id,
          content: campaignData.content,
          status: campaignData.send_immediately ? 'sending' : 'draft',
          scheduled_for: campaignData.scheduled_for,
          recipients_count: 0,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate recipients count based on recipient type
      if (campaignData.recipients.type === 'all') {
        const { count } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact' })
          .eq('status', 'active');
        
        await supabase
          .from('newsletter_campaigns')
          .update({ recipients_count: count || 0 })
          .eq('id', data.id);
      }

      return { data, message: 'Campanha criada com sucesso!' };
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return { data: null as any, error: error.message };
    }
  }

  async getCampaigns(
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      search?: string;
    }
  ): Promise<NewsletterListResponse<NewsletterCampaign>> {
    try {
      let query = supabase
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        per_page: perPage,
        has_next: (count || 0) > page * perPage
      };
    } catch (error: any) {
      console.error('Error getting campaigns:', error);
      return { data: [], total: 0, page, per_page: perPage, has_next: false, error: error.message };
    }
  }

  // Template management
  async getTemplates(): Promise<NewsletterAPIResponse<NewsletterTemplate[]>> {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [] };
    } catch (error: any) {
      console.error('Error getting templates:', error);
      return { data: [], error: error.message };
    }
  }

  async createTemplate(template: Omit<NewsletterTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NewsletterAPIResponse<NewsletterTemplate>> {
    try {
      const { data, error } = await supabase
        .from('newsletter_templates')
        .insert({
          ...template,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { data, message: 'Template criado com sucesso!' };
    } catch (error: any) {
      console.error('Error creating template:', error);
      return { data: null as any, error: error.message };
    }
  }

  // Segments management
  async createSegment(segment: Omit<NewsletterSegment, 'id' | 'created_at' | 'updated_at'>): Promise<NewsletterAPIResponse<NewsletterSegment>> {
    try {
      const { data, error } = await supabase
        .from('newsletter_segments')
        .insert({
          ...segment,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate subscriber count based on criteria
      const subscriberCount = await this.calculateSegmentSubscribers(segment.criteria);
      
      await supabase
        .from('newsletter_segments')
        .update({ subscriber_count: subscriberCount })
        .eq('id', data.id);

      return { data: { ...data, subscriber_count: subscriberCount }, message: 'Segmento criado com sucesso!' };
    } catch (error: any) {
      console.error('Error creating segment:', error);
      return { data: null as any, error: error.message };
    }
  }

  // Email delivery simulation
  async sendCampaign(campaignId: string): Promise<NewsletterAPIResponse<boolean>> {
    try {
      // Get campaign details
      const { data: campaign } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (!campaign) throw new Error('Campaign not found');

      // Get subscribers
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('status', 'active');

      if (!subscribers) throw new Error('No subscribers found');

      // Simulate email sending by creating tracking records
      const trackingRecords = subscribers.map(subscriber => ({
        campaign_id: campaignId,
        subscriber_id: subscriber.id,
        email: subscriber.email,
        sent_at: new Date().toISOString()
      }));

      const { error: trackingError } = await supabase
        .from('newsletter_tracking')
        .insert(trackingRecords);

      if (trackingError) throw trackingError;

      // Update campaign status
      await supabase
        .from('newsletter_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipients_count: subscribers.length
        })
        .eq('id', campaignId);

      return { data: true, message: 'Campanha enviada com sucesso!' };
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      return { data: false, error: error.message };
    }
  }

  // Analytics
  async getNewsletterStats(): Promise<NewsletterAPIResponse<NewsletterStats>> {
    try {
      // Get subscriber counts
      const { count: totalSubscribers } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' });

      const { count: activeSubscribers } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      const { count: unsubscribedSubscribers } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .eq('status', 'unsubscribed');

      const { count: bouncedSubscribers } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .eq('status', 'bounced');

      // Get campaign stats
      const { count: campaignsSent } = await supabase
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' })
        .eq('status', 'sent');

      const { count: campaignsScheduled } = await supabase
        .from('newsletter_campaigns')
        .select('*', { count: 'exact' })
        .eq('status', 'scheduled');

      // Get tracking stats
      const { count: totalEmailsSent } = await supabase
        .from('newsletter_tracking')
        .select('*', { count: 'exact' });

      const { count: totalEmailsOpened } = await supabase
        .from('newsletter_tracking')
        .select('*', { count: 'exact' })
        .not('opened_at', 'is', null);

      const { count: totalEmailsClicked } = await supabase
        .from('newsletter_tracking')
        .select('*', { count: 'exact' })
        .not('clicked_at', 'is', null);

      const totalSent = totalEmailsSent || 0;
      const totalOpened = totalEmailsOpened || 0;
      const totalClicked = totalEmailsClicked || 0;

      const averageOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const averageClickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
      const bounceRate = totalSent > 0 ? ((bouncedSubscribers || 0) / totalSent) * 100 : 0;

      return {
        data: {
          total_subscribers: totalSubscribers || 0,
          active_subscribers: activeSubscribers || 0,
          unsubscribed_subscribers: unsubscribedSubscribers || 0,
          bounced_subscribers: bouncedSubscribers || 0,
          campaigns_sent: campaignsSent || 0,
          campaigns_scheduled: campaignsScheduled || 0,
          total_emails_sent: totalSent,
          total_emails_opened: totalOpened,
          total_emails_clicked: totalClicked,
          average_open_rate: Math.round(averageOpenRate * 100) / 100,
          average_click_rate: Math.round(averageClickRate * 100) / 100,
          bounce_rate: Math.round(bounceRate * 100) / 100
        }
      };
    } catch (error: any) {
      console.error('Error getting newsletter stats:', error);
      return { data: null as any, error: error.message };
    }
  }

  private async calculateSegmentSubscribers(criteria: any): Promise<number> {
    // This is a simplified version - in real implementation, this would parse criteria and count matching subscribers
    try {
      const { count } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      return count || 0;
    } catch (error) {
      console.error('Error calculating segment subscribers:', error);
      return 0;
    }
  }

  // Template rendering
  renderTemplate(template: string, variables: EmailTemplateVariables): string {
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return rendered;
  }
}

export const newsletterService = new NewsletterService();