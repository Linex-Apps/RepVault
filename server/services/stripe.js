import 'dotenv/config';
import Stripe from 'stripe';

let stripeInstance = null;

function getStripe() {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripeInstance = new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });
  }
  return stripeInstance;
}

// Product configuration
export const PRODUCTS = {
  monthly: {
    name: 'RepVault Pro',
    description: 'AI Review & Reputation Manager — monthly plan',
    price: 14700, // $147.00 in cents
    interval: 'month',
    lookupKey: 'repvault-pro-monthly',
  },
  annual: {
    name: 'RepVault Pro Annual',
    description: 'AI Review & Reputation Manager — annual plan (2 months free)',
    price: 149900, // $1,499.00 in cents
    interval: 'year',
    lookupKey: 'repvault-pro-annual',
  },
};

/**
 * Ensure Stripe products and prices exist with recurring subscription intervals.
 * Creates them if they don't already exist (idempotent — tries lookup_key first,
 * then searches by product name).
 *
 * The following price IDs were created as one-time references:
 *   Monthly: price_1TtBVVDJeVKa6LmHNbipX3Nd ($147)
 *   Annual:  price_1TtBVWDJeVKa6LmHulbYKOBC ($1,499)
 *
 * This function creates new RECURRING prices for subscription checkout.
 *
 * @returns {Promise<{ monthlyPriceId: string, annualPriceId: string }>}
 */
export async function ensureProducts() {
  const stripe = getStripe();
  const priceIds = {};

  for (const [key, config] of Object.entries(PRODUCTS)) {
    // 1. Try to find existing price by lookup key
    const existingPrices = await stripe.prices.list({
      lookup_keys: [config.lookupKey],
      limit: 1,
      active: true,
    });

    if (existingPrices.data.length > 0) {
      priceIds[key] = existingPrices.data[0].id;
      console.log(`[Stripe] Found existing price for ${config.name}: ${existingPrices.data[0].id}`);
      continue;
    }

    // 2. Try to find an existing product by name to avoid duplicates
    const existingProducts = await stripe.products.list({
      active: true,
      limit: 100,
    });
    const existingProduct = existingProducts.data.find(
      (p) => p.name === config.name
    );

    let productId;
    if (existingProduct) {
      productId = existingProduct.id;
      console.log(`[Stripe] Found existing product "${config.name}": ${productId}`);
    } else {
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
      });
      productId = product.id;
      console.log(`[Stripe] Created product "${config.name}": ${productId}`);
    }

    // 3. Create a recurring price for this product
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: config.price,
      currency: 'usd',
      recurring: { interval: config.interval },
      lookup_key: config.lookupKey,
    });

    priceIds[key] = price.id;
    console.log(`[Stripe] Created recurring price for "${config.name}": ${price.id}`);
  }

  return priceIds;
}

/**
 * Create a Stripe Checkout Session for a subscription.
 *
 * @param {object} params
 * @param {string} params.priceId - Stripe Price ID
 * @param {string} params.successUrl - Redirect URL on success
 * @param {string} params.cancelUrl - Redirect URL on cancel
 * @param {string} params.customerEmail - Customer email (optional, for prefill)
 * @param {string} params.clientReferenceId - Your internal user/business ID
 * @returns {Promise<{ sessionId: string, url: string }>}
 */
export async function createCheckoutSession({ priceId, successUrl, cancelUrl, customerEmail, clientReferenceId }) {
  const stripe = getStripe();

  if (!priceId) throw new Error('priceId is required');
  if (!successUrl) throw new Error('successUrl is required');
  if (!cancelUrl) throw new Error('cancelUrl is required');

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      client_reference_id: clientReferenceId || '',
    },
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  if (clientReferenceId) {
    sessionParams.client_reference_id = clientReferenceId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Verify a Stripe webhook signature and parse the event.
 *
 * @param {string} body - Raw request body (as string or Buffer)
 * @param {string} signature - Stripe-Signature header value
 * @returns {object} Parsed Stripe event
 */
export function verifyWebhookSignature(body, signature) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Handle a Stripe webhook event and update the database accordingly.
 *
 * @param {object} event - Parsed Stripe event
 * @returns {Promise<{ handled: boolean, message: string }>}
 */
export async function handleWebhookEvent(event) {
  const { execSync } = await import('child_process');

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;
      const customerEmail = session.customer_details?.email || '';
      const clientRefId = session.client_reference_id || session.metadata?.client_reference_id || '';

      console.log(`[Stripe] Checkout completed: customer=${customerId}, email=${customerEmail}`);

      // Update the user's stripe_customer_id and subscription_status
      if (customerEmail) {
        const safeEmail = customerEmail.replace(/'/g, "''");
        const sql = `UPDATE users SET stripe_customer_id = '${customerId}', subscription_status = 'active' WHERE email = '${safeEmail}'`;
        try {
          execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });
          console.log(`[Stripe] Updated subscription for ${customerEmail} to active`);
        } catch (err) {
          console.error(`[Stripe] Failed to update user ${customerEmail}:`, err.message);
        }
      }

      return { handled: true, message: `Checkout completed for customer ${customerId}` };
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log(`[Stripe] Subscription deleted: customer=${customerId}`);

      // Update the user's subscription_status to 'canceled'
      try {
        const sql = `UPDATE users SET subscription_status = 'canceled' WHERE stripe_customer_id = '${customerId}'`;
        execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });
      } catch (err) {
        console.error(`[Stripe] Failed to cancel subscription for ${customerId}:`, err.message);
      }

      return { handled: true, message: `Subscription canceled for customer ${customerId}` };
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      console.log(`[Stripe] Payment failed: customer=${customerId}`);

      // Update the user's subscription_status to 'past_due'
      try {
        const sql = `UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = '${customerId}'`;
        execSync(`team-db "${sql}"`, { stdio: 'pipe', timeout: 10000 });
      } catch (err) {
        console.error(`[Stripe] Failed to update payment status for ${customerId}:`, err.message);
      }

      return { handled: true, message: `Payment failed for customer ${customerId}` };
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
      return { handled: false, message: `Unhandled event type: ${event.type}` };
  }
}