import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { newsletterService } from '@/services/newsletterService';
import {
  NewsletterSubscriber,
  NewsletterCampaign,
  NewsletterTemplate,
  NewsletterStats,
  SubscriptionFormData,
  CampaignFormData,
  NewsletterAPIResponse,
  NewsletterListResponse
} from '@/types/newsletter';

// Hook for general newsletter operations
export const useNewsletter = () => {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.getNewsletterStats();
      if (response.error) {
        setError(response.error);
      } else {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.getTemplates();
      if (response.error) {
        setError(response.error);
      } else {
        setTemplates(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTemplates();
  }, [fetchStats, fetchTemplates]);

  return {
    stats,
    templates,
    loading,
    error,
    refetchStats: fetchStats,
    refetchTemplates: fetchTemplates
  };
};

// Hook for subscription management
export const useNewsletterSubscription = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    has_next: false
  });

  const subscribe = useCallback(async (subscriptionData: SubscriptionFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.subscribe(subscriptionData);
      if (response.error) {
        setError(response.error);
        return response;
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { data: null as any, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (email: string, reason?: string, feedback?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.unsubscribe({
        email,
        reason,
        feedback
      });
      if (response.error) {
        setError(response.error);
        return response;
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscribers = useCallback(async (
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      search?: string;
      segment?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.getSubscribers(page, perPage, filters);
      if (response.error) {
        setError(response.error);
      } else {
        setSubscribers(response.data);
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          has_next: response.has_next
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subscribers,
    loading,
    error,
    pagination,
    subscribe,
    unsubscribe,
    fetchSubscribers
  };
};

// Hook for campaign management
export const useNewsletterCampaign = () => {
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    has_next: false
  });

  const createCampaign = useCallback(async (campaignData: CampaignFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.createCampaign(campaignData);
      if (response.error) {
        setError(response.error);
        return response;
      }
      if (response.data) {
        setCampaigns(prev => [response.data, ...prev]);
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { data: null as any, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendCampaign = useCallback(async (campaignId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.sendCampaign(campaignId);
      if (response.error) {
        setError(response.error);
        return response;
      }
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return { data: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async (
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      search?: string;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await newsletterService.getCampaigns(page, perPage, filters);
      if (response.error) {
        setError(response.error);
      } else {
        setCampaigns(response.data);
        setPagination({
          page: response.page,
          per_page: response.per_page,
          total: response.total,
          has_next: response.has_next
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    campaigns,
    loading,
    error,
    pagination,
    createCampaign,
    sendCampaign,
    fetchCampaigns
  };
};

// Hook for newsletter subscription form
export const useNewsletterForm = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscriptionStatus = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('status')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setIsSubscribed(data?.status === 'active');
    } catch (err) {
      console.error('Error checking subscription status:', err);
    }
  }, []);

  return {
    isSubscribed,
    loading,
    error,
    checkSubscriptionStatus,
    setLoading,
    setError
  };
};