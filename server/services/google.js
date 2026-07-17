import 'dotenv/config';
import { randomUUID } from 'crypto';

const PLACES_API_BASE = 'https://places.googleapis.com/v1';

// Simple in-memory rate limiter
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

function checkRateLimit(placeId) {
  const now = Date.now();
  const entry = rateLimitStore.get(placeId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(placeId, { count: 1, windowStart: now });
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
 * Fetch reviews from the Google Places API (New) for a given Place ID.
 *
 * @param {string} placeId - Google Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4")
 * @returns {Promise<{reviews: Array, placeRating: number|null, totalRatings: number|null}>}
 */
export async function fetchGoogleReviews(placeId) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GOOGLE_API_KEY environment variable is not set'), { statusCode: 500 });
  }

  // Rate limiting
  const rateState = checkRateLimit(placeId);
  if (!rateState.allowed) {
    throw Object.assign(
      new Error(`Rate limited. Retry after ${rateState.retryAfter} seconds.`),
      { statusCode: 429, retryAfter: rateState.retryAfter }
    );
  }

  const fields = 'reviews,rating,userRatingCount';
  const url = `${PLACES_API_BASE}/places/${encodeURIComponent(placeId)}?fields=${fields}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    if (response.status === 404) {
      throw Object.assign(new Error('Place not found. Check the place_id.'), { statusCode: 404 });
    }
    if (response.status === 403) {
      throw Object.assign(new Error('API key unauthorized. Enable Places API in Google Cloud Console.'), { statusCode: 403 });
    }
    if (response.status === 400) {
      throw Object.assign(new Error(`Invalid request: ${errorBody}`), { statusCode: 400 });
    }
    throw Object.assign(new Error(`Google Places API error: ${response.status}`), { statusCode: response.status });
  }

  const data = await response.json();
  const rawReviews = data.reviews || [];

  // Normalize reviews to our standard format
  const reviews = rawReviews.map((r) => {
    const author = r.authorAttribution || {};
    return {
      platform_review_id: r.name || null,
      reviewer_name: author.displayName || 'Anonymous',
      rating: r.rating || 0,
      text: r.text?.text || r.originalText?.text || '',
      date: r.publishTime || null,
      profile_url: author.uri || null,
    };
  });

  return {
    reviews,
    placeRating: data.rating || null,
    totalRatings: data.userRatingCount || null,
  };
}

/**
 * Store fetched reviews in the reviews table via team-db.
 *
 * @param {string} businessId - UUID of the business in our database
 * @param {Array} reviews - Array of normalized review objects from fetchGoogleReviews
 * @param {string} placeId - The Google Place ID used for fetching
 */
export async function storeReviews(businessId, reviews, placeId) {
  const { execSync } = await import('child_process');

  for (const review of reviews) {
    const id = randomUUID();
    const platform = 'google';
    // Escape single quotes in text for SQL
    const safeText = (review.text || '').replace(/'/g, "''");
    const safeReviewer = (review.reviewer_name || 'Anonymous').replace(/'/g, "''");
    const reviewDate = review.date || new Date().toISOString();
    const url = review.profile_url || '';

    const sql = `INSERT OR IGNORE INTO reviews (id, business_id, platform, reviewer_name, rating, text, review_date, url, created_at) VALUES ('${id}', '${businessId}', '${platform}', '${safeReviewer}', ${review.rating}, '${safeText}', '${reviewDate}', '${url}', datetime('now'))`;

    try {
      execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });
    } catch (err) {
      console.error(`[google.js] Failed to store review: ${err.message}`);
      // Continue storing remaining reviews
    }
  }
}

/**
 * Post a response to a Google review via My Business API (OAuth 2.0 required).
 */
export async function postGoogleReviewResponse(reviewName, responseText) {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) {
    throw Object.assign(
      new Error('GOOGLE_ACCESS_TOKEN environment variable is not set. OAuth 2.0 required for posting responses.'),
      { statusCode: 500 }
    );
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