import { Router } from 'express';
import { ensureProducts, createCheckoutSession, PRODUCTS } from '../services/stripe.js';

const router = Router();

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for a subscription.
 *
 * Body:
 *   { plan: 'monthly' | 'annual', successUrl: string, cancelUrl: string, customerEmail?: string, clientReferenceId?: string }
 *
 * Response: { sessionId: string, url: string }
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { plan, priceId, successUrl, cancelUrl, customerEmail, clientReferenceId } = req.body;

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'successUrl and cancelUrl are required' });
    }

    // Resolve price ID from plan name, or use provided priceId
    let resolvedPriceId = priceId;

    if (!resolvedPriceId && plan) {
      // Ensure our products exist (idempotent)
      const priceIds = await ensureProducts();

      if (plan === 'monthly') {
        resolvedPriceId = priceIds.monthly;
      } else if (plan === 'annual') {
        resolvedPriceId = priceIds.annual;
      } else {
        return res.status(400).json({ error: 'Invalid plan. Use "monthly" or "annual".' });
      }
    }

    if (!resolvedPriceId) {
      return res.status(400).json({ error: 'Either priceId or plan is required' });
    }

    const result = await createCheckoutSession({
      priceId: resolvedPriceId,
      successUrl,
      cancelUrl,
      customerEmail,
      clientReferenceId,
    });

    return res.json(result);
  } catch (err) {
    console.error('[Stripe] Error creating checkout session:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: err.message });
  }
});

/**
 * GET /api/stripe/products
 *
 * Returns the product catalog (prices and descriptions).
 */
router.get('/products', async (_req, res) => {
  try {
    const priceIds = await ensureProducts();
    return res.json({
      products: {
        monthly: {
          ...PRODUCTS.monthly,
          priceId: priceIds.monthly,
          priceDisplay: '$147/mo',
        },
        annual: {
          ...PRODUCTS.annual,
          priceId: priceIds.annual,
          priceDisplay: '$1,499/yr',
        },
      },
    });
  } catch (err) {
    console.error('[Stripe] Error fetching products:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;