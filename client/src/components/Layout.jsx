import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/settings', label: 'Settings' },
];

/**
 * Decode a JWT token's payload (without verification).
 * Returns null if the token is missing or invalid.
 */
function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem('token');
  const user = decodeToken(token);

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  const handleLogout = async () => {
    try {
      // Notify the server (best-effort)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore — server cleanup is optional
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
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

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition ${
                  location.pathname === item.path
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* User menu */}
            <div className="relative ml-4 border-l border-gray-200 pl-4">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {initials}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900">{user?.email || 'User'}</p>
                      <p className="text-xs text-gray-400">
                        {user?.businessId ? `Business: ${user.businessId.substring(0, 8)}...` : 'Signed in'}
                      </p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                    >
                      Settings
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                    >
                      Back to site
                    </Link>
                    <hr className="my-1 border-gray-50" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}