import { Router } from 'express';
import { simulate, getUserSimulations } from '../controllers/simulationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/simulate', authenticate, simulate as any);
router.get('/user/simulations', authenticate, getUserSimulations as any);

export default router;
