import { env } from '../config.js';

export function requireAuth(req, res, next) {
  if (!req.isAuthenticated?.() || !req.user) return res.status(401).json({ error: 'Sign in is required.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.isAuthenticated?.() || req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Administrator access is required.' });
  next();
}

export function requireBuyer(req, res, next) {
  if (!req.isAuthenticated?.() || req.user?.role !== 'BUYER') return res.status(403).json({ error: 'A signed-in buyer account is required.' });
  next();
}

export function requireSameOrigin(req, res, next) {
  if (req.originalUrl.split('?')[0] === '/api/payments/nowpayments/ipn') return next();
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin !== env.clientUrl) return res.status(403).json({ error: 'Request origin is not allowed.' });
  next();
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.name === 'MulterError') {
    const status = error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_FILE_COUNT' ? 400 : 400;
    return res.status(status).json({ error: error.message });
  }
  if (error?.name === 'ZodError') return res.status(400).json({ error: 'Invalid request data.', details: error.issues });
  if (error?.code === 'P2002') return res.status(409).json({ error: 'A record with that value already exists.' });
  if (error?.code === 'P2025') return res.status(404).json({ error: 'Record not found.' });
  if (error?.status && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
}
