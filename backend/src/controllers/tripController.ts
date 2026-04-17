import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateTripSchema } from '../validators/schemas';
import { generateItinerary } from '../services/itineraryService';
import { isPremiumActive } from '../middleware/premiumGuard';

export const generateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = generateTripSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const {
      simulationId, activitiesPerDay, tripPace, tripStyle,
      interests, hasChildren, hasAccessibilityNeeds,
      dietaryPreferences, transportPreference, budgetLevel,
      avoidList, mustSeeList,
    } = validation.data;

    const [user, simulation] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.userId } }),
      prisma.simulation.findFirst({ where: { id: simulationId, userId: req.userId } }),
    ]);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const premium = isPremiumActive(user);

    const itinerary = await generateItinerary({
      destination: simulation.destination,
      startDate: simulation.startDate,
      endDate: simulation.endDate,
      duration: simulation.duration,
      people: simulation.people,
      activitiesPerDay: premium ? activitiesPerDay : undefined,
      tripPace: premium ? tripPace : undefined,
      tripStyle: premium ? tripStyle : undefined,
      interests: premium ? interests : undefined,
      hasChildren: premium ? hasChildren : undefined,
      hasAccessibilityNeeds: premium ? hasAccessibilityNeeds : undefined,
      dietaryPreferences: premium ? dietaryPreferences : undefined,
      transportPreference: premium ? transportPreference : undefined,
      budgetLevel: premium ? budgetLevel : undefined,
      avoidList: premium ? avoidList : undefined,
      mustSeeList: premium ? mustSeeList : undefined,
    });

    if (!itinerary) {
      res.status(502).json({ error: 'Itinéraire indisponible, réessayez dans un instant' });
      return;
    }

    await prisma.simulation.update({
      where: { id: simulationId },
      data: { itinerary: JSON.stringify(itinerary) },
    });

    res.json({
      itinerary,
      simulation: {
        id: simulation.id,
        destination: simulation.destination,
        duration: simulation.duration,
        people: simulation.people,
        budget: simulation.budget,
      },
    });
  } catch (error) {
    console.error('GenerateTrip error:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'itinéraire' });
  }
};
