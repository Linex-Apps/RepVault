import { useState } from 'react';

// ─── Mock Data ───────────────────────────────────────────────────────────────
// TODO: Replace with real API calls
const MOCK_REVIEWS = [
  {
    id: 'rev-1',
    reviewer_name: 'Sarah M.',
    rating: 5,
    platform: 'google',
    text: 'Amazing service! The team was incredibly professional and finished the job ahead of schedule. Would highly recommend to anyone looking for quality work.',
    review_date: '2026-07-13T14:30:00Z',
    response_text: null,
    response_status: 'pending',
  },
  {
    id: 'rev-2',
    reviewer_name: 'James T.',
    rating: 4,
    platform: 'facebook',
    text: 'Great experience overall. Very responsive and easy to work with. Only minor hiccup with scheduling but they handled it well.',
    review_date: '2026-07-12T10:15:00Z',
    response_text: null,
    response_status: 'pending',
  },
  {
    id: 'rev-3',
    reviewer_name: 'Maria G.',
    rating: 5,
    platform: 'google',
    text: 'Best in town! I\'ve been a customer for years and they never disappoint. The attention to detail is unmatched.',
    review_date: '2026-07-11T09:00:00Z',
    response_text: 'Thank you so much, Maria! We really appreciate your continued trust in us. It means the world to our team.',
    response_status: 'approved',
  },
  {
    id: 'rev-4',
    reviewer_name: 'Robert K.',
    rating: 3,
    platform: 'google',
    text: 'Decent work but the pricing was a bit higher than quoted. Communication could have been better throughout the process.',
    review_date: '2026-07-10T16:45:00Z',
    response_text: null,
    response_status: 'pending',
  },
  {
    id: 'rev-5',
    reviewer_name: 'Lisa P.',
    rating: 5,
    platform: 'facebook',
    text: 'Absolutely love my results! The team really listened to what I wanted and delivered beyond expectations.',
    review_date: '2026-07-09T11:20:00Z',
    response_text: 'Thank you, Lisa! We\'re so glad you love the results. It was a pleasure working with you!',
    response_status: 'published',
  },
  {
    id: 'rev-6',
    reviewer_name: 'David N.',
    rating: 5,
    platform: 'google',
    text: 'Professional, punctual, and polite. Everything you want in a service provider. Will definitely use again.',
    review_date: '2026-07-08T08:30:00Z',
    response_text: 'Thanks David! We look forward to working with you again.',
    response_status: 'published',
  },
  {
    id: 'rev-7',
    reviewer_name: 'Angela W.',
    rating: 2,
    platform: 'google',
    text: 'Unfortunately not the best experience. There were delays and the final result wasn\'t what we discussed. Hoping they can make it right.',
    review_date: '2026-07-07T13:10:00Z',
    response_text: null,
    response_status: 'pending',
  },
  {
    id: 'rev-8',
    reviewer_name: 'Tom H.',
    rating: 4,
    platform: 'facebook',
    text: 'Good value for the price. Would have given 5 stars if the turnaround was a bit faster. Overall happy with the service.',
    review_date: '2026-07-06T15:00:00Z',
    response_text: null,
    response_status: 'pending',
  },
];

const MOCK_AI_DRAFT = "Thank you for your review, {name}! We appreciate your feedback and are glad you had a positive experience with us. Your satisfaction is our top priority, and we look forward to serving you again in the future.";

// ─── Components ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    published: 'Published',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.pending}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'published' ? 'bg-emerald-500' : status === 'approved' ? 'bg-blue-500' : 'bg-amber-500'}`} />
      {labels[status] || status}
    </span>
  );
}

function PlatformIcon({ platform }) {
  if (platform === 'google') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function ReviewCard({ review, onDraftResponse, onApprove, onPublish, expandedId, setExpandedId }) {
  const isExpanded = expandedId === review.id;
  const isUnreplied = !review.response_text || review.response_status === 'pending';

  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Review content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 truncate">{review.reviewer_name}</span>
              <PlatformIcon platform={review.platform} />
              <span className="text-xs text-gray-400">{review.platform === 'google' ? 'Google' : 'Facebook'}</span>
              <StatusBadge status={review.response_status || 'pending'} />
            </div>
            <div className="mt-1">
              <StarRating rating={review.rating} />
            </div>
            <p className="mt-1.5 text-sm text-gray-600">{review.text}</p>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(review.review_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {isUnreplied && (
              <button
                onClick={() => onDraftResponse(review.id)}
                className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
              >
                Draft Response
              </button>
            )}
            {review.response_text && (
              <button
                onClick={() => setExpandedId(isExpanded ? null : review.id)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition"
              >
                {isExpanded ? 'Hide Draft' : 'View Draft'}
              </button>
            )}
          </div>
        </div>

        {/* Expanded: AI Response Preview */}
        {isExpanded && review.response_text && (
          <div className="mt-4 ml-0 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                AI Draft
              </span>
              <span className="text-xs text-gray-400">— review and approve</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{review.response_text}</p>
            <div className="mt-3 flex items-center gap-2">
              {review.response_status === 'pending' && (
                <button
                  onClick={() => onApprove(review.id)}
                  className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
                >
                  Approve & Publish
                </button>
              )}
              {review.response_status === 'approved' && (
                <button
                  onClick={() => onPublish(review.id)}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
                >
                  Publish Now
                </button>
              )}
              {review.response_status === 'published' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Published
                </span>
              )}
              <button className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [expandedId, setExpandedId] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null);

  // TODO: Replace mock data with API calls
  // async function loadReviews() {
  //   const res = await fetch('/api/reviews/{businessId}?limit=100');
  //   const data = await res.json();
  //   setReviews(data.reviews);
  // }

  const handleDraftResponse = async (reviewId) => {
    setGeneratingFor(reviewId);
    // TODO: Call AI drafting API
    // const res = await fetch('/api/reviews/{reviewId}/draft', { method: 'POST' });
    // const data = await res.json();
    await new Promise((r) => setTimeout(r, 1000));

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              response_text: MOCK_AI_DRAFT.replace('{name}', r.reviewer_name),
              response_status: 'pending',
            }
          : r
      )
    );
    setGeneratingFor(null);
    setExpandedId(reviewId);
  };

  const handleApprove = (reviewId) => {
    // TODO: Call API to mark as approved
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, response_status: 'approved' } : r
      )
    );
  };

  const handlePublish = (reviewId) => {
    // TODO: Call API to publish response
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, response_status: 'published' } : r
      )
    );
  };

  // Stats
  const totalReviews = reviews.length;
  const pendingResponses = reviews.filter((r) => !r.response_text || r.response_status === 'pending').length;
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1);
  const publishedCount = reviews.filter((r) => r.response_status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and respond to your reviews</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Last synced: just now
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalReviews}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Pending Responses</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingResponses}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
            <span className="text-amber-400">
              <StarRating rating={Math.round(parseFloat(avgRating))} size="md" />
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Published</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{publishedCount}</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          <div className="flex items-center gap-2">
            <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500">
              <option>All Reviews</option>
              <option>Unreplied</option>
              <option>Google</option>
              <option>Facebook</option>
            </select>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.08 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="mt-4 text-sm text-gray-500">No reviews yet. Connect your Google Business Profile to get started.</p>
          </div>
        ) : (
          <div>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onDraftResponse={handleDraftResponse}
                onApprove={handleApprove}
                onPublish={handlePublish}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </div>
        )}

        {/* TODO: Pagination */}
        {reviews.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">Showing {reviews.length} reviews</span>
            <button className="text-xs font-medium text-teal-600 hover:text-teal-500 transition">
              View all reviews
            </button>
          </div>
        )}
      </div>

      {/* Loading indicator for AI draft generation */}
      {generatingFor && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-gray-900 px-5 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm font-medium text-white">AI is drafting a response...</span>
          </div>
        </div>
      )}
    </div>
  );
}