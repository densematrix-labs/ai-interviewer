import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Loader2 } from 'lucide-react';
import { createCheckout } from '../lib/api';

const plans = [
  { id: 'free', popular: false },
  { id: 'starter', popular: false },
  { id: 'pro', popular: true },
  { id: 'unlimited', popular: false },
];

export default function PricingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (planId: string) => {
    if (planId === 'free') return;
    
    setLoading(planId);
    try {
      const { checkout_url } = await createCheckout(planId);
      window.location.href = checkout_url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to create checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('pricing.title')}</h1>
          <p className="text-xl text-surface-300">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${
                plan.popular ? 'border-primary-500 ring-2 ring-primary-500/20' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">
                  {t(`pricing.${plan.id}.name`)}
                </h3>
                <div className="text-3xl font-bold text-primary-400">
                  {t(`pricing.${plan.id}.price`)}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {(t(`pricing.${plan.id}.features`, { returnObjects: true }) as string[]).map(
                  (feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-surface-200">{feature}</span>
                    </li>
                  )
                )}
              </ul>

              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading === plan.id || plan.id === 'free'}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.id === 'free'
                    ? 'bg-surface-800 text-surface-300 cursor-default'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {loading === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : plan.id === 'free' ? (
                  t('pricing.currentPlan')
                ) : (
                  t('pricing.buyNow')
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
