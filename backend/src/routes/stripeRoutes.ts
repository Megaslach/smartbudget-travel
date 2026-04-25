import { Router } from 'express';
import { createCheckoutSession, createPortalSession } from '../controllers/stripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create-checkout-session', authenticate, createCheckoutSession as any);
router.post('/create-portal-session', authenticate, createPortalSession as any);

export default router;
