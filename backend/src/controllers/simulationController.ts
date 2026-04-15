import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { simulationSchema } from '../validators/schemas';
import { estimateBudget } from '../services/budgetService';
import { generateSmartTips } from '../services/aiTipsService';

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

    // Generate AI Smart Tips (premium feature, but basic tips for all)
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const aiTips = await generateSmartTips({
      destination, departureCity, startDate, endDate, duration, people,
      budget: budgetEstimate,
      isPremium: user?.isPremium ?? false,
    });

    const simulation = await prisma.simulation.create({
      data: {
        userId: req.userId!,
        destination,
        departureCity,
        startDate,
        endDate,
        duration,
        people,
        budget: budgetEstimate.total,
        budgetData: JSON.stringify(budgetEstimate),
        aiTips: JSON.stringify(aiTips),
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
        aiTips,
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
      select: {
        id: true,
        destination: true,
        departureCity: true,
        startDate: true,
        endDate: true,
        duration: true,
        people: true,
        budget: true,
        createdAt: true,
        itinerary: true,
        aiTips: true,
      },
    });

    const formatted = simulations.map(s => ({
      ...s,
      aiTips: s.aiTips ? JSON.parse(s.aiTips) : null,
    }));

    res.json({ simulations: formatted });
  } catch (error) {
    console.error('GetUserSimulations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des simulations' });
  }
};

export const getSimulationDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await prisma.simulation.findFirst({
      where: { id, userId: req.userId },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    res.json({
      simulation: {
        ...simulation,
        budgetData: simulation.budgetData ? JSON.parse(simulation.budgetData) : null,
        aiTips: simulation.aiTips ? JSON.parse(simulation.aiTips) : null,
        itinerary: simulation.itinerary ? JSON.parse(simulation.itinerary) : null,
      },
    });
  } catch (error) {
    console.error('GetSimulationDetail error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const getSharedSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const sharedBy = simulation.user?.email ? simulation.user.email.split('@')[0] : 'Anonyme';

    res.json({
      simulation: {
        id: simulation.id,
        destination: simulation.destination,
        departureCity: simulation.departureCity,
        startDate: simulation.startDate,
        endDate: simulation.endDate,
        duration: simulation.duration,
        people: simulation.people,
        budget: simulation.budget,
        budgetData: simulation.budgetData ? JSON.parse(simulation.budgetData) : null,
        aiTips: simulation.aiTips ? JSON.parse(simulation.aiTips) : null,
        itinerary: simulation.itinerary ? JSON.parse(simulation.itinerary) : null,
        createdAt: simulation.createdAt,
        sharedBy,
      },
    });
  } catch (error) {
    console.error('GetSharedSimulation error:', error);
    res.status(500).json({ error: 'Erreur' });
  }
};

export const priceCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await prisma.simulation.findFirst({
      where: { id, userId: req.userId },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const originalBudget = simulation.budgetData ? JSON.parse(simulation.budgetData) : null;
    if (!originalBudget) {
      res.status(400).json({ error: 'Pas de données budget pour cette simulation' });
      return;
    }

    // Re-run the estimation with current prices
    const currentEstimate = await estimateBudget({
      destination: simulation.destination,
      departureCity: simulation.departureCity,
      startDate: simulation.startDate,
      endDate: simulation.endDate,
      duration: simulation.duration,
      people: simulation.people,
    });

    const diff = currentEstimate.total - originalBudget.total;
    const diffPercent = originalBudget.total > 0 ? Math.round((diff / originalBudget.total) * 100) : 0;

    const flightDiff = (currentEstimate.flights.avgPrice - originalBudget.flights.avgPrice);
    const hotelDiff = (currentEstimate.accommodation.avgPerNight - originalBudget.accommodation.avgPerNight);

    res.json({
      original: originalBudget,
      current: currentEstimate,
      comparison: {
        totalDiff: Math.round(diff),
        totalDiffPercent: diffPercent,
        flightDiffPerPerson: Math.round(flightDiff),
        hotelDiffPerNight: Math.round(hotelDiff),
        trend: diff > 50 ? 'up' : diff < -50 ? 'down' : 'stable',
        advice: diff > 100
          ? 'Les prix ont augmenté. Si vous êtes décidé, réservez rapidement.'
          : diff < -100
          ? 'Bonne nouvelle ! Les prix ont baissé. C\'est le moment de réserver.'
          : 'Les prix sont stables. Pas d\'urgence particulière.',
      },
    });
  } catch (error) {
    console.error('PriceCheck error:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des prix' });
  }
};
