import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';
import { isPremiumActive } from './premiumGuard';

const FREE_ITINERARY_LIMIT_PER_MONTH = 1;

export const itineraryQuotaGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    if (isPremiumActive(user)) {
      next();
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usedThisMonth = await prisma.simulation.count({
      where: {
        userId: user.id,
        itinerary: { not: null },
        createdAt: { gte: startOfMonth },
      },
    });

    if (usedThisMonth >= FREE_ITINERARY_LIMIT_PER_MONTH) {
      res.status(403).json({
        error: `Vous avez atteint votre quota gratuit (${FREE_ITINERARY_LIMIT_PER_MONTH} itinéraire IA par mois). Passez Premium pour un accès illimité.`,
        upgrade: true,
        quotaExceeded: true,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('itineraryQuotaGuard error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
