import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { compareSchema } from '../validators/schemas';
import { estimateBudget } from '../services/budgetService';

export const compareDestinations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = compareSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { destinations, departureCity, startDate, endDate, people } = validation.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const results = await Promise.all(
      destinations.map(async (destination) => {
        try {
          const budget = await estimateBudget({
            destination,
            departureCity,
            startDate,
            endDate,
            duration,
            people,
          });
          return { destination, budget, error: null };
        } catch (err) {
          console.error(`Compare error for ${destination}:`, err);
          return { destination, budget: null, error: 'Erreur lors de l\'estimation' };
        }
      })
    );

    res.json({ results, duration, people, departureCity, startDate, endDate });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Erreur lors de la comparaison' });
  }
};
