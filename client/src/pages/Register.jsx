import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const labels = {
    0: 'Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
    5: 'Very Strong',
  };

  const colors = {
    0: 'bg-red-400',
    1: 'bg-red-400',
    2: 'bg-amber-400',
    3: 'bg-yellow-400',
    4: 'bg-lime-400',
    5: 'bg-emerald-400',
  };

  const textColors = {
    0: 'text-red-600',
    1: 'text-red-600',
    2: 'text-amber-600',
    3: 'text-yellow-600',
    4: 'text-lime-600',
    5: 'text-emerald-600',
  };

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= score ? colors[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${textColors[score]}`}>
          {labels[score]}
        </p>
        <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries({
            length: '8+ chars',
            upper: 'A-Z',
            lower: 'a-z',
            number: '0-9',
            special: '!@#$%',
          }).map(([key, label]) => (
            <li
              key={key}
              className={`text-xs ${
                checks[key] ? 'text-emerald-600' : 'text-gray-300'
              }`}
            >
              {checks[key] ? '✓' : '○'} {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          businessName: form.businessName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <svg viewBox="0 0 200 200" className="h-10 w-10" fill="none">
              <path d="M100 15L180 52V98C180 148.5 143.75 188 100 200C56.25 188 20 148.5 20 98V52L100 15Z" fill="url(#g)" />
              <path d="M100 55L112 88L145 88L118 108L127 140L100 118L73 140L82 108L55 88L88 88L100 55Z" fill="white" />
              <defs>
                <linearGradient id="g" x1="20" y1="15" x2="180" y2="200">
                  <stop stopColor="#1e3a5f" />
                  <stop offset="1" stopColor="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Rep<span className="text-teal-600">Vault</span>
            </span>
          </Link>
          <p className="text-gray-500">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg shadow-teal-100/30 rounded-xl p-6 space-y-4 border border-gray-100">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={updateField('fullName')}
              placeholder="John Smith"
              disabled={loading}
              autoComplete="name"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={updateField('email')}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={updateField('password')}
              placeholder="Create a strong password"
              disabled={loading}
              autoComplete="new-password"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            />
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name</label>
            <input
              id="businessName"
              type="text"
              required
              value={form.businessName}
              onChange={updateField('businessName')}
              placeholder="Smith &amp; Co. Dentistry"
              disabled={loading}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating account...
              </span>
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 transition">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          Free 14-day trial. No credit card required.
        </p>
      </div>
    </div>
  );
}