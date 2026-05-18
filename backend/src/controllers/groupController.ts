import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';

/** Create a new trip group (the owner is automatically a member). */
export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, emoji } = req.body as { name?: string; emoji?: string };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Nom du groupe requis (2 caractères min)' });
      return;
    }

    const group = await prisma.tripGroup.create({
      data: {
        name: name.trim(),
        emoji: emoji || '🌍',
        ownerId: req.userId!,
        members: { create: { userId: req.userId!, role: 'owner' } },
      },
      include: { members: { include: { user: { select: { id: true, email: true } } } } },
    });

    res.status(201).json({ group });
  } catch (error) {
    console.error('CreateGroup error:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
};

/** List all groups the user belongs to. */
export const listGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberships = await prisma.tripGroupMember.findMany({
      where: { userId: req.userId! },
      include: {
        group: {
          include: {
            members: { include: { user: { select: { id: true, email: true } } } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      memberCount: m.group._count.members,
      myRole: m.role,
    }));

    res.json({ groups });
  } catch (error) {
    console.error('ListGroups error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Get a group's details (members + count + linked simulations + votes) if the user is a member. */
export const getGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const member = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!member) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    const group = await prisma.tripGroup.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
        simulations: {
          include: {
            simulation: {
              select: {
                id: true, destination: true, departureCity: true,
                startDate: true, endDate: true, duration: true,
                people: true, budget: true, createdAt: true,
              },
            },
            proposer: { select: { id: true, email: true } },
            votes: { include: { user: { select: { id: true, email: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ group: { ...group, myRole: member.role } });
  } catch (error) {
    console.error('GetGroup error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Update group name, emoji, or shared notes (owner only). */
export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, emoji, notes } = req.body as { name?: string; emoji?: string; notes?: string };
    const member = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!member) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }
    // Owner can change everything; members can only edit shared notes
    const isOwner = member.role === 'owner';
    const data: { name?: string; emoji?: string; notes?: string | null } = {};
    if (isOwner && typeof name === 'string' && name.trim().length >= 2) data.name = name.trim();
    if (isOwner && typeof emoji === 'string' && emoji.length > 0) data.emoji = emoji;
    if (typeof notes === 'string') data.notes = notes.length > 0 ? notes : null;

    const group = await prisma.tripGroup.update({ where: { id }, data });
    res.json({ group });
  } catch (error) {
    console.error('UpdateGroup error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Kick a member from a group (owner only, cannot kick self). */
export const kickGroupMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;
    if (userId === req.userId) {
      res.status(400).json({ error: 'Utilise quitter le groupe pour te retirer toi-même' });
      return;
    }
    const ownerMember = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!ownerMember || ownerMember.role !== 'owner') {
      res.status(403).json({ error: 'Seul le propriétaire peut retirer un membre' });
      return;
    }
    await prisma.tripGroupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    }).catch(() => {});
    res.json({ success: true });
  } catch (error) {
    console.error('KickGroupMember error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Attach a simulation to a group as a proposal (any member). */
export const proposeGroupSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { simulationId } = req.body as { simulationId?: string };
    if (!simulationId) {
      res.status(400).json({ error: 'simulationId requis' });
      return;
    }

    const member = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!member) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    const sim = await prisma.simulation.findUnique({ where: { id: simulationId } });
    if (!sim || sim.userId !== req.userId) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const proposal = await prisma.groupSimulation.upsert({
      where: { groupId_simulationId: { groupId: id, simulationId } },
      update: {},
      create: { groupId: id, simulationId, proposedBy: req.userId! },
      include: {
        simulation: true,
        proposer: { select: { id: true, email: true } },
        votes: { include: { user: { select: { id: true, email: true } } } },
      },
    });
    res.json({ proposal });
  } catch (error) {
    console.error('ProposeGroupSimulation error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Remove a simulation proposal from a group (proposer or owner). */
export const removeGroupSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, proposalId } = req.params;
    const proposal = await prisma.groupSimulation.findUnique({
      where: { id: proposalId },
      include: { group: true },
    });
    if (!proposal || proposal.groupId !== id) {
      res.status(404).json({ error: 'Proposition non trouvée' });
      return;
    }
    if (proposal.proposedBy !== req.userId && proposal.group.ownerId !== req.userId) {
      res.status(403).json({ error: 'Action non autorisée' });
      return;
    }
    await prisma.groupSimulation.delete({ where: { id: proposalId } });
    res.json({ success: true });
  } catch (error) {
    console.error('RemoveGroupSimulation error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Vote up/down on a group simulation proposal (members only). Optional comment. */
export const voteOnGroupSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, proposalId } = req.params;
    const { vote, comment } = req.body as { vote?: 'up' | 'down'; comment?: string };
    if (vote !== 'up' && vote !== 'down') {
      res.status(400).json({ error: 'vote doit être "up" ou "down"' });
      return;
    }

    const member = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!member) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    const proposal = await prisma.groupSimulation.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.groupId !== id) {
      res.status(404).json({ error: 'Proposition non trouvée' });
      return;
    }

    const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : '';
    const saved = await prisma.groupVote.upsert({
      where: { groupSimulationId_userId: { groupSimulationId: proposalId, userId: req.userId! } },
      update: { vote, comment: trimmedComment || null },
      create: { groupSimulationId: proposalId, userId: req.userId!, vote, comment: trimmedComment || null },
    });
    res.json({ vote: saved });
  } catch (error) {
    console.error('VoteOnGroupSimulation error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Remove the current user's vote on a proposal. */
export const removeVoteOnGroupSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { proposalId } = req.params;
    await prisma.groupVote.delete({
      where: { groupSimulationId_userId: { groupSimulationId: proposalId, userId: req.userId! } },
    }).catch(() => {});
    res.json({ success: true });
  } catch (error) {
    console.error('RemoveVote error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Create an invite token for a group (owner only). 14-day TTL. */
export const createGroupInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const member = await prisma.tripGroupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: req.userId! } },
    });
    if (!member || member.role !== 'owner') {
      res.status(403).json({ error: 'Seul le propriétaire peut inviter' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await prisma.tripGroupInvite.create({
      data: { groupId: id, token, createdBy: req.userId!, expiresAt },
    });

    res.json({ token, expiresAt });
  } catch (error) {
    console.error('CreateGroupInvite error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Get invite info (no auth required — used to preview before accepting). */
export const getGroupInviteInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const invite = await prisma.tripGroupInvite.findUnique({
      where: { token },
      include: { group: true },
    });
    if (!invite || invite.expiresAt < new Date()) {
      res.status(404).json({ error: 'Invitation invalide ou expirée' });
      return;
    }
    res.json({ group: invite.group, expiresAt: invite.expiresAt });
  } catch (error) {
    console.error('GetGroupInviteInfo error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Accept invite — adds the user as a member. */
export const acceptGroupInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const invite = await prisma.tripGroupInvite.findUnique({ where: { token } });
    if (!invite || invite.expiresAt < new Date()) {
      res.status(404).json({ error: 'Invitation invalide ou expirée' });
      return;
    }

    await prisma.tripGroupMember.upsert({
      where: { groupId_userId: { groupId: invite.groupId, userId: req.userId! } },
      update: {},
      create: { groupId: invite.groupId, userId: req.userId!, role: 'member' },
    });

    await prisma.tripGroupInvite.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    });

    res.json({ groupId: invite.groupId });
  } catch (error) {
    console.error('AcceptGroupInvite error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

/** Leave a group (or delete it if owner). */
export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const group = await prisma.tripGroup.findUnique({ where: { id } });
    if (!group) {
      res.status(404).json({ error: 'Groupe non trouvé' });
      return;
    }

    if (group.ownerId === req.userId) {
      await prisma.tripGroup.delete({ where: { id } });
    } else {
      await prisma.tripGroupMember.delete({
        where: { groupId_userId: { groupId: id, userId: req.userId! } },
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (error) {
    console.error('LeaveGroup error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};
