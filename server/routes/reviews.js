import { Router } from 'express';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import { fetchGoogleReviews, storeReviews } from '../services/google.js';

const router = Router();

/**
 * GET /api/reviews/fetch/:placeId
 *
 * Fetch reviews from Google Places API and store in the database.
 * Query params:
 *   - businessId (required): UUID of the business to associate reviews with
 *
 * Response: { reviews: [...], placeRating, totalRatings, stored: number }
 */
router.get('/fetch/:placeId', async (req, res) => {
  const { placeId } = req.params;
  const { businessId } = req.query;

  if (!placeId || placeId.trim().length === 0) {
    return res.status(400).json({ error: 'placeId is required' });
  }

  if (!businessId) {
    return res.status(400).json({ error: 'businessId query parameter is required' });
  }

  // Validate placeId format
  if (!/^[-a-zA-Z0-9_]+$/.test(placeId)) {
    return res.status(400).json({ error: 'Invalid place_id format' });
  }

  try {
    // Fetch from Google Places API
    const result = await fetchGoogleReviews(placeId);

    // Store reviews in database
    await storeReviews(businessId, result.reviews, placeId);

    return res.json({
      reviews: result.reviews,
      placeRating: result.placeRating,
      totalRatings: result.totalRatings,
      stored: result.reviews.length,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error(`[Reviews] Error fetching reviews for ${placeId}:`, err.message);

    return res.status(statusCode).json({
      error: err.message,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    });
  }
});

/**
 * GET /api/reviews/:businessId
 *
 * Return all reviews for a given business from the database.
 *
 * Query params:
 *   - platform (optional): filter by 'google' or 'facebook'
 *   - limit (optional): max results (default 50)
 *   - offset (optional): pagination offset (default 0)
 *
 * Response: { reviews: [...], total, limit, offset }
 */
router.get('/:businessId', (req, res) => {
  const { businessId } = req.params;
  const { platform, limit = '50', offset = '0' } = req.query;

  if (!businessId || businessId.trim().length === 0) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    let whereClause = `business_id = '${businessId.replace(/'/g, "''")}'`;

    if (platform && ['google', 'facebook'].includes(platform)) {
      whereClause += ` AND platform = '${platform}'`;
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const countSql = `SELECT COUNT(*) AS total FROM reviews WHERE ${whereClause}`;
    const countResult = JSON.parse(execSync(`team-db "${countSql}"`, { stdio: 'pipe', timeout: 10000 }).toString());
    const total = countResult[0]?.total || 0;

    const dataSql = `SELECT id, business_id, platform, reviewer_name, rating, text, review_date, url, created_at FROM reviews WHERE ${whereClause} ORDER BY review_date DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    const dataResult = JSON.parse(execSync(`team-db "${dataSql}"`, { stdio: 'pipe', timeout: 10000 }).toString());

    return res.json({
      reviews: dataResult || [],
      total,
      limit: safeLimit,
      offset: safeOffset,
    });
  } catch (err) {
    console.error(`[Reviews] Error fetching reviews for business ${businessId}:`, err.message);
    return res.status(500).json({ error: 'Failed to fetch reviews from database' });
  }
});

/**
 * GET /api/reviews — list all reviews (legacy, returns from DB)
 */
router.get('/', (req, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const countSql = 'SELECT COUNT(*) AS total FROM reviews';
    const countResult = JSON.parse(execSync(`team-db "${countSql}"`, { stdio: 'pipe', timeout: 10000 }).toString());
    const total = countResult[0]?.total || 0;

    const dataSql = `SELECT id, business_id, platform, reviewer_name, rating, text, review_date, url, created_at FROM reviews ORDER BY review_date DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    const dataResult = JSON.parse(execSync(`team-db "${dataSql}"`, { stdio: 'pipe', timeout: 10000 }).toString());

    return res.json({ reviews: dataResult || [], total, limit: safeLimit, offset: safeOffset });
  } catch (err) {
    console.error('[Reviews] Error listing reviews:', err.message);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews/:id/respond
 *
 * Save an AI-drafted or manual response to the `responses` table with status 'pending'.
 *
 * Body: { response: string }
 */
router.post('/:id/respond', (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (!response || response.trim().length === 0) {
    return res.status(400).json({ error: 'Response text is required' });
  }

  if (response.length > 500) {
    return res.status(400).json({ error: 'Response must be under 500 characters' });
  }

  try {
    const responseId = randomUUID();
    const safeResponse = response.replace(/'/g, "''");
    const safeReviewId = id.replace(/'/g, "''");

    const sql = `INSERT INTO responses (id, review_id, draft_text, status, created_at) VALUES ('${responseId}', '${safeReviewId}', '${safeResponse}', 'pending', datetime('now'))`;
    execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });

    return res.json({
      message: 'Response saved as pending',
      responseId,
      reviewId: id,
      status: 'pending',
    });
  } catch (err) {
    console.error('[Reviews] Error saving response:', err.message);
    return res.status(500).json({ error: 'Failed to save response' });
  }
});

/**
 * POST /api/reviews/:id/approve
 */
router.post('/:id/approve', (req, res) => {
  const { id } = req.params;

  try {
    const sql = `UPDATE reviews SET approved = 1 WHERE id = '${id.replace(/'/g, "''")}'`;
    execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });
    return res.json({ message: `Review ${id} approved` });
  } catch (err) {
    console.error(`[Reviews] Error approving review:`, err.message);
    return res.status(500).json({ error: 'Failed to approve review' });
  }
});

export default router;