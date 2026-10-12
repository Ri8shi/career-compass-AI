// middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * requireAuth — verifies JWT from HTTP-only cookie.
 * Attaches decoded { id, email, name } to req.user on success.
 */
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

/**
 * optionalAuth — same as requireAuth but doesn't block unauthenticated requests.
 * Attaches req.user if a valid token is present, otherwise req.user = null.
 */
export function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.clearCookie('token');
    req.user = null;
  }
  next();
}
