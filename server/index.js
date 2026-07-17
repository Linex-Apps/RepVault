import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import reviewsRoutes from './routes/reviews.js';
import settingsRoutes from './routes/settings.js';
import googleRoutes from './routes/google.js';
import aiRoutes from './routes/ai.js';
import stripeRoutes from './routes/stripe.js';
import { verifyWebhookSignature, handleWebhookEvent } from './services/stripe.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

// Stripe webhook — needs raw body for signature verification (register before JSON parser)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const event = verifyWebhookSignature(req.body, sig);
    const result = await handleWebhookEvent(event);
    return res.json({ received: true, ...result });
  } catch (err) {
    console.error('[Stripe] Webhook error:', err.message);
    return res.status(400).json({ error: err.message });
  }
});

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'repvault-api' });
});

app.listen(PORT, () => {
  console.log(`RepVault API server running on port ${PORT}`);
});