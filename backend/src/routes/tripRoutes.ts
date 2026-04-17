import { Router } from 'express';
import { generateTrip } from '../controllers/tripController';
import { authenticate } from '../middleware/auth';
import { itineraryQuotaGuard } from '../middleware/itineraryQuotaGuard';

const router = Router();

router.post('/generate-trip', authenticate, itineraryQuotaGuard as any, generateTrip as any);

export default router;
