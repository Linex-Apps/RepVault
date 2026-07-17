import 'dotenv/config';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const FIELDS = 'reviews.reviews.*,rating,userRatingCount';

// Simple in-memory rate limiter
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function getRateLimitState(placeId) {
  const now = Date.now();
  const entry = rateLimitStore.get(placeId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    const newEntry = { count: 1, windowStart: now };
    rateLimitStore.set(placeId, newEntry);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

/**
 * Normalize a Google Places API review into our standard format.
 */
function normalizeReview(review) {
  const author = review.authorAttribution || {};
  const text = review.text?.text || review.originalText?.text || '';

  return {
    reviewer_name: author.displayName || 'Anonymous',
    rating: review.rating || 0,
    text: text,
    date: review.publishTime || null,
    profile_url: author.uri || null,
    platform: 'google',
    platform_review_id: review.name || null,
  };
}

/**
 * Fetch reviews for a Google Place ID using the Places API (New).
 *
 * @param {string} placeId - Google Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4")
 * @param {object} [options]
 * @param {string} [options.languageCode] - Preferred language for reviews
 * @returns {Promise<{reviews: Array, placeRating: number|null, totalRatings: number|null}>}
 */
export async function fetchGoogleReviews(placeId, options = {}) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  // Rate limiting check
  const rateState = getRateLimitState(placeId);
  if (!rateState.allowed) {
    throw Object.assign(
      new Error(`Rate limited. Retry after ${rateState.retryAfter} seconds.`),
      { statusCode: 429, retryAfter: rateState.retryAfter }
    );
  }

  const fields = 'places.reviews,places.rating,places.userRatingCount';
  const url = `${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}?fields=${fields}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let errorMessage = `Google Places API error: ${response.status}`;

    if (response.status === 404) {
      errorMessage = 'Place not found. Check the place_id.';
    } else if (response.status === 403) {
      errorMessage = 'API key unauthorized. Ensure Places API is enabled and the key has access.';
    } else if (response.status === 400) {
      errorMessage = `Invalid request: ${errorBody}`;
    }

    throw Object.assign(new Error(errorMessage), { statusCode: response.status });
  }

  const data = await response.json();

  const rawReviews = data.reviews || [];
  const reviews = rawReviews.map(normalizeReview);

  return {
    reviews,
    placeRating: data.rating || null,
    totalRatings: data.userRatingCount || null,
  };
}

/**
 * Post a response to a Google review.
 * Note: The Google My Business API (now Business Profile API) is required for this.
 * This requires OAuth 2.0 with a verified business account.
 *
 * @param {string} reviewName - The full review resource name (e.g., "accounts/.../locations/.../reviews/...")
 * @param {string} responseText - The response text to post
 * @returns {Promise<object>}
 */
export async function postGoogleReviewResponse(reviewName, responseText) {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('GOOGLE_ACCESS_TOKEN environment variable is not set. OAuth 2.0 required for posting responses.');
  }

  const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ comment: { text: responseText } }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Failed to post response: ${response.status} — ${errorBody}`);
  }

  return await response.json();
}