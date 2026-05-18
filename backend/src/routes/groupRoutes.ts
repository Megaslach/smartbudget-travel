import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createGroup, listGroups, getGroup,
  createGroupInvite, getGroupInviteInfo, acceptGroupInvite,
  leaveGroup, kickGroupMember,
  proposeGroupSimulation, removeGroupSimulation,
  voteOnGroupSimulation, removeVoteOnGroupSimulation,
} from '../controllers/groupController';

const router = Router();

router.post('/groups',                authenticate, createGroup as any);
router.get('/groups',                 authenticate, listGroups as any);
router.get('/groups/:id',             authenticate, getGroup as any);
router.post('/groups/:id/invite',     authenticate, createGroupInvite as any);
router.delete('/groups/:id',          authenticate, leaveGroup as any);
router.delete('/groups/:id/members/:userId', authenticate, kickGroupMember as any);

// Proposals (linking simulations to a group)
router.post('/groups/:id/proposals',                   authenticate, proposeGroupSimulation as any);
router.delete('/groups/:id/proposals/:proposalId',     authenticate, removeGroupSimulation as any);

// Votes on proposals
router.post('/groups/:id/proposals/:proposalId/vote',   authenticate, voteOnGroupSimulation as any);
router.delete('/groups/:id/proposals/:proposalId/vote', authenticate, removeVoteOnGroupSimulation as any);

router.get('/group-invite/:token',           getGroupInviteInfo as any);
router.post('/group-invite/:token/accept', authenticate, acceptGroupInvite as any);

export default router;
