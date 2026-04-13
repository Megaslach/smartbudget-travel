import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateTripSchema } from '../validators/schemas';
import { generateItinerary } from '../services/aiService';

export const generateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = generateTripSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { simulationId } = validation.data;

    const simulation = await prisma.simulation.findFirst({
      where: { id: simulationId, userId: req.userId },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const itinerary = await generateItinerary(
      simulation.destination,
      simulation.duration,
      simulation.people,
      simulation.budget
    );

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
