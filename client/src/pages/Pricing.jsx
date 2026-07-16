import { useState } from 'react';
import { Link } from 'react-router-dom';

const PLANS = {
  monthly: { id: 'monthly', name: 'Monthly', price: '$147', period: '/mo', description: 'Perfect for getting started', popular: false },
  annual: { id: 'annual', name: 'Annual', price: '$1,499', period: '/yr', description: 'Best value — save $265', popular: true },
};

const CHECKOUT_LINKS = {
  monthly: 'https://buy.stripe.com/cNi4gzbQ40rqbvr6sm2Ry0g',
  annual: 'https://buy.stripe.com/28E9AT07m7TS9njbMG2Ry0g',
};

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  const handleCheckout = (plan) => {
    setLoading(plan);
    // Redirect directly to Stripe Payment Link
    window.location.href = CHECKOUT_LINKS[plan];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to home
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 200 200" className="h-8 w-8" fill="none">
              <path d="M100 15L180 52V98C180 148.5 143.75 188 100 200C56.25 188 20 148.5 20 98V52L100 15Z" fill="url(#g)" />
              <path d="M100 55L112 88L145 88L118 108L127 140L100 118L73 140L82 108L55 88L88 88L100 55Z" fill="white" />
              <defs>
                <linearGradient id="g" x1="20" y1="15" x2="180" y2="200">
                  <stop stopColor="#1e3a5f" />
                  <stop offset="1" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Rep<span className="text-teal-600">Vault</span>
            </span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-gray-500">
            AI-powered review management for your local service business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-md ${
                plan.popular ? 'border-teal-500 shadow-teal-100' : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Auto-monitor Google & Facebook reviews',
                    'AI-drafted response suggestions',
                    'One-click approval & publish',
                    'Reputation dashboard & insights',
                    plan.id === 'annual' ? 'Priority support' : 'Email support',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`mt-8 w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-teal-600 text-white hover:bg-teal-500 disabled:bg-teal-400 shadow-sm'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 disabled:bg-gray-200 border border-gray-200'
                  } disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? 'Redirecting...' : `Subscribe ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <p className="mt-4">
            <Link to="/app/register" className="text-sm font-medium text-teal-600 hover:text-teal-500 transition">
              Start your free trial →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}