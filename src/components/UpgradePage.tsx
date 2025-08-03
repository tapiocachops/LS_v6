import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, CheckCircle, ArrowRight, ArrowLeft, CreditCard,
  Users, BarChart3, Shield, Zap, Star, Gift, Target,
  Loader2, AlertCircle
} from 'lucide-react';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

const UpgradePage: React.FC = () => {
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      planId: 'monthly',
      name: 'Monthly',
      price: '$2.99',
      period: 'per month',
      description: 'Perfect for growing restaurants',
      features: [
        'Unlimited customers',
        'Advanced loyalty features',
        'Multi-branch support',
        'Advanced analytics',
        'Priority support',
        'Custom rewards',
        'Staff management'
      ],
      popular: true,
      savings: null
    },
    {
      planId: 'semiannual',
      name: '6 Months',
      price: '$9.99',
      period: 'one-time',
      description: 'Save 44% with 6-month plan',
      features: [
        'Everything in Monthly',
        'Advanced ROI analytics',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Training sessions'
      ],
      popular: false,
      savings: '44% savings'
    },
    {
      planId: 'annual',
      name: '1 Year',
      price: '$19.99',
      period: 'one-time',
      description: 'Best value - Save 67%',
      features: [
        'Everything in 6 Months',
        'White-label solution',
        'Custom integrations',
        'Account manager',
        'Advanced reporting',
        'Priority feature requests'
      ],
      popular: false,
      savings: '67% savings'
    }
  ];

  useEffect(() => {
    if (user) {
      loadCurrentSubscription();
    }
  }, [user]);

  const loadCurrentSubscription = async () => {
    if (!user) return;

    try {
      const data = await SubscriptionService.checkSubscriptionAccess(user.id);
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    setUpgrading(true);
    setError('');

    try {
      // Check if user already has a subscription
      const existingSubscription = await SubscriptionService.getUserSubscription(user.id);
      
      // In a real implementation, this would create a Stripe checkout session
      // For now, we'll simulate the upgrade process
      console.log('Upgrading to plan:', selectedPlan);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new subscription
      await SubscriptionService.createSubscription(user.id, selectedPlan as any);
      
      navigate('/dashboard', {
        state: { message: 'Subscription upgraded successfully!' }
      });
    } catch (err: any) {
      setError('Failed to upgrade subscription. Please try again or contact support.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E6A85C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/image.png" alt="VOYA" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold font-['Space_Grotesk'] bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] bg-clip-text text-transparent">
                VOYA
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Plan Status */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-['Space_Grotesk']">
                  Current Plan: {currentSubscription.subscription?.plan_type || 'Trial'}
                </h3>
                <p className="text-gray-600">
                  {currentSubscription.daysRemaining > 0 
                    ? `${currentSubscription.daysRemaining} days remaining`
                    : 'Expired'
                  }
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                currentSubscription.hasAccess 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentSubscription.hasAccess ? 'Active' : 'Expired'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-['Space_Grotesk']">
            Upgrade Your
            <span className="block bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] bg-clip-text text-transparent">
              Voya Experience
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock advanced features and take your loyalty program to the next level
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5" />
            {error}
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.planId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl cursor-pointer ${
                selectedPlan === plan.planId
                  ? 'border-[#E6A85C] shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan.popular ? 'ring-2 ring-[#E6A85C]/20' : ''}`}
              onClick={() => setSelectedPlan(plan.planId)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.savings && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {plan.savings}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 font-['Space_Grotesk']">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.planId && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#E6A85C]/10 via-[#E85A9B]/10 to-[#D946EF]/10 rounded-2xl pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Upgrade Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="bg-gradient-to-r from-[#E6A85C] via-[#E85A9B] to-[#D946EF] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
          >
            {upgrading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Upgrade to {plans.find(p => p.planId === selectedPlan)?.name}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Secure payment powered by Stripe • Cancel anytime
          </p>
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 bg-white rounded-2xl p-8 border border-gray-200"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center font-['Space_Grotesk']">
            Why Upgrade?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Unlimited Customers</h4>
              <p className="text-gray-600 text-sm">No limits on customer registrations</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Advanced Analytics</h4>
              <p className="text-gray-600 text-sm">ROI tracking and detailed insights</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Priority Support</h4>
              <p className="text-gray-600 text-sm">Get help when you need it most</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Advanced Features</h4>
              <p className="text-gray-600 text-sm">Custom branding and API access</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UpgradePage;