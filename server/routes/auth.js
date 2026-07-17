import { Router } from 'express';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

const SALT_ROUNDS = 10;
const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Escape single quotes for SQL string literals.
 */
function escapeSql(val) {
  return (val || '').replace(/'/g, "''");
}

/**
 * Escape $ signs for shell double-quoted strings.
 * team-db commands pass SQL via double-quoted shell strings,
 * so $ must be escaped to prevent shell interpolation.
 */
function escapeShell(val) {
  return (val || '').replace(/\$/g, '\\$');
}

/**
 * Run a team-db SQL command and return parsed JSON result.
 */
function runSql(sql) {
  const escaped = escapeShell(sql);
  const output = execSync(`team-db "${escaped}"`, { stdio: 'pipe', timeout: 10000 });
  const text = output.toString().trim();
  if (!text) return [];
  return JSON.parse(text);
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({ error: 'email, password, and businessName are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (businessName.trim().length < 2) {
      return res.status(400).json({ error: 'Business name must be at least 2 characters' });
    }

    const safeEmail = escapeSql(email.toLowerCase());

    // Check for existing user
    const existing = runSql(`SELECT id FROM users WHERE email = '${safeEmail}'`);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create business + user records
    const businessId = randomUUID();
    const userId = randomUUID();
    const safeName = escapeSql(businessName);

    const bizSql = `INSERT INTO businesses (id, name, email) VALUES ('${businessId}', '${safeName}', '${safeEmail}')`;
    runSql(bizSql);

    const userSql = `INSERT INTO users (id, business_id, name, email, password_hash, subscription_status) VALUES ('${userId}', '${businessId}', '${safeName}', '${safeEmail}', '${escapeSql(passwordHash)}', 'trial')`;
    runSql(userSql);

    // Generate JWT
    const token = generateToken({ userId, email: email.toLowerCase(), businessId });

    // Set cookie
    res.cookie('token', token, TOKEN_COOKIE_OPTIONS);

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: businessName,
        businessId,
        subscriptionStatus: 'trial',
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const safeEmail = escapeSql(email.toLowerCase());
    const sql = `SELECT id, business_id, name, email, password_hash, subscription_status FROM users WHERE email = '${safeEmail}'`;
    const result = runSql(sql);

    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      businessId: user.business_id,
    });

    res.cookie('token', token, TOKEN_COOKIE_OPTIONS);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessId: user.business_id,
        subscriptionStatus: user.subscription_status,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  return res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  try {
    const { userId } = req.user;
    const sql = `SELECT u.id, u.email, u.name, u.business_id, u.subscription_status, b.name as business_name FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.id = '${escapeSql(userId)}'`;
    const result = runSql(sql);

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result[0];
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        businessId: user.business_id,
        businessName: user.business_name,
        subscriptionStatus: user.subscription_status,
      },
    });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

export default router;