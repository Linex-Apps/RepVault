import { Router } from 'express';
import { fetchGoogleReviews, postGoogleReviewResponse } from '../services/googleReviews.js';

const router = Router();

/**
 * GET /api/google/reviews/:placeId
 *
 * Fetch reviews for a Google Place ID.
 *
 * Query params:
 *   - languageCode (optional): preferred language (e.g., "en", "es")
 *
 * Response:
 *   {
 *     reviews: Array<{ reviewer_name, rating, text, date, profile_url, platform, platform_review_id }>,
 *     placeRating: number | null,
 *     totalRatings: number | null
 *   }
 */
router.get('/reviews/:placeId', async (req, res) => {
  const { placeId } = req.params;
  const { languageCode } = req.query;

  if (!placeId || placeId.trim().length === 0) {
    return res.status(400).json({ error: 'placeId is required' });
  }

  // Basic validation — Google Place IDs start with "ChIJ" or similar prefixes
  if (!/^[-a-zA-Z0-9_]+$/.test(placeId)) {
    return res.status(400).json({ error: 'Invalid place_id format' });
  }

  try {
    const result = await fetchGoogleReviews(placeId, { languageCode });
    return res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Failed to fetch reviews';

    console.error(`[GoogleReviews] Error fetching reviews for ${placeId}:`, err.message);

    return res.status(statusCode).json({
      error: message,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    });
  }
});

/**
 * POST /api/google/reviews/reply
 *
 * Post a reply to a Google review (requires OAuth 2.0 with Business Profile API).
 *
 * Body:
 *   { reviewName: string, responseText: string }
 */
router.post('/reviews/reply', async (req, res) => {
  const { reviewName, responseText } = req.body;

  if (!reviewName || reviewName.trim().length === 0) {
    return res.status(400).json({ error: 'reviewName is required' });
  }

  if (!responseText || responseText.trim().length === 0) {
    return res.status(400).json({ error: 'responseText is required' });
  }

  if (responseText.length > 4096) {
    return res.status(400).json({ error: 'Response text exceeds 4096 character limit' });
  }

  try {
    const result = await postGoogleReviewResponse(reviewName, responseText);
    return res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error(`[GoogleReviews] Error posting reply:`, err.message);
    return res.status(statusCode).json({ error: err.message });
  }
});

export default router;