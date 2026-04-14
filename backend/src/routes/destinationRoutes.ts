import { Router, Request, Response } from 'express';
import { openai } from '../config/openai';

const router = Router();

const DESTINATIONS_CACHE: Record<string, { name: string; country: string; image: string; emoji: string }[]> = {};

router.get('/destinations/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim();
    if (query.length < 2) {
      res.json({ destinations: [] });
      return;
    }

    if (DESTINATIONS_CACHE[query.toLowerCase()]) {
      res.json({ destinations: DESTINATIONS_CACHE[query.toLowerCase()] });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu retournes uniquement du JSON valide. Pas de texte supplémentaire.' },
        {
          role: 'user',
          content: `Donne 5 destinations de voyage populaires qui correspondent à "${query}". 
Retourne un JSON array avec cette structure exacte :
[{"name":"Nom de la ville","country":"Pays","emoji":"drapeau emoji du pays","image":"un terme de recherche Unsplash pertinent pour cette destination (en anglais, ex: 'tokyo skyline', 'bali beach')"}]
Retourne UNIQUEMENT le JSON array.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.json({ destinations: [] });
      return;
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      res.json({ destinations: [] });
      return;
    }

    const destinations = JSON.parse(jsonMatch[0]).map((d: any) => ({
      name: d.name,
      country: d.country,
      emoji: d.emoji,
      image: `https://source.unsplash.com/400x300/?${encodeURIComponent(d.image)}`,
    }));

    DESTINATIONS_CACHE[query.toLowerCase()] = destinations;
    res.json({ destinations });
  } catch (error) {
    console.error('Destination search error:', error);
    const fallbackQuery = (req.query.q as string || '').trim();
    res.json({
      destinations: [
        { name: fallbackQuery, country: '', emoji: '🌍', image: `https://source.unsplash.com/400x300/?${encodeURIComponent(fallbackQuery)}+travel` },
      ],
    });
  }
});

export default router;
