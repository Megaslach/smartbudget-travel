import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { proposeTrips, ProposeTripsInput } from '../services/tripProposalService';

export const proposeTripsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as ProposeTripsInput;
    if (!body || (!body.budgetTotal && !body.budgetPerPerson)) {
      res.status(400).json({ error: 'Budget requis (budgetTotal ou budgetPerPerson)' });
      return;
    }
    const result = proposeTrips(body);
    res.json(result);
  } catch (error) {
    console.error('ProposeTrips error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche de propositions' });
  }
};
