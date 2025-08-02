import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'trial' | 'monthly' | 'semiannual' | 'annual';
  status: 'active' | 'expired' | 'cancelled' | 'past_due';
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  maxCustomers: number;
  maxBranches: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

export class SubscriptionService {
  static async createSubscription(
    userId: string,
    planType: 'trial' | 'monthly' | 'semiannual' | 'annual',
    stripeSubscriptionId?: string,
    stripeCustomerId?: string
  ): Promise<Subscription> {
    try {
      // Calculate period dates based on plan type
      const now = new Date();
      const periodStart = now.toISOString();
      let periodEnd: Date;

      switch (planType) {
        case 'trial':
          periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        case 'monthly':
          periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        case 'semiannual':
          periodEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 months
          break;
        case 'annual':
          periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
          break;
        default:
          periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          current_period_start: periodStart,
          current_period_end: periodEnd.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  static async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'expired' | 'cancelled' | 'past_due'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  static async checkSubscriptionAccess(userId: string): Promise<{
    hasAccess: boolean;
    subscription: Subscription | null;
    features: PlanFeatures;
    daysRemaining?: number;
  }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        return {
          hasAccess: false,
          subscription: null,
          features: this.getTrialFeatures()
        };
      }

      const now = new Date();
      const endDate = new Date(subscription.current_period_end);
      const hasAccess = subscription.status === 'active' && endDate > now;
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        hasAccess,
        subscription,
        features: this.getPlanFeatures(subscription.plan_type),
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      };
    } catch (error: any) {
      console.error('Error checking subscription access:', error);
      return {
        hasAccess: false,
        subscription: null,
        features: this.getTrialFeatures()
      };
    }
  }

  static getPlanFeatures(planType: 'trial' | 'monthly' | 'semiannual' | 'annual'): PlanFeatures {
    switch (planType) {
      case 'trial':
        return this.getTrialFeatures();
      case 'monthly':
      case 'semiannual':
      case 'annual':
        return {
          maxCustomers: -1, // Unlimited
          maxBranches: -1, // Unlimited
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: planType !== 'monthly',
          apiAccess: planType !== 'monthly'
        };
      default:
        return this.getTrialFeatures();
    }
  }

  private static getTrialFeatures(): PlanFeatures {
    return {
      maxCustomers: 100,
      maxBranches: 1,
      advancedAnalytics: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false
    };
  }

  static async getAllSubscriptions(): Promise<(Subscription & { 
    user: { email: string; user_metadata: any };
    restaurant: { name: string; slug: string } | null;
  })[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          user:users(email, user_metadata),
          restaurant:restaurants(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all subscriptions:', error);
      return [];
    }
  }

  static async getSubscriptionStats(): Promise<{
    total: number;
    active: number;
    trial: number;
    paid: number;
    revenue: number;
    churnRate: number;
  }> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('plan_type, status, created_at');

      if (error) throw error;

      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === 'active').length || 0;
      const trial = subscriptions?.filter(s => s.plan_type === 'trial').length || 0;
      const paid = subscriptions?.filter(s => s.plan_type !== 'trial').length || 0;

      // Calculate estimated revenue (simplified)
      const revenue = subscriptions?.reduce((sum, sub) => {
        if (sub.plan_type === 'monthly') return sum + 2.99;
        if (sub.plan_type === 'semiannual') return sum + 9.99;
        if (sub.plan_type === 'annual') return sum + 19.99;
        return sum;
      }, 0) || 0;

      // Calculate churn rate (simplified)
      const cancelled = subscriptions?.filter(s => s.status === 'cancelled').length || 0;
      const churnRate = total > 0 ? (cancelled / total) * 100 : 0;

      return {
        total,
        active,
        trial,
        paid,
        revenue,
        churnRate
      };
    } catch (error: any) {
      console.error('Error fetching subscription stats:', error);
      return {
        total: 0,
        active: 0,
        trial: 0,
        paid: 0,
        revenue: 0,
        churnRate: 0
      };
    }
  }
}