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

/** Get a group's details (members + count) if the user is a member. */
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
      include: { members: { include: { user: { select: { id: true, email: true } } } } },
    });

    res.json({ group: { ...group, myRole: member.role } });
  } catch (error) {
    console.error('GetGroup error:', error);
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
