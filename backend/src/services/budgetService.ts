import { openai } from '../config/openai';

export interface FlightOption {
  airline: string;
  price: number;
  type: string;
  bookingUrl: string;
}

export interface HotelOption {
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  bookingUrl: string;
}

export interface ActivityOption {
  name: string;
  price: number;
  duration: string;
  bookingUrl: string;
}

export interface FlightEstimate {
  avgPrice: number;
  source: string;
  note: string;
  options: FlightOption[];
  searchUrl: string;
}

export interface AccommodationEstimate {
  avgPerNight: number;
  total: number;
  source: string;
  note: string;
  options: HotelOption[];
  searchUrl: string;
}

export interface ActivitiesEstimate {
  total: number;
  perDayPerPerson: number;
  options: ActivityOption[];
  searchUrl: string;
}

export interface BudgetEstimate {
  flights: FlightEstimate;
  accommodation: AccommodationEstimate;
  food: number;
  transport: number;
  activities: ActivitiesEstimate;
  total: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

export interface SimulationInput {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  departureAirport?: string;
  arrivalAirport?: string;
}

function buildSearchUrls(input: SimulationInput) {
  const { destination, departureCity, startDate, endDate, people, departureAirport, arrivalAirport } = input;
  const destEnc = encodeURIComponent(destination);
  const depEnc = encodeURIComponent(departureCity);
  const sd = startDate.replace(/-/g, '');
  const ed = endDate.replace(/-/g, '');

  return {
    skyscanner: `https://www.skyscanner.fr/transport/vols/${depEnc}/${destEnc}/${sd}/${ed}/`,
    googleFlights: `https://www.google.com/travel/flights?q=Flights+from+${depEnc}+to+${destEnc}+on+${startDate}+return+${endDate}`,
    booking: `https://www.booking.com/searchresults.fr.html?ss=${destEnc}&checkin=${startDate}&checkout=${endDate}&group_adults=${people}`,
    airbnb: `https://www.airbnb.fr/s/${destEnc}/homes?checkin=${startDate}&checkout=${endDate}&adults=${people}`,
    getyourguide: `https://www.getyourguide.fr/s/?q=${destEnc}`,
    tripadvisor: `https://www.tripadvisor.fr/Search?q=${destEnc}`,
  };
}

export async function estimateBudget(input: SimulationInput): Promise<BudgetEstimate> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;
  const urls = buildSearchUrls(input);

  const prompt = `Tu es un expert en voyages avec une connaissance approfondie des prix réels du marché. Donne une estimation RÉALISTE et DÉTAILLÉE.

**Voyage :**
- De : ${departureCity} → ${destination}
- Dates : ${startDate} au ${endDate} (${duration} nuits)
- Voyageurs : ${people}

**Retourne ce JSON EXACT (pas de texte autour) :**
{
  "flights": {
    "avgPrice": <prix moyen A/R par personne EUR>,
    "note": "<haute/basse saison, compagnies courantes>",
    "options": [
      {"airline": "<compagnie 1>", "price": <prix EUR>, "type": "direct ou escale"},
      {"airline": "<compagnie 2>", "price": <prix EUR>, "type": "direct ou escale"},
      {"airline": "<compagnie 3 low-cost>", "price": <prix EUR>, "type": "direct ou escale"}
    ]
  },
  "accommodation": {
    "avgPerNight": <prix moyen/nuit pour le groupe>,
    "total": <total hébergement>,
    "note": "<quartier recommandé>",
    "options": [
      {"name": "<nom hôtel réaliste 1>", "type": "Hôtel 3*", "pricePerNight": <prix>, "rating": <4.2>},
      {"name": "<nom hôtel réaliste 2>", "type": "Hôtel 4*", "pricePerNight": <prix>, "rating": <4.5>},
      {"name": "<nom Airbnb réaliste>", "type": "Airbnb", "pricePerNight": <prix>, "rating": <4.6>}
    ]
  },
  "food": <budget total nourriture>,
  "transport": <budget total transport local>,
  "activities": {
    "total": <budget total activités>,
    "perDayPerPerson": <budget activités/jour/pers>,
    "options": [
      {"name": "<activité incontournable 1>", "price": <prix par pers>, "duration": "<durée>"},
      {"name": "<activité incontournable 2>", "price": <prix par pers>, "duration": "<durée>"},
      {"name": "<activité incontournable 3>", "price": <prix par pers>, "duration": "<durée>"},
      {"name": "<activité incontournable 4>", "price": <prix par pers>, "duration": "<durée>"}
    ]
  },
  "total": <somme de tout : flights.avgPrice*${people} + accommodation.total + food + transport + activities.total>,
  "currency": "EUR",
  "confidence": "<high|medium|low>",
  "summary": "<2 phrases : résumé + conseil saisonnier>"
}

IMPORTANT : Les noms d'hôtels, d'activités et de compagnies doivent être RÉELS et existants. Les prix doivent refléter le marché actuel.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Expert budget voyage. Prix réalistes basés sur Skyscanner, Booking, Airbnb, GetYourGuide. JSON uniquement.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No AI response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);

    // Enrich with booking URLs
    parsed.flights.source = 'Estimation Skyscanner / Google Flights';
    parsed.flights.searchUrl = urls.skyscanner;
    parsed.flights.options = (parsed.flights.options || []).map((f: any) => ({
      ...f,
      bookingUrl: urls.googleFlights,
    }));

    parsed.accommodation.source = 'Estimation Booking.com / Airbnb';
    parsed.accommodation.searchUrl = urls.booking;
    parsed.accommodation.options = (parsed.accommodation.options || []).map((h: any) => ({
      ...h,
      bookingUrl: h.type === 'Airbnb' ? urls.airbnb : urls.booking,
    }));

    parsed.activities.searchUrl = urls.getyourguide;
    parsed.activities.options = (parsed.activities.options || []).map((a: any) => ({
      ...a,
      bookingUrl: urls.getyourguide,
    }));

    return parsed as BudgetEstimate;
  } catch (error) {
    console.error('AI budget estimation failed, using fallback:', error);
    return fallbackEstimate(input);
  }
}

function fallbackEstimate(input: SimulationInput): BudgetEstimate {
  const { duration, people } = input;
  const urls = buildSearchUrls(input);

  return {
    flights: {
      avgPrice: 250,
      source: 'Estimation par défaut',
      note: 'Configurez OpenAI pour des prix réels',
      searchUrl: urls.skyscanner,
      options: [
        { airline: 'Rechercher sur Skyscanner', price: 250, type: 'Voir les offres', bookingUrl: urls.skyscanner },
      ],
    },
    accommodation: {
      avgPerNight: 80,
      total: 80 * duration,
      source: 'Estimation par défaut',
      note: 'Hôtel milieu de gamme',
      searchUrl: urls.booking,
      options: [
        { name: 'Rechercher sur Booking.com', type: 'Hôtel', pricePerNight: 80, rating: 4.0, bookingUrl: urls.booking },
        { name: 'Rechercher sur Airbnb', type: 'Airbnb', pricePerNight: 70, rating: 4.2, bookingUrl: urls.airbnb },
      ],
    },
    food: 40 * duration * people,
    transport: 15 * duration * people,
    activities: {
      total: 25 * duration * people,
      perDayPerPerson: 25,
      searchUrl: urls.getyourguide,
      options: [
        { name: 'Rechercher sur GetYourGuide', price: 25, duration: 'Variable', bookingUrl: urls.getyourguide },
      ],
    },
    total: 250 * people + 80 * duration + 40 * duration * people + 15 * duration * people + 25 * duration * people,
    currency: 'EUR',
    confidence: 'low',
    summary: 'Estimation approximative. Configurez votre clé OpenAI pour des prix réalistes.',
  };
}
