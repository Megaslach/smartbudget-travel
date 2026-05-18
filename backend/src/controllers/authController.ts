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
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  isPremium: boolean;
  premiumUntil?: Date | null;
  premiumPlan?: string | null;
  createdAt?: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    avatarUrl: user.avatarUrl ?? null,
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

const USER_SELECT = {
  id: true, email: true, firstName: true, lastName: true, avatarUrl: true,
  isPremium: true, premiumUntil: true, premiumPlan: true, createdAt: true,
};

export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
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
    const { email, currentPassword, newPassword, firstName, lastName, avatarUrl } = req.body;
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

    if (typeof firstName === 'string') {
      const trimmed = firstName.trim().slice(0, 60);
      updates.firstName = trimmed.length > 0 ? trimmed : null;
    }
    if (typeof lastName === 'string') {
      const trimmed = lastName.trim().slice(0, 60);
      updates.lastName = trimmed.length > 0 ? trimmed : null;
    }
    if (typeof avatarUrl === 'string') {
      // Accept data URLs (base64) or http(s) URLs. Reject anything else.
      // Hard cap at 200KB to keep the DB row small.
      if (avatarUrl === '') {
        updates.avatarUrl = null;
      } else if (/^(data:image\/(jpeg|png|webp);base64,|https?:\/\/)/.test(avatarUrl)) {
        if (avatarUrl.length > 200_000) {
          res.status(413).json({ error: 'Image trop volumineuse (max ~150 KB après compression)' });
          return;
        }
        updates.avatarUrl = avatarUrl;
      } else {
        res.status(400).json({ error: "Format d'image non supporté" });
        return;
      }
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
      select: USER_SELECT,
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
