import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from './auth';

export const isPremiumActive = (user: { premiumUntil: Date | null; isPremium: boolean }): boolean => {
  if (user.premiumUntil) return user.premiumUntil > new Date();
  return user.isPremium === true;
};

export const premiumGuard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || !isPremiumActive(user)) {
      res.status(403).json({
        error: 'Fonctionnalité premium requise',
        upgrade: true,
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
