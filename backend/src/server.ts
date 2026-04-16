import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import simulationRoutes from './routes/simulationRoutes';
import tripRoutes from './routes/tripRoutes';
import stripeRoutes from './routes/stripeRoutes';
import destinationRoutes from './routes/destinationRoutes';
import { handleWebhook } from './controllers/stripeController';
import { startPriceAlertCron } from './services/priceAlertJob';

const app = express();

// Stripe webhook needs raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:3000',
  'https://smartbudget-travel.netlify.app',
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (/^https:\/\/[a-z0-9-]+--smartbudget-travel\.netlify\.app$/.test(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', simulationRoutes);
app.use('/api', tripRoutes);
app.use('/api', stripeRoutes);
app.use('/api', destinationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    keys: {
      serpapi: env.SERPAPI_KEY ? `${env.SERPAPI_KEY.length}c` : 'MISSING',
      rapidapi: env.RAPIDAPI_KEY ? `${env.RAPIDAPI_KEY.length}c` : 'MISSING',
      openai: env.OPENAI_API_KEY ? `${env.OPENAI_API_KEY.length}c` : 'MISSING',
      amadeus: env.AMADEUS_CLIENT_ID ? `${env.AMADEUS_CLIENT_ID.length}c` : 'MISSING',
      kiwi: env.KIWI_API_KEY ? `${env.KIWI_API_KEY.length}c` : 'MISSING',
    },
  });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '..', 'public');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath);
});

// Only start the HTTP listener + cron when running as a standalone Node process
// (skipped in serverless environments where `server.ts` is imported as a module)
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    startPriceAlertCron();
  });
}

export default app;
