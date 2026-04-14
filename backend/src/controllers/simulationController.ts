import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { simulationSchema } from '../validators/schemas';
import { estimateBudget } from '../services/budgetService';

export const simulate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = simulationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { destination, departureCity, startDate, endDate, people, premiumFilters } = validation.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const budgetEstimate = await estimateBudget({ destination, departureCity, startDate, endDate, duration, people, premiumFilters });

    const simulation = await prisma.simulation.create({
      data: {
        userId: req.userId!,
        destination,
        duration,
        people,
        budget: budgetEstimate.total,
      },
    });

    res.status(201).json({
      simulation: {
        id: simulation.id,
        destination: simulation.destination,
        departureCity,
        startDate,
        endDate,
        duration: simulation.duration,
        people: simulation.people,
        budget: budgetEstimate,
        createdAt: simulation.createdAt,
      },
    });
  } catch (error) {
    console.error('Simulate error:', error);
    res.status(500).json({ error: 'Erreur lors de la simulation' });
  }
};

export const getUserSimulations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const simulations = await prisma.simulation.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ simulations });
  } catch (error) {
    console.error('GetUserSimulations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des simulations' });
  }
};
