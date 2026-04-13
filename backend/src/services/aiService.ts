import { openai } from '../config/openai';

export interface ItineraryDay {
  day: number;
  title: string;
  activities: {
    time: string;
    activity: string;
    location: string;
    estimatedCost: number;
    description: string;
  }[];
}

export async function generateItinerary(
  destination: string,
  duration: number,
  people: number,
  budget: number
): Promise<ItineraryDay[]> {
  const prompt = `Tu es un expert en planification de voyages. Génère un itinéraire détaillé pour un voyage.

**Paramètres :**
- Destination : ${destination}
- Durée : ${duration} jours
- Nombre de personnes : ${people}
- Budget total : ${budget}€

**Format de réponse attendu (JSON strict) :**
Retourne un tableau JSON d'objets, un par jour, avec cette structure exacte :
[
  {
    "day": 1,
    "title": "Titre du jour (ex: Découverte du centre historique)",
    "activities": [
      {
        "time": "09:00",
        "activity": "Nom de l'activité",
        "location": "Lieu précis",
        "estimatedCost": 15,
        "description": "Brève description (1-2 phrases)"
      }
    ]
  }
]

**Règles :**
- 3 à 5 activités par jour
- Le coût total ne doit pas dépasser le budget
- Inclure des repas, visites, transports locaux
- Varier les types d'activités (culture, gastronomie, nature, etc.)
- Les coûts sont par personne en euros
- Retourne UNIQUEMENT le JSON, sans texte supplémentaire`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Tu es un assistant spécialisé en planification de voyages. Tu réponds uniquement en JSON valide.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Aucune réponse de l\'IA');

  try {
    const parsed = JSON.parse(content);
    return parsed as ItineraryDay[];
  } catch {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ItineraryDay[];
    }
    throw new Error('Impossible de parser la réponse de l\'IA');
  }
}
