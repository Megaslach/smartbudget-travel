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

interface ItineraryParams {
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  activitiesPerDay?: number;
  tripPace?: 'relaxed' | 'balanced' | 'packed';
  tripStyle?: 'cultural' | 'adventure' | 'romantic' | 'family' | 'nightlife' | 'wellness' | 'gastronomic';
  interests?: string[];
  hasChildren?: boolean;
  hasAccessibilityNeeds?: boolean;
  dietaryPreferences?: string[];
  transportPreference?: 'car' | 'public' | 'mixed' | 'walk_bike';
  budgetLevel?: 'budget' | 'moderate' | 'premium' | 'luxury';
  avoidList?: string;
  mustSeeList?: string;
}

const STYLE_LABELS: Record<string, string> = {
  cultural: 'culturel (musées, histoire, patrimoine)',
  adventure: 'aventure (sport, plein air, adrénaline)',
  romantic: 'romantique (couple, ambiance, dîners)',
  family: 'familial (enfants, ludique, accessible)',
  nightlife: 'festif (bars, clubs, vie nocturne)',
  wellness: 'bien-être (spa, yoga, détente)',
  gastronomic: 'gastronomique (restaurants, marchés, cours de cuisine)',
};

const PACE_LABELS: Record<string, string> = {
  relaxed: 'Rythme détendu : peu d\'activités, temps libre, pas de stress. Privilégie la qualité à la quantité.',
  balanced: 'Rythme équilibré : mix activités et temps libre.',
  packed: 'Rythme intensif : maximum d\'activités, journées bien remplies, on veut tout voir.',
};

const BUDGET_LABELS: Record<string, string> = {
  budget: 'Activités gratuites ou pas chères, street food, transports publics.',
  moderate: 'Mix gratuit et payant, restaurants corrects, quelques visites payantes.',
  premium: 'Restaurants gastronomiques, visites privées, expériences premium.',
  luxury: 'Tout en haut de gamme : privé, exclusif, meilleurs restaurants.',
};

export async function generateItinerary(params: ItineraryParams): Promise<Itinerary | null> {
  const {
    destination, startDate, duration, people,
    activitiesPerDay = 3,
    tripPace = 'balanced',
    tripStyle,
    interests,
    hasChildren,
    hasAccessibilityNeeds,
    dietaryPreferences,
    transportPreference,
    budgetLevel,
    avoidList,
    mustSeeList,
  } = params;

  const filters: string[] = [];
  if (tripPace) filters.push(PACE_LABELS[tripPace] || '');
  if (tripStyle) filters.push(`Style : ${STYLE_LABELS[tripStyle] || tripStyle}`);
  if (interests && interests.length > 0) filters.push(`Intérêts : ${interests.join(', ')}`);
  if (budgetLevel) filters.push(`Budget : ${BUDGET_LABELS[budgetLevel] || budgetLevel}`);
  if (hasChildren) filters.push('Voyage avec enfants : activités adaptées, accessibles, ludiques.');
  if (hasAccessibilityNeeds) filters.push('Accessibilité PMR requise : lieux accessibles fauteuil roulant.');
  if (dietaryPreferences && dietaryPreferences.length > 0) filters.push(`Régime alimentaire : ${dietaryPreferences.join(', ')} — suggestions resto adaptées.`);
  if (transportPreference === 'walk_bike') filters.push('Privilégie les activités accessibles à pied ou à vélo.');
  else if (transportPreference === 'public') filters.push('Déplacements en transports en commun uniquement.');
  else if (transportPreference === 'car') filters.push('Déplacements en voiture : inclure des lieux hors centre-ville.');
  if (mustSeeList) filters.push(`À voir absolument : ${mustSeeList}`);
  if (avoidList) filters.push(`À ÉVITER : ${avoidList}`);

  const filtersBlock = filters.length > 0 ? `\nPréférences du voyageur :\n${filters.map(f => `- ${f}`).join('\n')}` : '';

  const timeSlots = activitiesPerDay <= 2
    ? '["morning","afternoon"]'
    : activitiesPerDay <= 3
    ? '["morning","afternoon","evening"]'
    : `${activitiesPerDay} activités réparties sur morning/afternoon/evening`;

  const prompt = `Guide voyage expert. ${people} personne(s) à ${destination}, du ${startDate} sur ${duration} nuit(s).
${filtersBlock}

Génère un itinéraire avec exactement ${activitiesPerDay} activité(s) par jour, réparties sur ${timeSlots}.

Pour chaque activité :
- Titre court et accrocheur
- Description de 1-2 phrases
- Lieu EXACT (nom + quartier)
- Coordonnées GPS précises (lat/lng)
- Durée estimée
- Coût estimé/personne en EUR (0 si gratuit)
- Catégorie : sight, food, activity, nature, shopping, nightlife

JSON uniquement :
{
  "days": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "<titre du jour>",
      "summary": "<1 phrase>",
      "activities": [
        {
          "time": "morning",
          "title": "<titre>",
          "description": "<1-2 phrases>",
          "location": "<lieu précis>",
          "lat": <latitude>,
          "lng": <longitude>,
          "duration": "<durée>",
          "estimatedCost": <EUR/pers>,
          "category": "<catégorie>"
        }
      ]
    }
  ]
}`;

  const tokensNeeded = Math.min(Math.max(duration * activitiesPerDay * 200, 3500), 12000);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Guide voyage expert. JSON uniquement. Coordonnées GPS précises. Lieux et prix réels.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: tokensNeeded,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const finishReason = completion.choices[0]?.finish_reason;
    console.log(`[itinerary] ${duration}d × ${activitiesPerDay}act, tokens=${tokensNeeded}, finish=${finishReason}, len=${content?.length || 0}`);
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.days || !Array.isArray(parsed.days)) {
      console.error('[itinerary] Invalid JSON structure:', Object.keys(parsed));
      return null;
    }

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
