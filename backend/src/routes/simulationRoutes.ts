import { Router } from 'express';
import { simulate, getUserSimulations, getSimulationDetail, priceCheck, getSharedSimulation, deleteSimulation } from '../controllers/simulationController';
import { compareDestinations } from '../controllers/compareController';
import {
  createInvite, getInviteInfo, acceptInvite,
  listCollaborators, removeCollaborator,
  listComments, createComment, deleteComment,
} from '../controllers/collabController';
import { updatePriceAlert, getPriceHistory } from '../controllers/alertController';
import { scanFlexibleDatesForSimulation } from '../controllers/flexibleDatesController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/simulate', authenticate, simulate as any);
router.get('/user/simulations', authenticate, getUserSimulations as any);
router.get('/simulation/:id', authenticate, getSimulationDetail as any);
router.delete('/simulation/:id', authenticate, deleteSimulation as any);
router.get('/simulation/:id/price-check', authenticate, priceCheck as any);

// Feature 8: Comparator
router.post('/compare', authenticate, compareDestinations as any);

// Feature 6: Collaboration
router.post('/simulation/:id/invite', authenticate, createInvite as any);
router.get('/invite/:token', getInviteInfo as any);
router.post('/invite/:token/accept', authenticate, acceptInvite as any);
router.get('/simulation/:id/collaborators', authenticate, listCollaborators as any);
router.delete('/simulation/:id/collaborators/:userId', authenticate, removeCollaborator as any);
router.get('/simulation/:id/comments', authenticate, listComments as any);
router.post('/simulation/:id/comments', authenticate, createComment as any);
router.delete('/comment/:commentId', authenticate, deleteComment as any);

// Feature 1: Price alerts
router.patch('/simulation/:id/alert', authenticate, updatePriceAlert as any);
router.get('/simulation/:id/price-history', authenticate, getPriceHistory as any);

// Flexible dates scan (real flight prices for ±1…±7 days)
router.get('/simulation/:id/flexible-dates', authenticate, scanFlexibleDatesForSimulation as any);

// Public shared simulation (no auth)
router.get('/shared/:id', getSharedSimulation as any);

export default router;
