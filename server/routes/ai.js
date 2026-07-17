import { Router } from 'express';
import { draftResponse } from '../services/ai.js';

const router = Router();

/**
 * POST /api/ai/draft
 *
 * Draft an AI-generated response to a customer review.
 *
 * Body:
 *   { review_text: string, rating: number, tone?: 'Professional' | 'Friendly' | 'Grateful' }
 *
 * Response:
 *   { draft: string, model: string, usage: object }
 */
router.post('/draft', async (req, res) => {
  const { review_text, rating, tone } = req.body;

  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: 'rating is required (1-5)' });
  }

  const safeRating = Math.round(Number(rating));
  if (isNaN(safeRating) || safeRating < 1 || safeRating > 5) {
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  }

  // review_text is optional — we can draft without it based on rating alone
  if (review_text !== undefined && review_text !== null && typeof review_text !== 'string') {
    return res.status(400).json({ error: 'review_text must be a string' });
  }

  try {
    const result = await draftResponse({
      review_text: review_text || '',
      rating: safeRating,
      tone,
    });

    return res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error('[AI] Error drafting response:', err.message);

    return res.status(statusCode).json({
      error: err.message,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
    });
  }
});

export default router;