// Budget-first trip discovery.
// Given a budget (total or per-person), suggest destinations that fit.
// Uses a hand-curated cost matrix per destination + rough flight cost heuristics
// (much faster than calling estimateBudget for 50 cities — would take 5 min).

interface DestinationCost {
  name: string;
  country: string;
  countryCode: string;
  emoji: string;
  // Daily cost per person in EUR for a "moderate" budget style:
  // accommodation + food + activities + local transport.
  perDayPerPerson: number;
  // Distance bucket from Western Europe (used to estimate flight cost).
  flightBucket: 'short' | 'medium' | 'long' | 'very_long';
  bestMonths: string[];
  tags: string[];
}

// Curated list — 60 popular destinations with rough cost estimates.
// Values come from common travel-cost references (Numbeo, Lonely Planet 2025).
const DESTINATIONS: DestinationCost[] = [
  // Europe — short flights from Paris
  { name: 'Barcelone',  country: 'Espagne',    countryCode: 'ES', emoji: '🇪🇸', perDayPerPerson: 85,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],     tags: ['plage', 'culture', 'gastronomie'] },
  { name: 'Lisbonne',   country: 'Portugal',   countryCode: 'PT', emoji: '🇵🇹', perDayPerPerson: 75,  flightBucket: 'short',  bestMonths: ['Mar', 'Avr', 'Mai', 'Oct'],      tags: ['culture', 'gastronomie', 'plage'] },
  { name: 'Porto',      country: 'Portugal',   countryCode: 'PT', emoji: '🇵🇹', perDayPerPerson: 70,  flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep', 'Oct'],      tags: ['gastronomie', 'culture'] },
  { name: 'Rome',       country: 'Italie',     countryCode: 'IT', emoji: '🇮🇹', perDayPerPerson: 100, flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'histoire', 'gastronomie'] },
  { name: 'Venise',     country: 'Italie',     countryCode: 'IT', emoji: '🇮🇹', perDayPerPerson: 110, flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['romantique', 'culture'] },
  { name: 'Florence',   country: 'Italie',     countryCode: 'IT', emoji: '🇮🇹', perDayPerPerson: 95,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'histoire'] },
  { name: 'Naples',     country: 'Italie',     countryCode: 'IT', emoji: '🇮🇹', perDayPerPerson: 80,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['gastronomie', 'plage'] },
  { name: 'Madrid',     country: 'Espagne',    countryCode: 'ES', emoji: '🇪🇸', perDayPerPerson: 90,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'gastronomie', 'nightlife'] },
  { name: 'Séville',    country: 'Espagne',    countryCode: 'ES', emoji: '🇪🇸', perDayPerPerson: 75,  flightBucket: 'short',  bestMonths: ['Mar', 'Avr', 'Mai', 'Oct'],      tags: ['culture', 'histoire'] },
  { name: 'Berlin',     country: 'Allemagne',  countryCode: 'DE', emoji: '🇩🇪', perDayPerPerson: 90,  flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû', 'Sep'], tags: ['culture', 'nightlife', 'histoire'] },
  { name: 'Munich',     country: 'Allemagne',  countryCode: 'DE', emoji: '🇩🇪', perDayPerPerson: 110, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep'],             tags: ['culture', 'gastronomie'] },
  { name: 'Amsterdam',  country: 'Pays-Bas',   countryCode: 'NL', emoji: '🇳🇱', perDayPerPerson: 120, flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Jun', 'Sep'],      tags: ['culture', 'nightlife'] },
  { name: 'Bruxelles',  country: 'Belgique',   countryCode: 'BE', emoji: '🇧🇪', perDayPerPerson: 95,  flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep'],             tags: ['gastronomie', 'culture'] },
  { name: 'Vienne',     country: 'Autriche',   countryCode: 'AT', emoji: '🇦🇹', perDayPerPerson: 105, flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'romantique'] },
  { name: 'Prague',     country: 'République tchèque', countryCode: 'CZ', emoji: '🇨🇿', perDayPerPerson: 65, flightBucket: 'short', bestMonths: ['Mai', 'Jui', 'Sep'],     tags: ['culture', 'nightlife'] },
  { name: 'Budapest',   country: 'Hongrie',    countryCode: 'HU', emoji: '🇭🇺', perDayPerPerson: 55,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'wellness', 'nightlife'] },
  { name: 'Cracovie',   country: 'Pologne',    countryCode: 'PL', emoji: '🇵🇱', perDayPerPerson: 55,  flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep'],             tags: ['culture', 'histoire'] },
  { name: 'Varsovie',   country: 'Pologne',    countryCode: 'PL', emoji: '🇵🇱', perDayPerPerson: 50,  flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep'],             tags: ['culture', 'histoire'] },
  { name: 'Athènes',    country: 'Grèce',      countryCode: 'GR', emoji: '🇬🇷', perDayPerPerson: 75,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['histoire', 'culture'] },
  { name: 'Santorin',   country: 'Grèce',      countryCode: 'GR', emoji: '🇬🇷', perDayPerPerson: 130, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Sep'],             tags: ['plage', 'romantique'] },
  { name: 'Mykonos',    country: 'Grèce',      countryCode: 'GR', emoji: '🇬🇷', perDayPerPerson: 150, flightBucket: 'short',  bestMonths: ['Jui', 'Jul', 'Aoû', 'Sep'],      tags: ['plage', 'nightlife'] },
  { name: 'Istanbul',   country: 'Turquie',    countryCode: 'TR', emoji: '🇹🇷', perDayPerPerson: 50,  flightBucket: 'medium', bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'gastronomie', 'histoire'] },
  { name: 'Londres',    country: 'Royaume-Uni',countryCode: 'GB', emoji: '🇬🇧', perDayPerPerson: 150, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû', 'Sep'], tags: ['culture', 'shopping'] },
  { name: 'Edimbourg',  country: 'Royaume-Uni',countryCode: 'GB', emoji: '🇬🇧', perDayPerPerson: 100, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû', 'Sep'], tags: ['culture', 'nature', 'histoire'] },
  { name: 'Dublin',     country: 'Irlande',    countryCode: 'IE', emoji: '🇮🇪', perDayPerPerson: 120, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû', 'Sep'], tags: ['culture', 'nightlife', 'nature'] },
  { name: 'Reykjavik',  country: 'Islande',    countryCode: 'IS', emoji: '🇮🇸', perDayPerPerson: 170, flightBucket: 'medium', bestMonths: ['Jui', 'Jul', 'Aoû'],             tags: ['nature', 'aventure'] },
  { name: 'Copenhague', country: 'Danemark',   countryCode: 'DK', emoji: '🇩🇰', perDayPerPerson: 140, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû'],      tags: ['culture', 'gastronomie'] },
  { name: 'Stockholm',  country: 'Suède',      countryCode: 'SE', emoji: '🇸🇪', perDayPerPerson: 135, flightBucket: 'short',  bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû'],      tags: ['culture', 'nature'] },
  { name: 'Oslo',       country: 'Norvège',    countryCode: 'NO', emoji: '🇳🇴', perDayPerPerson: 150, flightBucket: 'short',  bestMonths: ['Jui', 'Jul', 'Aoû'],             tags: ['nature', 'aventure'] },
  { name: 'Helsinki',   country: 'Finlande',   countryCode: 'FI', emoji: '🇫🇮', perDayPerPerson: 130, flightBucket: 'short',  bestMonths: ['Jui', 'Jul', 'Aoû'],             tags: ['nature', 'culture'] },

  // Morocco / North Africa — medium flight
  { name: 'Marrakech',  country: 'Maroc',      countryCode: 'MA', emoji: '🇲🇦', perDayPerPerson: 50,  flightBucket: 'short',  bestMonths: ['Mar', 'Avr', 'Oct', 'Nov'],      tags: ['culture', 'aventure'] },
  { name: 'Fès',        country: 'Maroc',      countryCode: 'MA', emoji: '🇲🇦', perDayPerPerson: 45,  flightBucket: 'short',  bestMonths: ['Mar', 'Avr', 'Oct', 'Nov'],      tags: ['culture', 'histoire'] },
  { name: 'Le Caire',   country: 'Égypte',     countryCode: 'EG', emoji: '🇪🇬', perDayPerPerson: 55,  flightBucket: 'medium', bestMonths: ['Oct', 'Nov', 'Mar', 'Avr'],      tags: ['histoire', 'culture'] },
  { name: 'Tunis',      country: 'Tunisie',    countryCode: 'TN', emoji: '🇹🇳', perDayPerPerson: 45,  flightBucket: 'short',  bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['plage', 'histoire'] },
  { name: 'Le Cap',     country: 'Afrique du Sud', countryCode: 'ZA', emoji: '🇿🇦', perDayPerPerson: 75, flightBucket: 'very_long', bestMonths: ['Nov', 'Déc', 'Jan', 'Fév'], tags: ['nature', 'plage', 'aventure'] },

  // Middle East
  { name: 'Dubaï',      country: 'Émirats',    countryCode: 'AE', emoji: '🇦🇪', perDayPerPerson: 150, flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar'], tags: ['shopping', 'luxe', 'plage'] },
  { name: 'Petra',      country: 'Jordanie',   countryCode: 'JO', emoji: '🇯🇴', perDayPerPerson: 80,  flightBucket: 'medium', bestMonths: ['Mar', 'Avr', 'Mai', 'Oct', 'Nov'], tags: ['histoire', 'aventure'] },

  // Asia
  { name: 'Bangkok',    country: 'Thaïlande',  countryCode: 'TH', emoji: '🇹🇭', perDayPerPerson: 40,  flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév'],      tags: ['gastronomie', 'culture', 'nightlife'] },
  { name: 'Phuket',     country: 'Thaïlande',  countryCode: 'TH', emoji: '🇹🇭', perDayPerPerson: 60,  flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar'], tags: ['plage', 'nightlife'] },
  { name: 'Chiang Mai', country: 'Thaïlande',  countryCode: 'TH', emoji: '🇹🇭', perDayPerPerson: 35,  flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév'],      tags: ['nature', 'culture', 'aventure'] },
  { name: 'Bali',       country: 'Indonésie',  countryCode: 'ID', emoji: '🇮🇩', perDayPerPerson: 50,  flightBucket: 'very_long', bestMonths: ['Avr', 'Mai', 'Jui', 'Sep'],   tags: ['plage', 'wellness', 'nature'] },
  { name: 'Tokyo',      country: 'Japon',      countryCode: 'JP', emoji: '🇯🇵', perDayPerPerson: 130, flightBucket: 'very_long', bestMonths: ['Mar', 'Avr', 'Oct', 'Nov'],   tags: ['culture', 'gastronomie', 'shopping'] },
  { name: 'Kyoto',      country: 'Japon',      countryCode: 'JP', emoji: '🇯🇵', perDayPerPerson: 110, flightBucket: 'very_long', bestMonths: ['Mar', 'Avr', 'Oct', 'Nov'],   tags: ['culture', 'histoire'] },
  { name: 'Séoul',      country: 'Corée du Sud', countryCode: 'KR', emoji: '🇰🇷', perDayPerPerson: 90, flightBucket: 'very_long', bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],   tags: ['culture', 'gastronomie', 'shopping'] },
  { name: 'Hong Kong',  country: 'Hong Kong',  countryCode: 'HK', emoji: '🇭🇰', perDayPerPerson: 120, flightBucket: 'very_long', bestMonths: ['Oct', 'Nov', 'Mar', 'Avr'],   tags: ['shopping', 'gastronomie'] },
  { name: 'Singapour',  country: 'Singapour',  countryCode: 'SG', emoji: '🇸🇬', perDayPerPerson: 130, flightBucket: 'very_long', bestMonths: ['Fév', 'Mar', 'Avr', 'Sep'],   tags: ['shopping', 'gastronomie'] },
  { name: 'Hanoï',      country: 'Vietnam',    countryCode: 'VN', emoji: '🇻🇳', perDayPerPerson: 35,  flightBucket: 'long',   bestMonths: ['Sep', 'Oct', 'Nov', 'Mar', 'Avr'], tags: ['culture', 'gastronomie'] },
  { name: 'Hoi An',     country: 'Vietnam',    countryCode: 'VN', emoji: '🇻🇳', perDayPerPerson: 40,  flightBucket: 'long',   bestMonths: ['Fév', 'Mar', 'Avr', 'Mai'],      tags: ['culture', 'plage'] },
  { name: 'Delhi',      country: 'Inde',       countryCode: 'IN', emoji: '🇮🇳', perDayPerPerson: 40,  flightBucket: 'long',   bestMonths: ['Oct', 'Nov', 'Fév', 'Mar'],      tags: ['culture', 'histoire'] },
  { name: 'Goa',        country: 'Inde',       countryCode: 'IN', emoji: '🇮🇳', perDayPerPerson: 35,  flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar'], tags: ['plage', 'nightlife'] },

  // Americas
  { name: 'New York',   country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', perDayPerPerson: 180, flightBucket: 'long',   bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],      tags: ['culture', 'shopping', 'nightlife'] },
  { name: 'Los Angeles',country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', perDayPerPerson: 170, flightBucket: 'very_long', bestMonths: ['Avr', 'Mai', 'Sep', 'Oct'],   tags: ['plage', 'shopping'] },
  { name: 'Miami',      country: 'États-Unis', countryCode: 'US', emoji: '🇺🇸', perDayPerPerson: 160, flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Mar', 'Avr'],      tags: ['plage', 'nightlife'] },
  { name: 'Montréal',   country: 'Canada',     countryCode: 'CA', emoji: '🇨🇦', perDayPerPerson: 110, flightBucket: 'long',   bestMonths: ['Jui', 'Jul', 'Aoû', 'Sep'],      tags: ['culture', 'gastronomie'] },
  { name: 'Toronto',    country: 'Canada',     countryCode: 'CA', emoji: '🇨🇦', perDayPerPerson: 120, flightBucket: 'long',   bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû', 'Sep'], tags: ['culture', 'shopping'] },
  { name: 'Mexico',     country: 'Mexique',    countryCode: 'MX', emoji: '🇲🇽', perDayPerPerson: 55,  flightBucket: 'long',   bestMonths: ['Oct', 'Nov', 'Mar', 'Avr'],      tags: ['culture', 'histoire'] },
  { name: 'Cancún',     country: 'Mexique',    countryCode: 'MX', emoji: '🇲🇽', perDayPerPerson: 90,  flightBucket: 'long',   bestMonths: ['Nov', 'Déc', 'Jan', 'Fév', 'Mar'], tags: ['plage', 'nightlife'] },
  { name: 'Rio',        country: 'Brésil',     countryCode: 'BR', emoji: '🇧🇷', perDayPerPerson: 70,  flightBucket: 'very_long', bestMonths: ['Déc', 'Jan', 'Fév', 'Mar'],   tags: ['plage', 'nightlife', 'aventure'] },
  { name: 'Buenos Aires',country: 'Argentine', countryCode: 'AR', emoji: '🇦🇷', perDayPerPerson: 55,  flightBucket: 'very_long', bestMonths: ['Oct', 'Nov', 'Mar', 'Avr'],   tags: ['culture', 'nightlife', 'gastronomie'] },
  { name: 'Cusco',      country: 'Pérou',      countryCode: 'PE', emoji: '🇵🇪', perDayPerPerson: 55,  flightBucket: 'very_long', bestMonths: ['Mai', 'Jui', 'Jul', 'Aoû'],   tags: ['aventure', 'culture', 'nature'] },

  // Oceania
  { name: 'Sydney',     country: 'Australie',  countryCode: 'AU', emoji: '🇦🇺', perDayPerPerson: 130, flightBucket: 'very_long', bestMonths: ['Oct', 'Nov', 'Mar', 'Avr'],   tags: ['plage', 'culture'] },

  // Indian Ocean
  { name: 'Maurice',    country: 'Île Maurice',countryCode: 'MU', emoji: '🇲🇺', perDayPerPerson: 85,  flightBucket: 'very_long', bestMonths: ['Mai', 'Jui', 'Sep', 'Oct'],   tags: ['plage', 'wellness', 'romantique'] },
  { name: 'Saint-Denis',country: 'Réunion',    countryCode: 'RE', emoji: '🇷🇪', perDayPerPerson: 80,  flightBucket: 'very_long', bestMonths: ['Mai', 'Jui', 'Sep', 'Oct', 'Nov'], tags: ['nature', 'aventure', 'plage'] },
];

// Rough round-trip flight cost per person from Western Europe (Paris-area).
const FLIGHT_COST: Record<DestinationCost['flightBucket'], { min: number; avg: number; max: number }> = {
  short:     { min: 60,   avg: 150,  max: 280  },
  medium:    { min: 180,  avg: 320,  max: 500  },
  long:      { min: 380,  avg: 650,  max: 950  },
  very_long: { min: 650,  avg: 950,  max: 1400 },
};

export interface ProposeTripsInput {
  budgetTotal?: number;
  budgetPerPerson?: number;
  people: number;
  destination?: string;
  departureCity?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
}

export interface TripProposalOut {
  destination: string;
  country: string;
  countryCode: string;
  emoji: string;
  durationDays: number;
  people: number;
  estimatedTotal: number;
  perPerson: number;
  fitsBudget: boolean;
  breakdown: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
  reason?: string;
  bestMonths?: string[];
  imageQuery?: string;
}

/** Estimate a trip's total cost (rough but realistic). */
function estimateTrip(d: DestinationCost, durationDays: number, people: number, includeFlights = true) {
  const flightAvg = FLIGHT_COST[d.flightBucket].avg;
  const flights = includeFlights ? flightAvg * people : 0;
  // Split the perDay budget into rough categories
  const accomPerNight = d.perDayPerPerson * 0.4;
  const foodPerDay    = d.perDayPerPerson * 0.30;
  const actPerDay     = d.perDayPerPerson * 0.20;
  const transPerDay   = d.perDayPerPerson * 0.10;
  const nights = Math.max(1, durationDays - 1);

  const accommodation = Math.round(accomPerNight * nights * Math.ceil(people / 2)); // 1 room per 2 ppl
  const food          = Math.round(foodPerDay * durationDays * people);
  const activities    = Math.round(actPerDay * durationDays * people);
  const transport     = Math.round(transPerDay * durationDays * people);
  const total = flights + accommodation + food + activities + transport;

  return {
    breakdown: { flights, accommodation, food, activities, transport },
    total,
  };
}

function toProposal(d: DestinationCost, durationDays: number, people: number, budgetCap: number): TripProposalOut {
  const est = estimateTrip(d, durationDays, people);
  return {
    destination: d.name,
    country: d.country,
    countryCode: d.countryCode,
    emoji: d.emoji,
    durationDays,
    people,
    estimatedTotal: Math.round(est.total),
    perPerson: Math.round(est.total / people),
    fitsBudget: est.total <= budgetCap,
    breakdown: est.breakdown,
    bestMonths: d.bestMonths,
    imageQuery: d.name.toLowerCase(),
  };
}

/** Best-effort match between a free-text destination input and our curated list. */
function matchDestination(input: string): DestinationCost | null {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(input.split(',')[0].trim());
  if (!q) return null;
  // Exact match first
  const exact = DESTINATIONS.find((d) => norm(d.name) === q);
  if (exact) return exact;
  // Prefix match
  const prefix = DESTINATIONS.find((d) => norm(d.name).startsWith(q));
  if (prefix) return prefix;
  // Country match
  const country = DESTINATIONS.find((d) => norm(d.country).includes(q));
  return country || null;
}

export function proposeTrips(input: ProposeTripsInput): {
  proposals: TripProposalOut[];
  feasibility?: 'ok' | 'tight' | 'impossible';
  advice?: string;
  alternatives?: TripProposalOut[];
} {
  const people = Math.max(1, input.people || 1);
  const budgetTotal = input.budgetTotal ?? (input.budgetPerPerson ? input.budgetPerPerson * people : 0);
  if (budgetTotal <= 0) {
    return { proposals: [], feasibility: 'impossible', advice: 'Budget requis.' };
  }

  // Resolve duration: either from explicit days, or from dates, or default 7
  let durationDays = input.durationDays ?? 7;
  if (input.startDate && input.endDate) {
    const ms = new Date(input.endDate).getTime() - new Date(input.startDate).getTime();
    if (ms > 0) durationDays = Math.max(1, Math.round(ms / 86400000));
  }

  // --- Path 1: specific destination requested ---
  if (input.destination) {
    const d = matchDestination(input.destination);
    if (!d) {
      // Unknown destination — return budget-only suggestions as alternatives
      const all = DESTINATIONS.map((dest) => toProposal(dest, durationDays, people, budgetTotal))
        .filter((p) => p.fitsBudget)
        .sort((a, b) => a.estimatedTotal - b.estimatedTotal)
        .slice(0, 6);
      return {
        proposals: [],
        feasibility: 'impossible',
        advice: `Destination "${input.destination}" inconnue. Voici des propositions qui rentrent dans ton budget de ${budgetTotal}€.`,
        alternatives: all,
      };
    }

    const proposal = toProposal(d, durationDays, people, budgetTotal);
    if (proposal.fitsBudget) {
      const margin = budgetTotal - proposal.estimatedTotal;
      return {
        proposals: [proposal],
        feasibility: margin / budgetTotal > 0.15 ? 'ok' : 'tight',
        advice: margin / budgetTotal > 0.15
          ? `${d.name} rentre confortablement dans ton budget (marge ${Math.round(margin)}€).`
          : `${d.name} rentre tout juste dans ton budget — prévois une marge pour les imprévus.`,
      };
    }

    // Too expensive → 1) try shorter duration, 2) suggest cheaper alternatives in same region/tags
    const shorterDays = Math.max(3, durationDays - 2);
    const shorter = toProposal(d, shorterDays, people, budgetTotal);
    const advice: string[] = [];
    advice.push(`${d.name} dépasse ton budget de ${Math.round(proposal.estimatedTotal - budgetTotal)}€ pour ${durationDays} jours à ${people} pers.`);
    if (shorter.fitsBudget) {
      advice.push(`Avec ${shorterDays} jours au lieu de ${durationDays}, ça rentre (${shorter.estimatedTotal}€).`);
    }
    advice.push('Voici des destinations proches en style mais moins chères :');

    // Find cheaper destinations with overlapping tags
    const alternatives = DESTINATIONS
      .filter((alt) => alt.name !== d.name && alt.tags.some((t) => d.tags.includes(t)))
      .map((alt) => toProposal(alt, durationDays, people, budgetTotal))
      .filter((p) => p.fitsBudget)
      .sort((a, b) => a.estimatedTotal - b.estimatedTotal)
      .slice(0, 5);

    return {
      proposals: [proposal],
      feasibility: 'impossible',
      advice: advice.join(' '),
      alternatives,
    };
  }

  // --- Path 2: no destination — return top affordable destinations ---
  const all = DESTINATIONS
    .map((d) => toProposal(d, durationDays, people, budgetTotal))
    .filter((p) => p.fitsBudget)
    .sort((a, b) => {
      // Prefer those using ~50-90% of budget (sweet spot), penalize the very cheap ones (likely under-spec)
      const targetA = a.estimatedTotal / budgetTotal;
      const targetB = b.estimatedTotal / budgetTotal;
      const scoreA = targetA < 0.4 ? targetA + 1 : Math.abs(targetA - 0.75);
      const scoreB = targetB < 0.4 ? targetB + 1 : Math.abs(targetB - 0.75);
      return scoreA - scoreB;
    })
    .slice(0, 8);

  if (all.length === 0) {
    // Budget too low — show the cheapest 3 anyway with a note
    const cheapest = DESTINATIONS
      .map((d) => toProposal(d, durationDays, people, budgetTotal))
      .sort((a, b) => a.estimatedTotal - b.estimatedTotal)
      .slice(0, 3);
    return {
      proposals: [],
      feasibility: 'impossible',
      advice: `Budget de ${budgetTotal}€ pour ${people} pers / ${durationDays} jours trop juste pour nos destinations. Voici les 3 moins chères, qui dépassent légèrement.`,
      alternatives: cheapest,
    };
  }

  return { proposals: all, feasibility: 'ok' };
}
