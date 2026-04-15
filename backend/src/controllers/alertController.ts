import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { priceAlertSchema } from '../validators/schemas';

export const updatePriceAlert = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = priceAlertSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }
    const { enabled, threshold } = validation.data;

    const sim = await prisma.simulation.findFirst({ where: { id, userId: req.userId } });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const updated = await prisma.simulation.update({
      where: { id },
      data: {
        priceAlertEnabled: enabled,
        ...(threshold !== undefined ? { priceAlertThreshold: threshold } : {}),
        ...(enabled && !sim.lastPriceTotal ? { lastPriceTotal: sim.budget, lastPriceCheckAt: new Date() } : {}),
      },
      select: {
        priceAlertEnabled: true,
        priceAlertThreshold: true,
        lastPriceTotal: true,
        lastPriceCheckAt: true,
      },
    });

    res.json({ alert: updated });
  } catch (error) {
    console.error('UpdatePriceAlert error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const getPriceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sim = await prisma.simulation.findFirst({
      where: { id, userId: req.userId },
      select: { id: true, budget: true, createdAt: true },
    });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const snapshots = await prisma.priceSnapshot.findMany({
      where: { simulationId: id },
      orderBy: { checkedAt: 'asc' },
      select: { id: true, total: true, flightPrice: true, hotelPrice: true, checkedAt: true },
    });

    const history = [
      { total: sim.budget, checkedAt: sim.createdAt, initial: true },
      ...snapshots.map((s) => ({
        total: s.total,
        flightPrice: s.flightPrice,
        hotelPrice: s.hotelPrice,
        checkedAt: s.checkedAt,
        initial: false,
      })),
    ];

    res.json({ history });
  } catch (error) {
    console.error('GetPriceHistory error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};
