import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import path from 'node:path';
import { env } from './config.js';
import passport from './passport.js';
import { errorHandler, notFound, requireSameOrigin } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/properties.routes.js';
import orderRoutes from './routes/orders.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import inquiryRoutes from './routes/inquiries.routes.js';

const app = express();
const { Pool } = pg;
const sessionPool = new Pool({ connectionString: env.DATABASE_URL });
const PgSession = connectPgSimple(session);

app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

app.use(session({
  name: 'zillowelite.sid',
  store: new PgSession({ pool: sessionPool, tableName: 'user_sessions', createTableIfMissing: true }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(env.uploadDir, {
  fallthrough: false,
  maxAge: env.isProduction ? '7d' : 0,
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'zillowelite-api' }));
app.use('/api', requireSameOrigin);
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
