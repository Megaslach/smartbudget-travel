import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { scanFlexibleDates } from '../services/flightDateScanService';
import type { BudgetEstimate } from '../services/budgetService';

export const scanFlexibleDatesForSimulation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const simulation = await prisma.simulation.findFirst({
      where: {
        id,
        OR: [
          { userId: req.userId },
          { collaborators: { some: { userId: req.userId } } },
        ],
      },
    });

    if (!simulation) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    if (!simulation.budgetData) {
      res.status(400).json({ error: 'Budget indisponible pour cette simulation' });
      return;
    }

    const budget: BudgetEstimate = JSON.parse(simulation.budgetData);
    const basePricePerPerson = budget.flights?.avgPrice ?? 0;

    if (basePricePerPerson <= 0) {
      res.status(400).json({ error: 'Prix de vol de base indisponible' });
      return;
    }

    const results = await scanFlexibleDates({
      departureCity: simulation.departureCity,
      destination: simulation.destination,
      startDate: simulation.startDate,
      endDate: simulation.endDate,
      people: simulation.people,
      basePricePerPerson,
    });

    res.json({
      basePricePerPerson: Math.round(basePricePerPerson),
      basePriceGroup: Math.round(basePricePerPerson * simulation.people),
      people: simulation.people,
      originalStart: simulation.startDate,
      originalEnd: simulation.endDate,
      results,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('scanFlexibleDates error:', error);
    res.status(500).json({ error: 'Erreur lors du scan des dates' });
  }
};
