import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { env, corsOrigins } from './config/env.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { smsRouter } from './modules/sms/sms.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';

export const app = express();
const allowedOrigins = new Set(corsOrigins);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  clerkMiddleware({
    secretKey: env.CLERK_SECRET_KEY,
    authorizedParties: [...allowedOrigins]
  })
);
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'SmartExpense AI API' }));
app.use('/api/auth', authRouter);
app.use('/api/sms', smsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);

app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: err.issues });
  }
  const status = err.status ?? 500;
  if (status === 500 && env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message });
});
