import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CreditCard,
  AlertTriangle,
  Mail,
  Eye,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  paidUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  churnRate: number;
  planDistribution: {
    trial: number;
    monthly: number;
    semiannual: number;
    annual: number;
  };
}

interface RecentSubscription {
  id: string;
  user_email: string;
  plan_type: string;
  status: string;
  created_at: string;
  current_period_end: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  restaurant_name: string;
}

export default function SuperAdminUI() {
  const [stats, setStats] = useState<SubscriptionStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    paidUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    churnRate: 0,
    planDistribution: { trial: 0, monthly: 0, semiannual: 0, annual: 0 }
  });
  
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSubscriptionStats(),
        loadRecentSubscriptions(),
        loadSupportTickets()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get subscription stats
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('plan_type, status, created_at, current_period_end');

      if (subscriptions) {
        const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
        const trialUsers = subscriptions.filter(s => s.plan_type === 'trial' && s.status === 'active').length;
        const paidUsers = subscriptions.filter(s => s.plan_type !== 'trial' && s.status === 'active').length;

        // Calculate plan distribution
        const planDistribution = {
          trial: subscriptions.filter(s => s.plan_type === 'trial').length,
          monthly: subscriptions.filter(s => s.plan_type === 'monthly').length,
          semiannual: subscriptions.filter(s => s.plan_type === 'semiannual').length,
          annual: subscriptions.filter(s => s.plan_type === 'annual').length,
        };

        // Calculate revenue (mock calculation - in real app, get from Stripe)
        const monthlyRevenue = (planDistribution.monthly * 2.99) + 
                              (planDistribution.semiannual * 9.99 / 6) + 
                              (planDistribution.annual * 19.99 / 12);
        
        const totalRevenue = (planDistribution.monthly * 2.99 * 6) + 
                            (planDistribution.semiannual * 9.99) + 
                            (planDistribution.annual * 19.99);

        // Calculate churn rate (simplified)
        const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired').length;
        const churnRate = totalUsers > 0 ? (expiredSubscriptions / totalUsers) * 100 : 0;

        setStats({
          totalUsers: totalUsers || 0,
          activeSubscriptions,
          trialUsers,
          paidUsers,
          totalRevenue,
          monthlyRevenue,
          churnRate,
          planDistribution
        });
      }
    } catch (error) {
      console.error('Error loading subscription stats:', error);
    }
  };

  const loadRecentSubscriptions = async () => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan_type,
          status,
          created_at,
          current_period_end,
          users!inner(email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const formatted = data.map(sub => ({
          id: sub.id,
          user_email: (sub.users as any).email,
          plan_type: sub.plan_type,
          status: sub.status,
          created_at: sub.created_at,
          current_period_end: sub.current_period_end
        }));
        setRecentSubscriptions(formatted);
      }
    } catch (error) {
      console.error('Error loading recent subscriptions:', error);
    }
  };

  const loadSupportTickets = async () => {
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          restaurants!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const formatted = data.map(ticket => ({
          id: ticket.id,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          restaurant_name: (ticket.restaurants as any).name
        }));
        setSupportTickets(formatted);
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
    }
  };

  const sendSubscriptionReminder = async (subscriptionId: string) => {
    try {
      // In a real app, this would trigger an email service
      console.log('Sending reminder for subscription:', subscriptionId);
      alert('Subscription reminder sent successfully!');
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'trial': return 'text-blue-600 bg-blue-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage Voya platform and subscriptions</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
              { id: 'support', label: 'Support', icon: AlertTriangle },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.churnRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
                <div className="space-y-4">
                  {Object.entries(stats.planDistribution).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">{plan}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Recurring</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(stats.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trial Users</span>
                    <span className="text-lg font-bold text-blue-600">{stats.trialUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid Users</span>
                    <span className="text-lg font-bold text-purple-600">{stats.paidUsers}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'subscriptions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Subscriptions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSubscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.user_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {subscription.plan_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(subscription.current_period_end)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => sendSubscriptionReminder(subscription.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Support Tickets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supportTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.restaurant_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Settings className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Analytics charts coming soon</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4" />
                <p>Revenue analytics coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}