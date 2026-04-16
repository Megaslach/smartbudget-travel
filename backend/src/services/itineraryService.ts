import { openai } from '../config/openai';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ItineraryActivity {
  time: TimeSlot;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  duration: string;
  estimatedCost?: number;
  category?: 'sight' | 'food' | 'activity' | 'transport' | 'nature' | 'shopping' | 'nightlife';
  bookingUrl?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  destination: string;
  days: ItineraryDay[];
  generatedAt: string;
}

export async function generateItinerary(params: {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  interests?: string[];
}): Promise<Itinerary | null> {
  const { destination, startDate, duration, people, interests } = params;

  const interestsLine = interests && interests.length > 0
    ? `\nIntérêts du voyageur : ${interests.join(', ')}.`
    : '';

  const prompt = `Tu es un guide voyage expert. Génère un itinéraire détaillé jour par jour pour ${people} personne(s) à ${destination}, du ${startDate} sur ${duration} nuit(s).${interestsLine}

Pour chaque jour, propose 3 activités (morning, afternoon, evening) avec :
- Un titre court et accrocheur
- Une description de 1-2 phrases qui donne envie
- Le lieu EXACT (nom du site + quartier/arrondissement)
- Les coordonnées GPS précises (lat/lng en degrés décimaux)
- La durée estimée (ex: "2h")
- Un coût estimé par personne en EUR (0 si gratuit)
- La catégorie : sight, food, activity, nature, shopping, nightlife

Mélange culture, gastronomie locale, moments de détente. Évite les clichés trop touristiques si possible. Pour le soir propose souvent une expérience culinaire locale.

Retourne UNIQUEMENT ce JSON :
{
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "<titre du jour, ex: 'Arrivée et premières découvertes'>",
      "summary": "<1 phrase qui résume la journée>",
      "activities": [
        {
          "time": "morning",
          "title": "<titre court>",
          "description": "<1-2 phrases engageantes>",
          "location": "<lieu précis>",
          "lat": <latitude>,
          "lng": <longitude>,
          "duration": "<durée>",
          "estimatedCost": <coût pers EUR>,
          "category": "<catégorie>"
        }
      ]
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Guide voyage expert. JSON uniquement. Coordonnées GPS précises (5 décimales minimum).' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.days || !Array.isArray(parsed.days)) return null;

    return {
      destination,
      days: parsed.days,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Itinerary generation failed:', error);
    return null;
  }
}
