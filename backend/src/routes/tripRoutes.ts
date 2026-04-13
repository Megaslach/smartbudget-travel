import { Router } from 'express';
import { generateTrip } from '../controllers/tripController';
import { authenticate } from '../middleware/auth';
import { premiumGuard } from '../middleware/premiumGuard';

const router = Router();

router.post('/generate-trip', authenticate, premiumGuard as any, generateTrip as any);

export default router;
