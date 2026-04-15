import { Router } from 'express';
import { register, login, getMe, updateProfile, deleteAccount } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe as any);
router.put('/profile', authenticate, updateProfile as any);
router.delete('/account', authenticate, deleteAccount as any);

export default router;
