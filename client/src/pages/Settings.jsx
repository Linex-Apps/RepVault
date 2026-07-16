import { useState } from 'react';

export default function Settings() {
  const [businessName, setBusinessName] = useState('Smith & Co. Dentistry');
  const [placeId, setPlaceId] = useState('ChIJN1t_tDeuEmsRUsoyG83frY4');
  const [responseTone, setResponseTone] = useState('professional');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // TODO: Save settings via API
    // await fetch('/api/business/{id}/settings', { method: 'PUT', body: JSON.stringify({ businessName, placeId, responseTone }) });
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business profile and preferences</p>
      </div>

      {/* Business Profile */}
      <form onSubmit={handleSave} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your business information for review monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="placeId" className="block text-sm font-medium text-gray-700">
              Google Place ID
            </label>
            <input
              id="placeId"
              type="text"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJ..."
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-400">Find your Place ID on the <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Google Places API page</a></p>
          </div>
        </div>

        {/* Connected Accounts */}
        <hr className="border-gray-100" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Link your platforms to start monitoring reviews</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Google Business Profile</p>
                <p className="text-xs text-gray-500">Not connected</p>
              </div>
            </div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-800">
              Connect
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Facebook Page</p>
                <p className="text-xs text-gray-500">Not connected</p>
              </div>
            </div>
            <button className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-800">
              Connect
            </button>
          </div>
        </div>

        {/* AI Response Settings */}
        <hr className="border-gray-100" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Response Settings</h2>
          <p className="text-sm text-gray-500 mt-0.5">Customize how AI drafts your review responses</p>
        </div>

        <div className="max-w-xs">
          <label htmlFor="responseTone" className="block text-sm font-medium text-gray-700">
            Response Tone
          </label>
          <select
            id="responseTone"
            value={responseTone}
            onChange={(e) => setResponseTone(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="grateful">Grateful</option>
            <option value="warm">Warm &amp; Personal</option>
            <option value="formal">Formal</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Saved successfully
            </span>
          )}
        </div>
      </form>

      {/* Subscription Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your RepVault plan</p>
          </div>
          <a
            href="/pricing"
            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-500"
          >
            Upgrade
          </a>
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Current Plan</p>
            <p className="text-sm text-gray-500">Free Trial — 14 days remaining</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Trial
          </span>
        </div>
      </div>
    </div>
  );
}