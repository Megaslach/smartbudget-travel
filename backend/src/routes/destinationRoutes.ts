import { Router, Request, Response } from 'express';
import { searchCities, Airport } from '../data/airports';
import { searchWorldwideCities, findNearestAirport, estimateAirportTransport } from '../services/geoService';

const router = Router();

router.get('/destinations/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  if (query.length < 1) {
    res.json({ destinations: [] });
    return;
  }

  // 1. Curated list first (fastest, has popular/featured tagging)
  const curatedResults = searchCities(query);

  // 2. Photon worldwide fallback (parallel)
  const photonResults = await searchWorldwideCities(query, 'fr');

  // Merge: curated first, then photon results not already in curated
  const seen = new Set(curatedResults.map((c) => c.name.toLowerCase() + '|' + c.country.toLowerCase()));
  const photonExtras = photonResults.filter((p) => !seen.has(p.name.toLowerCase() + '|' + p.country.toLowerCase()));

  const destinations = [
    ...curatedResults.map((city) => ({
      name: city.name,
      country: city.country,
      countryCode: city.countryCode,
      emoji: city.emoji,
      airports: city.airports,
      image: `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80`,
      imageQuery: city.image,
      matchType: city.matchType,
      popular: city.popular || false,
      nearestAirportInfo: null,
    })),
    ...photonExtras.map((p) => ({
      name: p.name,
      country: p.country,
      countryCode: p.countryCode,
      emoji: p.emoji,
      airports: p.airports,
      image: `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80`,
      imageQuery: p.name.toLowerCase(),
      matchType: p.matchType,
      popular: p.popular,
      nearestAirportInfo: p.nearestAirportInfo,
    })),
  ];

  res.json({ destinations: destinations.slice(0, 12) });
});

router.get('/airports/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  if (query.length < 1) {
    res.json({ airports: [] });
    return;
  }

  // Curated list — has explicit airports
  const curatedResults = searchCities(query);
  const airports: { city: string; country: string; emoji: string; code: string; airportName: string }[] = [];

  curatedResults.forEach((city) => {
    city.airports.forEach((airport: Airport) => {
      airports.push({
        city: city.name,
        country: city.country,
        emoji: city.emoji,
        code: airport.code,
        airportName: airport.name,
      });
    });
  });

  // If no curated airports found, try Photon + nearest-airport fallback
  if (airports.length === 0) {
    const photonResults = await searchWorldwideCities(query, 'fr');
    for (const p of photonResults) {
      if (p.airports.length === 0 && p.nearestAirportInfo) {
        const { airport, cityName } = p.nearestAirportInfo;
        airports.push({
          city: p.name,
          country: p.country,
          emoji: p.emoji,
          code: airport.code,
          airportName: `${airport.name} (proche de ${cityName})`,
        });
      } else {
        p.airports.forEach((a) => {
          airports.push({
            city: p.name,
            country: p.country,
            emoji: p.emoji,
            code: a.code,
            airportName: a.name,
          });
        });
      }
    }
  }

  res.json({ airports: airports.slice(0, 10) });
});

/** Nearest-airport detail endpoint — used when the user picks a small city. */
router.get('/airports/nearest', (req: Request, res: Response): void => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    res.status(400).json({ error: 'lat et lng requis' });
    return;
  }

  const nearest = findNearestAirport(lat, lng);
  if (!nearest) {
    res.json({ nearest: null });
    return;
  }

  res.json({
    nearest: {
      airport: nearest.airport,
      cityName: nearest.cityName,
      country: nearest.country,
      distanceKm: Math.round(nearest.distanceKm),
      transport: estimateAirportTransport(nearest.distanceKm),
    },
  });
});

export default router;
