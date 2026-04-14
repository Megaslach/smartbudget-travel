import { openai } from '../config/openai';

export interface FlightEstimate {
  avgPrice: number;
  source: string;
  note: string;
}

export interface AccommodationEstimate {
  avgPerNight: number;
  total: number;
  source: string;
  note: string;
}

export interface BudgetEstimate {
  flights: FlightEstimate;
  accommodation: AccommodationEstimate;
  food: number;
  transport: number;
  activities: number;
  total: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

interface SimulationInput {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
}

export async function estimateBudget(input: SimulationInput): Promise<BudgetEstimate> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;

  const prompt = `Tu es un expert en estimation de budget voyage. Donne une estimation RÉALISTE et DÉTAILLÉE basée sur les vrais prix du marché.

**Voyage :**
- De : ${departureCity}
- Vers : ${destination}
- Dates : du ${startDate} au ${endDate} (${duration} nuits)
- Voyageurs : ${people} personne(s)

**Consignes :**
1. VOLS : Estime le prix moyen d'un aller-retour par personne ${departureCity} → ${destination} pour ces dates. Base-toi sur les prix habituels de compagnies comme Skyscanner, Google Flights. Prends en compte la saisonnalité (haute/basse saison).
2. HÉBERGEMENT : Estime le prix moyen par nuit pour ${people} personne(s) (hôtel milieu de gamme ou Airbnb). Base-toi sur les prix Booking.com / Airbnb pour ces dates.
3. NOURRITURE : Budget quotidien réaliste par personne (petit-déj + déjeuner + dîner, mélange restaurant et street food).
4. TRANSPORT LOCAL : Transport sur place par jour par personne (métro, taxi, bus).
5. ACTIVITÉS : Budget activités/visites par jour par personne.

**Format JSON strict — retourne UNIQUEMENT ce JSON :**
{
  "flights": {
    "avgPrice": <prix aller-retour par personne en EUR>,
    "source": "Estimation basée sur Skyscanner/Google Flights",
    "note": "<précision sur la période, compagnie probable, etc.>"
  },
  "accommodation": {
    "avgPerNight": <prix moyen par nuit pour le groupe>,
    "total": <prix total hébergement>,
    "source": "Estimation basée sur Booking.com/Airbnb",
    "note": "<type de logement recommandé>"
  },
  "food": <budget nourriture total pour tout le séjour et toutes les personnes>,
  "transport": <budget transport local total>,
  "activities": <budget activités total>,
  "total": <somme de tout>,
  "currency": "EUR",
  "confidence": "<high|medium|low selon la fiabilité de l'estimation>",
  "summary": "<résumé en 2 phrases de l'estimation, mentionnant si c'est haute/basse saison>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tu es un assistant spécialisé en budget voyage. Tu donnes des estimations réalistes basées sur les vrais prix du marché. Tu réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No AI response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]) as BudgetEstimate;
    return parsed;
  } catch (error) {
    console.error('AI budget estimation failed, using fallback:', error);
    return fallbackEstimate(input);
  }
}

function fallbackEstimate(input: SimulationInput): BudgetEstimate {
  const { duration, people } = input;
  const flightPrice = 250;
  const nightPrice = 80;
  const foodPerDay = 40;
  const transportPerDay = 15;
  const activitiesPerDay = 25;

  const flights = flightPrice * people;
  const accommodation = nightPrice * duration;
  const food = foodPerDay * duration * people;
  const transport = transportPerDay * duration * people;
  const activities = activitiesPerDay * duration * people;

  return {
    flights: { avgPrice: flightPrice, source: 'Estimation par défaut', note: 'Clé API OpenAI non configurée — estimation approximative' },
    accommodation: { avgPerNight: nightPrice, total: accommodation, source: 'Estimation par défaut', note: 'Hôtel milieu de gamme' },
    food,
    transport,
    activities,
    total: flights + accommodation + food + transport + activities,
    currency: 'EUR',
    confidence: 'low',
    summary: `Estimation approximative sans IA. Configurez votre clé OpenAI pour des estimations réalistes basées sur les prix du marché.`,
  };
}
