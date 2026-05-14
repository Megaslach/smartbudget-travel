import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createGroup, listGroups, getGroup,
  createGroupInvite, getGroupInviteInfo, acceptGroupInvite,
  leaveGroup,
} from '../controllers/groupController';

const router = Router();

router.post('/groups',                authenticate, createGroup as any);
router.get('/groups',                 authenticate, listGroups as any);
router.get('/groups/:id',             authenticate, getGroup as any);
router.post('/groups/:id/invite',     authenticate, createGroupInvite as any);
router.delete('/groups/:id',          authenticate, leaveGroup as any);

router.get('/group-invite/:token',           getGroupInviteInfo as any);
router.post('/group-invite/:token/accept', authenticate, acceptGroupInvite as any);

export default router;
