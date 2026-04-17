import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { registerSchema, loginSchema } from '../validators/schemas';
import { isPremiumActive } from '../middleware/premiumGuard';

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

function serializeUser(user: {
  id: string;
  email: string;
  isPremium: boolean;
  premiumUntil?: Date | null;
  premiumPlan?: string | null;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    isPremium: isPremiumActive({ isPremium: user.isPremium, premiumUntil: user.premiumUntil ?? null }),
    premiumUntil: user.premiumUntil ?? null,
    premiumPlan: user.premiumPlan ?? null,
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { email, password } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, isPremium: true, premiumUntil: true, premiumPlan: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    res.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateProfile = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    const updates: any = {};

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: 'Cet email est déjà utilisé' });
        return;
      }
      updates.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Mot de passe actuel requis' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        return;
      }
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      res.json({ user: serializeUser(user) });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: updates,
      select: { id: true, email: true, isPremium: true, premiumUntil: true, premiumPlan: true, createdAt: true },
    });

    res.json({ user: serializeUser(updated) });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }

};

export const deleteAccount = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: 'Compte supprimé' });
  } catch (error) {
    console.error('DeleteAccount error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
