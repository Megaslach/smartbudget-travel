import { Router, Request, Response } from 'express';
import { searchCities, City, Airport } from '../data/airports';

const router = Router();

router.get('/destinations/search', (req: Request, res: Response): void => {
  const query = (req.query.q as string || '').trim();
  if (query.length < 1) {
    res.json({ destinations: [] });
    return;
  }

  const results = searchCities(query);
  const destinations = results.map((city) => ({
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    emoji: city.emoji,
    airports: city.airports,
    image: `https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&h=300&fit=crop&q=80`,
    imageQuery: city.image,
    matchType: city.matchType,
    popular: city.popular || false,
  }));

  res.json({ destinations });
});

router.get('/airports/search', (req: Request, res: Response): void => {
  const query = (req.query.q as string || '').trim();
  if (query.length < 1) {
    res.json({ airports: [] });
    return;
  }

  const results = searchCities(query);
  const airports: { city: string; country: string; emoji: string; code: string; airportName: string }[] = [];

  results.forEach((city) => {
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

  res.json({ airports });
});

export default router;
