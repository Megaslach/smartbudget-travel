import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { commentSchema } from '../validators/schemas';

const INVITE_TTL_DAYS = 14;

async function hasAccess(simulationId: string, userId: string): Promise<'owner' | 'editor' | null> {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId }, select: { userId: true } });
  if (!sim) return null;
  if (sim.userId === userId) return 'owner';
  const collab = await prisma.simulationCollaborator.findUnique({
    where: { simulationId_userId: { simulationId, userId } },
  });
  return collab ? (collab.role as 'editor') : null;
}

export const createInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sim = await prisma.simulation.findFirst({ where: { id, userId: req.userId } });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const invite = await prisma.simulationInvite.create({
      data: { simulationId: id, token, createdBy: req.userId!, expiresAt },
    });

    res.status(201).json({
      token: invite.token,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('CreateInvite error:', error);
    res.status(500).json({ error: 'Erreur création invitation' });
  }
};

export const getInviteInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const invite = await prisma.simulationInvite.findUnique({
      where: { token },
      include: {
        simulation: { select: { id: true, destination: true, startDate: true, endDate: true, people: true } },
        creator: { select: { email: true } },
      },
    });
    if (!invite) {
      res.status(404).json({ error: 'Invitation introuvable' });
      return;
    }
    if (invite.expiresAt < new Date()) {
      res.status(410).json({ error: 'Invitation expirée' });
      return;
    }
    res.json({
      simulation: invite.simulation,
      invitedBy: invite.creator.email.split('@')[0],
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('GetInviteInfo error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const acceptInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const invite = await prisma.simulationInvite.findUnique({ where: { token } });
    if (!invite) {
      res.status(404).json({ error: 'Invitation introuvable' });
      return;
    }
    if (invite.expiresAt < new Date()) {
      res.status(410).json({ error: 'Invitation expirée' });
      return;
    }

    const sim = await prisma.simulation.findUnique({ where: { id: invite.simulationId } });
    if (!sim) {
      res.status(404).json({ error: 'Simulation introuvable' });
      return;
    }
    if (sim.userId === req.userId) {
      res.status(400).json({ error: 'Vous êtes déjà propriétaire de cette simulation' });
      return;
    }

    await prisma.simulationCollaborator.upsert({
      where: { simulationId_userId: { simulationId: invite.simulationId, userId: req.userId! } },
      create: { simulationId: invite.simulationId, userId: req.userId!, role: 'editor' },
      update: {},
    });
    await prisma.simulationInvite.update({
      where: { id: invite.id },
      data: { usedCount: { increment: 1 } },
    });

    res.json({ simulationId: invite.simulationId });
  } catch (error) {
    console.error('AcceptInvite error:', error);
    res.status(500).json({ error: 'Erreur acceptation invitation' });
  }
};

export const listCollaborators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const access = await hasAccess(id, req.userId!);
    if (!access) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const sim = await prisma.simulation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        collaborators: { include: { user: { select: { id: true, email: true } } } },
      },
    });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    res.json({
      owner: { id: sim.user.id, email: sim.user.email, name: sim.user.email.split('@')[0] },
      collaborators: sim.collaborators.map((c) => ({
        id: c.user.id,
        email: c.user.email,
        name: c.user.email.split('@')[0],
        role: c.role,
        joinedAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('ListCollaborators error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const sim = await prisma.simulation.findFirst({ where: { id, userId: req.userId } });
    if (!sim) {
      res.status(403).json({ error: 'Seul le propriétaire peut retirer un collaborateur' });
      return;
    }
    await prisma.simulationCollaborator.deleteMany({ where: { simulationId: id, userId } });
    res.json({ success: true });
  } catch (error) {
    console.error('RemoveCollaborator error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const listComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const access = await hasAccess(id, req.userId!);
    if (!access) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }
    const comments = await prisma.simulationComment.findMany({
      where: { simulationId: id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true } } },
    });
    res.json({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        dayIndex: c.dayIndex,
        activityIndex: c.activityIndex,
        createdAt: c.createdAt,
        author: { id: c.user.id, name: c.user.email.split('@')[0], email: c.user.email },
      })),
    });
  } catch (error) {
    console.error('ListComments error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const access = await hasAccess(id, req.userId!);
    if (!access) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }
    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }
    const { text, dayIndex, activityIndex } = validation.data;
    const comment = await prisma.simulationComment.create({
      data: {
        simulationId: id,
        userId: req.userId!,
        text,
        dayIndex: dayIndex ?? null,
        activityIndex: activityIndex ?? null,
      },
      include: { user: { select: { id: true, email: true } } },
    });
    res.status(201).json({
      comment: {
        id: comment.id,
        text: comment.text,
        dayIndex: comment.dayIndex,
        activityIndex: comment.activityIndex,
        createdAt: comment.createdAt,
        author: { id: comment.user.id, name: comment.user.email.split('@')[0], email: comment.user.email },
      },
    });
  } catch (error) {
    console.error('CreateComment error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const comment = await prisma.simulationComment.findUnique({
      where: { id: commentId },
      include: { simulation: { select: { userId: true } } },
    });
    if (!comment) {
      res.status(404).json({ error: 'Commentaire introuvable' });
      return;
    }
    if (comment.userId !== req.userId && comment.simulation.userId !== req.userId) {
      res.status(403).json({ error: 'Action non autorisée' });
      return;
    }
    await prisma.simulationComment.delete({ where: { id: commentId } });
    res.json({ success: true });
  } catch (error) {
    console.error('DeleteComment error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};
