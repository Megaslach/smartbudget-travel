import { Router } from 'express';
import { createCheckoutSession } from '../controllers/stripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create-checkout-session', authenticate, createCheckoutSession as any);

export default router;
