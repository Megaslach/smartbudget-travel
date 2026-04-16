import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { simulationSchema } from '../validators/schemas';
import { estimateBudget } from '../services/budgetService';
import { generateSmartTips, AiTipsResult } from '../services/aiTipsService';
import { generateItinerary } from '../services/itineraryService';

const DEFAULT_TIPS: AiTipsResult = {
  tips: [
    { type: 'timing', icon: '📅', title: 'Réservez à l\'avance', description: 'Les meilleurs prix sont disponibles 6-8 semaines avant le départ.', isPremium: false },
    { type: 'saving', icon: '💰', title: 'Comparez les prix', description: 'Utilisez les liens de réservation pour comparer les offres sur plusieurs sites.', isPremium: false },
  ],
  bestBookingWindow: 'Réservez 6-8 semaines avant le départ',
  priceOutlook: 'stable',
  priceOutlookNote: 'Tendance stable pour cette période.',
};

function raceTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export const simulate = async (req: AuthRequest, res: Response): Promise<void> => {
  const t0 = Date.now();
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

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    const [budgetEstimate, itinerary] = await Promise.all([
      estimateBudget({ destination, departureCity, startDate, endDate, duration, people, premiumFilters }),
      generateItinerary({
        destination,
        startDate,
        endDate,
        duration,
        people,
        interests: premiumFilters?.interests,
      }),
    ]);

    console.log(`[simulate] budget+itinerary done in ${Date.now() - t0}ms`);

    const remaining = Math.max(2000, 52000 - (Date.now() - t0));
    const tipsTimeout = Math.min(remaining - 2000, 8000);

    const aiTips = await raceTimeout(
      generateSmartTips({
        destination, departureCity, startDate, endDate, duration, people,
        budget: budgetEstimate,
        isPremium: user?.isPremium ?? false,
      }),
      tipsTimeout,
      DEFAULT_TIPS,
    );

    console.log(`[simulate] tips done in ${Date.now() - t0}ms`);

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
        itinerary: itinerary ? JSON.stringify(itinerary) : null,
      },
    });

    console.log(`[simulate] total ${Date.now() - t0}ms`);

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
        itinerary,
        createdAt: simulation.createdAt,
      },
    });
  } catch (error) {
    console.error(`Simulate error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: 'Erreur lors de la simulation' });
  }
};

export const getUserSimulations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [owned, shared] = await Promise.all([
      prisma.simulation.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, destination: true, departureCity: true, startDate: true, endDate: true,
          duration: true, people: true, budget: true, createdAt: true, itinerary: true, aiTips: true,
          priceAlertEnabled: true,
        },
      }),
      prisma.simulationCollaborator.findMany({
        where: { userId: req.userId },
        include: {
          simulation: {
            select: {
              id: true, destination: true, departureCity: true, startDate: true, endDate: true,
              duration: true, people: true, budget: true, createdAt: true, itinerary: true, aiTips: true,
              user: { select: { email: true } },
            },
          },
        },
      }),
    ]);

    const formatted = [
      ...owned.map((s) => ({
        ...s,
        aiTips: s.aiTips ? JSON.parse(s.aiTips) : null,
        role: 'owner' as const,
        sharedBy: null,
      })),
      ...shared.map((c) => ({
        ...c.simulation,
        aiTips: c.simulation.aiTips ? JSON.parse(c.simulation.aiTips) : null,
        role: 'editor' as const,
        sharedBy: c.simulation.user.email.split('@')[0],
        user: undefined,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ simulations: formatted });
  } catch (error) {
    console.error('GetUserSimulations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des simulations' });
  }
};

export const getSimulationDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: { collaborators: { select: { userId: true } } },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const isOwner = simulation.userId === req.userId;
    const isCollab = simulation.collaborators.some((c) => c.userId === req.userId);
    if (!isOwner && !isCollab) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const { collaborators, ...simData } = simulation;
    void collaborators;

    res.json({
      simulation: {
        ...simData,
        budgetData: simulation.budgetData ? JSON.parse(simulation.budgetData) : null,
        aiTips: simulation.aiTips ? JSON.parse(simulation.aiTips) : null,
        itinerary: simulation.itinerary ? JSON.parse(simulation.itinerary) : null,
        role: isOwner ? 'owner' : 'editor',
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

export const deleteSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sim = await prisma.simulation.findFirst({ where: { id, userId: req.userId } });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }
    await prisma.simulation.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('DeleteSimulation error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
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
