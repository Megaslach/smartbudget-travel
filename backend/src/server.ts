import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import simulationRoutes from './routes/simulationRoutes';
import tripRoutes from './routes/tripRoutes';
import stripeRoutes from './routes/stripeRoutes';
import { handleWebhook } from './controllers/stripeController';

const app = express();

// Stripe webhook needs raw body
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', simulationRoutes);
app.use('/api', tripRoutes);
app.use('/api', stripeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;
