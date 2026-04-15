import { Router } from 'express';
import { simulate, getUserSimulations, getSimulationDetail, priceCheck } from '../controllers/simulationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/simulate', authenticate, simulate as any);
router.get('/user/simulations', authenticate, getUserSimulations as any);
router.get('/simulation/:id', authenticate, getSimulationDetail as any);
router.get('/simulation/:id/price-check', authenticate, priceCheck as any);

export default router;
