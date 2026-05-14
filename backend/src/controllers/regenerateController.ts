// Refresh + pin: regenerate activities or hotels for a simulation,
// excluding items the user wanted to keep (pinned).
// The kept items are merged back into the result so they stay visible.

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { openai } from '../config/openai';
import { resolveActivityImages } from '../services/imageResolverService';
import { withAffiliate } from '../config/affiliates';

type Category = 'activities' | 'hotels';

interface RegenerateBody {
  category: Category;
  keepNames?: string[]; // names of pinned items to preserve
}

export const regenerate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, keepNames = [] } = req.body as RegenerateBody;

    if (category !== 'activities' && category !== 'hotels') {
      res.status(400).json({ error: 'category invalide (activities | hotels)' });
      return;
    }

    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim || sim.userId !== req.userId) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }

    const budget = sim.budgetData ? JSON.parse(sim.budgetData) : null;
    if (!budget) {
      res.status(400).json({ error: 'Budget non disponible pour cette simulation' });
      return;
    }

    if (category === 'activities') {
      const kept = (budget.activities?.options || []).filter((a: any) => keepNames.includes(a.name));
      const newCount = Math.max(3, 8 - kept.length);

      const prompt = `Tu es expert voyage. Pour ${sim.destination} (${sim.duration} jours, ${sim.people} pers), génère ${newCount} NOUVELLES activités touristiques DIFFÉRENTES de celles-ci : ${kept.map((a: any) => a.name).join(', ') || 'aucune'}.
Réponds en JSON strict :
{ "activities": [{ "name": "string", "price": number_euros, "duration": "string" }] }
Sois créatif, varie les types (culture, gastro, nature, etc.). Pas de doublons.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 1.1, // diversity
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      const newOpts = (parsed.activities || []).map((a: any) => ({
        name: a.name,
        price: Number(a.price) || 25,
        duration: a.duration || '2-3h',
        bookingUrl: withAffiliate(`https://www.getyourguide.com/s/?q=${encodeURIComponent(a.name + ' ' + sim.destination)}`),
      }));

      const withImages = await resolveActivityImages(newOpts, sim.destination);
      const merged = [...kept, ...withImages];

      budget.activities = { ...budget.activities, options: merged };
    } else if (category === 'hotels') {
      const kept = (budget.accommodation?.options || []).filter((h: any) => keepNames.includes(h.name));
      const newCount = Math.max(3, 6 - kept.length);

      const prompt = `Tu es expert voyage. Pour ${sim.destination} (${sim.duration} nuits, ${sim.people} pers), suggère ${newCount} hôtels/hébergements DIFFÉRENTS de ceux-ci : ${kept.map((h: any) => h.name).join(', ') || 'aucun'}.
Réponds en JSON strict :
{ "hotels": [{ "name": "string", "type": "string (ex: Hôtel 4*, Auberge, Appartement)", "pricePerNight": number_euros, "rating": number_1_5 }] }
Varie les gammes et les quartiers. Pas de doublons.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 1.1,
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      const newOpts = (parsed.hotels || []).map((h: any) => ({
        name: h.name,
        type: h.type || 'Hôtel',
        pricePerNight: Number(h.pricePerNight) || 80,
        rating: Number(h.rating) || 4,
        bookingUrl: withAffiliate(`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name + ' ' + sim.destination)}`),
      }));

      const withImages = await resolveActivityImages(newOpts, sim.destination);
      const merged = [...kept, ...withImages];

      budget.accommodation = { ...budget.accommodation, options: merged };
    }

    const updated = await prisma.simulation.update({
      where: { id },
      data: { budgetData: JSON.stringify(budget) },
    });

    res.json({
      simulation: {
        ...updated,
        budgetData: budget,
        aiTips: updated.aiTips ? JSON.parse(updated.aiTips) : null,
        itinerary: updated.itinerary ? JSON.parse(updated.itinerary) : null,
        stops: updated.stops ? JSON.parse(updated.stops) : [],
      },
    });
  } catch (error: any) {
    console.error('Regenerate error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Erreur lors du rafraîchissement' });
  }
};
