import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'repvault-dev-secret-change-in-production';

/**
 * Generate a JWT token for a user.
 *
 * @param {object} payload - { userId, email, businessId }
 * @returns {string} Signed JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Express middleware — verifies the JWT token from the Authorization header
 * or cookie, attaches `req.user` if valid.
 *
 * Usage: router.use(requireAuth);
 *        router.get('/protected', requireAuth, handler);
 */
export function requireAuth(req, res, next) {
  try {
    // Check Authorization header first, then cookie
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Optional auth — attaches req.user if token is present, but doesn't
 * block unauthenticated requests.
 */
export function optionalAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}