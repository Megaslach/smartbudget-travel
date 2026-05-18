// Refresh + pin: regenerate activities, hotels or flights for a simulation,
// excluding items the user wanted to keep (pinned).
// The kept items are merged back into the result so they stay visible.

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { openai } from '../config/openai';
import { resolveActivityImages } from '../services/imageResolverService';
import { withAffiliate } from '../config/affiliates';
import { buildActivityBookingUrl, buildHotelBookingUrl } from '../services/bookingUrlService';
import { getRealActivities } from '../services/realActivitiesService';
import { searchFlightsCascade, searchHotelsCascade } from '../services/budgetService';

type Category = 'activities' | 'hotels' | 'flights';

interface RegenerateBody {
  category: Category;
  keepNames?: string[]; // names of pinned items to preserve
}

export const regenerate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, keepNames = [] } = req.body as RegenerateBody;

    if (category !== 'activities' && category !== 'hotels' && category !== 'flights') {
      res.status(400).json({ error: 'category invalide (activities | hotels | flights)' });
      return;
    }

    const sim = await prisma.simulation.findUnique({ where: { id } });
    if (!sim) {
      res.status(404).json({ error: 'Simulation non trouvée' });
      return;
    }
    // Allow either the owner OR any member of a group this simulation is proposed in
    if (sim.userId !== req.userId) {
      const groupAccess = await prisma.groupSimulation.findFirst({
        where: {
          simulationId: id,
          group: { members: { some: { userId: req.userId! } } },
        },
      });
      if (!groupAccess) {
        res.status(404).json({ error: 'Simulation non trouvée' });
        return;
      }
    }

    const budget = sim.budgetData ? JSON.parse(sim.budgetData) : null;
    if (!budget) {
      res.status(400).json({ error: 'Budget non disponible pour cette simulation' });
      return;
    }

    if (category === 'activities') {
      const kept = (budget.activities?.options || []).filter((a: any) => keepNames.includes(a.name));

      // Get a fresh batch of real activities from GetYourGuide.
      // Apply trip context (dates + people) so we only get activities
      // actually available during the user's stay.
      const real = await getRealActivities({
        destination: sim.destination,
        limit: 12,
        startDate: sim.startDate || undefined,
        endDate: sim.endDate || undefined,
        participants: sim.people,
      }).catch(() => []);

      // Filter out kept names + take enough for total ~12 displayed
      const newOpts = real
        .filter((a) => !keepNames.includes(a.name))
        .slice(0, Math.max(6, 12 - kept.length))
        .map((a) => ({
          name: a.name,
          price: a.price,
          duration: a.duration,
          bookingUrl: a.bookingUrl,
          imageUrl: a.imageUrl,
        }));

      // If GetYourGuide returned nothing, fall back to AI
      let merged;
      if (newOpts.length === 0) {
        const prompt = `Pour ${sim.destination} (${sim.duration} jours, ${sim.people} pers), génère 6 activités touristiques DIFFÉRENTES de : ${kept.map((a: any) => a.name).join(', ') || 'aucune'}.
JSON strict : { "activities": [{ "name": "string", "price": number, "duration": "string" }] }`;
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 1.1,
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const aiOpts = (parsed.activities || []).map((a: any) => ({
          name: a.name,
          price: Number(a.price) || 25,
          duration: a.duration || '2-3h',
          bookingUrl: withAffiliate(buildActivityBookingUrl(a.name, sim.destination)),
        }));
        const withImages = await resolveActivityImages(aiOpts, sim.destination);
        merged = [...kept, ...withImages];
      } else {
        merged = [...kept, ...newOpts];
      }

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
        bookingUrl: withAffiliate(buildHotelBookingUrl(h.name, sim.destination)),
      }));

      // Try REAL hotels first (SerpAPI → Hotellook → Amadeus → Skyscanner)
      let realMerged: any[] | null = null;
      try {
        const real = await searchHotelsCascade({
          destination: sim.destination,
          departureCity: sim.departureCity,
          startDate: sim.startDate,
          endDate: sim.endDate,
          duration: sim.duration,
          people: sim.people,
        });
        if (real.hotels && real.hotels.length > 0) {
          const filtered = real.hotels
            .filter((h: any) => !keepNames.includes(h.name))
            .slice(0, Math.max(6, 12 - kept.length))
            .map((h: any) => ({
              name: h.name,
              type: h.type || 'Hôtel',
              pricePerNight: Math.round(h.pricePerNight || h.price || 80),
              rating: h.rating || 4,
              bookingUrl: h.bookingUrl || withAffiliate(buildHotelBookingUrl(h.name, sim.destination)),
              imageUrl: h.imageUrl,
              isRealData: true,
              source: real.source,
            }));
          if (filtered.length > 0) {
            const withImg = await resolveActivityImages(filtered, sim.destination);
            realMerged = [...kept, ...withImg];
          }
        }
      } catch (e) {
        console.error('Real hotels regenerate failed, falling back to AI:', e);
      }

      if (realMerged) {
        budget.accommodation = { ...budget.accommodation, options: realMerged, isRealData: true };
      } else {
        const withImages = await resolveActivityImages(newOpts, sim.destination);
        const merged = [...kept, ...withImages];
        budget.accommodation = { ...budget.accommodation, options: merged };
      }
    } else if (category === 'flights') {
      // Refresh flights via the real cascade (SerpAPI → Amadeus → Kiwi → Skyscanner)
      const real = await searchFlightsCascade({
        destination: sim.destination,
        departureCity: sim.departureCity,
        startDate: sim.startDate,
        endDate: sim.endDate,
        duration: sim.duration,
        people: sim.people,
      });

      if (real.flights && real.flights.length > 0) {
        const sorted = [...real.flights].sort((a: any, b: any) => a.price - b.price);
        const avgPrice = Math.round(sorted[0].price); // Use the cheapest as headline price
        const totalCost = avgPrice * sim.people;
        const options = sorted.slice(0, 12).map((f: any) => ({
          airline: f.airlineName || f.airline,
          price: Math.round(f.price),
          type: f.stops === 0 ? 'Vol direct' : `${f.stops} escale${f.stops > 1 ? 's' : ''}`,
          bookingUrl: f.bookingUrl,
          departureAt: f.departureAt,
          arrivalAt: f.arrivalAt,
          duration: f.duration,
          stops: f.stops,
          category: f.category,
          isRealData: true,
        }));
        budget.flights = {
          ...budget.flights,
          avgPrice,
          total: totalCost,
          isRealData: true,
          source: `${real.source} — Prix réels`,
          options,
          note: `${sorted.length} vols réels trouvés. Prix par personne A/R.`,
        };
      } else {
        res.status(503).json({ error: 'Aucun vol réel trouvé — réessaie dans quelques minutes' });
        return;
      }
    }

    // Recompute total so the proposal card stays in sync after a section refresh
    const flightTotal = (budget.flights?.avgPrice || 0) * sim.people;
    const accomTotal = budget.accommodation?.total || 0;
    const activitiesTotal = typeof budget.activities === 'object'
      ? (budget.activities.total || 0)
      : (budget.activities || 0);
    const foodTotal = budget.food || 0;
    const transportTotal = budget.transport || 0;
    budget.total = Math.round(flightTotal + accomTotal + activitiesTotal + foodTotal + transportTotal);

    const updated = await prisma.simulation.update({
      where: { id },
      data: { budgetData: JSON.stringify(budget), budget: budget.total },
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
