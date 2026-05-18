import { env } from '../config/env';
import { cities } from '../data/airports';

export type FlightCategory = 'cheapest' | 'fastest' | 'best' | 'direct' | 'standard';

export interface SerpApiFlightOffer {
  airline: string;
  airlineName: string;
  price: number;
  currency: string;
  departureAt: string;       // Outbound departure (HH:mm or full ISO)
  arrivalAt: string;         // Outbound arrival
  returnDepartureAt: string;
  returnArrivalAt: string;
  duration: string;          // Outbound duration label "Xh Ymin"
  totalMinutes: number;      // Outbound duration in minutes (for sorting)
  stops: number;
  cabinClass: string;
  bookingUrl: string;
  source: 'serpapi';
  category?: FlightCategory; // Badge label
}

function resolveIata(cityInput: string): string | null {
  const codeMatch = cityInput.match(/\(([A-Z]{3})\)/);
  if (codeMatch) return codeMatch[1];

  const cleaned = cityInput.replace(/\s*\([A-Z]{3}\)\s*$/, '').split(',')[0].trim();
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(cleaned);
  const city = cities.find(c => norm(c.name) === q);
  if (city && city.airports.length > 0) return city.airports[0].code;
  return null;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function travelClassCode(cls?: string): number {
  // Google Flights: 1=economy, 2=premium_economy, 3=business, 4=first
  if (cls === 'business') return 3;
  if (cls === 'first') return 4;
  if (cls === 'premium_economy') return 2;
  return 1;
}

// SerpAPI Google Flights: outbound_times values are "HH-HH,HH-HH"
function timeWindowFor(pref?: string): string | null {
  switch (pref) {
    case 'morning':   return '6-12,6-12';     // 6h-12h outbound + return
    case 'afternoon': return '12-18,12-18';
    case 'evening':   return '18-23,18-23';
    case 'night':     return '0-5,0-5';
    default:          return null;
  }
}

interface FetchParams {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
  directOnly?: boolean;
  timePref?: string;
  sortBy: 1 | 2 | 5; // 1=best, 2=cheapest, 5=duration
}

async function fetchSerpApi(p: FetchParams): Promise<any[]> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_flights');
  url.searchParams.set('departure_id', p.origin);
  url.searchParams.set('arrival_id', p.destination);
  url.searchParams.set('outbound_date', p.startDate);
  url.searchParams.set('return_date', p.endDate);
  url.searchParams.set('adults', String(p.people));
  url.searchParams.set('currency', 'EUR');
  url.searchParams.set('hl', 'fr');
  url.searchParams.set('gl', 'fr');
  url.searchParams.set('travel_class', String(travelClassCode(p.flightClass)));
  url.searchParams.set('type', '1');
  url.searchParams.set('sort_by', String(p.sortBy));
  if (p.directOnly) url.searchParams.set('stops', '1'); // 1 = nonstop only
  const tw = timeWindowFor(p.timePref);
  if (tw) url.searchParams.set('outbound_times', tw);
  url.searchParams.set('api_key', env.SERPAPI_KEY);

  const r = await fetch(url.toString());
  if (!r.ok) return [];
  const data: any = await r.json();
  if (data.error) return [];
  return [...(data.best_flights || []), ...(data.other_flights || [])];
}

/** Compute and attach a category badge to each offer, based on the full set. */
function categorize(offers: SerpApiFlightOffer[]): SerpApiFlightOffer[] {
  if (offers.length === 0) return offers;

  const byPrice = [...offers].sort((a, b) => a.price - b.price);
  const byDuration = [...offers].sort((a, b) => a.totalMinutes - b.totalMinutes);
  const cheapestPrice = byPrice[0].price;
  const fastestMinutes = byDuration[0].totalMinutes;

  // "Best" = lowest price among flights with duration <= 1.3x fastest
  const reasonableSpeed = offers.filter((f) => f.totalMinutes <= fastestMinutes * 1.3);
  const bestOffer = reasonableSpeed.sort((a, b) => a.price - b.price)[0];

  return offers.map((f) => {
    let category: FlightCategory = 'standard';
    if (f.price === cheapestPrice) category = 'cheapest';
    else if (f.totalMinutes === fastestMinutes) category = 'fastest';
    else if (bestOffer && f.airline === bestOffer.airline && f.price === bestOffer.price && f.totalMinutes === bestOffer.totalMinutes) {
      category = 'best';
    } else if (f.stops === 0) category = 'direct';
    return { ...f, category };
  });
}

export async function searchSerpApiFlights(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
  directFlightOnly?: boolean;
  flightTimePreference?: string;
}): Promise<{ flights: SerpApiFlightOffer[]; originCode: string; destCode: string } | null> {
  if (!env.SERPAPI_KEY) {
    console.log('SERPAPI_KEY not set, skipping SerpApi flight search');
    return null;
  }

  const originCode = resolveIata(params.departureCity);
  const destCode = resolveIata(params.destination);

  if (!originCode || !destCode) {
    console.log(`SerpApi: could not resolve IATA codes. origin=${originCode}, dest=${destCode}`);
    return null;
  }

  console.log(`SerpApi Google Flights (parallel best + cheapest): ${originCode} → ${destCode} (${params.startDate} → ${params.endDate})`);

  const fetchBase: Omit<FetchParams, 'sortBy'> = {
    origin: originCode,
    destination: destCode,
    startDate: params.startDate,
    endDate: params.endDate,
    people: params.people,
    flightClass: params.flightClass,
    directOnly: params.directFlightOnly,
    timePref: params.flightTimePreference,
  };

  // 2 calls in parallel — different sort orders cover both ends of the spectrum.
  // Google Flights only returns ~10 items per sort order; combining widens the pool.
  const [byBest, byCheapest] = await Promise.all([
    fetchSerpApi({ ...fetchBase, sortBy: 1 }).catch(() => []),
    fetchSerpApi({ ...fetchBase, sortBy: 2 }).catch(() => []),
  ]);

  const merged = [...byBest, ...byCheapest];
  if (merged.length === 0) {
    console.log('SerpApi: no flights found');
    return null;
  }

  const bookingBase = `https://www.google.com/travel/flights?q=Flights+from+${originCode}+to+${destCode}+on+${params.startDate}+through+${params.endDate}`;

  // Dedup by airline + price + duration signature
  const seen = new Set<string>();
  const flights: SerpApiFlightOffer[] = [];

  for (const it of merged) {
    const legs = it.flights || [];
    const firstLeg = legs[0] || {};
    const lastLeg = legs[legs.length - 1] || firstLeg;
    const stops = Math.max(0, legs.length - 1);
    const airlineCode = firstLeg.airline || '';
    const airlineName = firstLeg.airline || 'Compagnie';
    const totalMinutes = it.total_duration || legs.reduce((s: number, f: any) => s + (f.duration || 0), 0);

    // SerpApi Google Flights returns TOTAL price for all adults combined.
    const totalPrice = Number(it.price) || 0;
    const pricePerPerson = params.people > 0 ? totalPrice / params.people : totalPrice;
    if (pricePerPerson <= 0) continue;

    const sig = `${airlineCode}-${Math.round(pricePerPerson)}-${totalMinutes}-${firstLeg.departure_airport?.time || ''}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    flights.push({
      airline: airlineCode,
      airlineName,
      price: Math.round(pricePerPerson),
      currency: 'EUR',
      departureAt: firstLeg.departure_airport?.time || '',
      arrivalAt: lastLeg.arrival_airport?.time || '',
      returnDepartureAt: '',
      returnArrivalAt: '',
      duration: totalMinutes ? formatMinutes(totalMinutes) : '',
      totalMinutes,
      stops,
      cabinClass: params.flightClass || 'economy',
      bookingUrl: it.booking_token
        ? `https://www.google.com/travel/flights/booking?token=${it.booking_token}`
        : bookingBase,
      source: 'serpapi' as const,
    });
  }

  if (flights.length === 0) return null;

  // Sort by price ASC by default — the user sees the cheapest first.
  flights.sort((a, b) => a.price - b.price);

  // Categorize and keep up to 15
  const categorized = categorize(flights).slice(0, 15);

  console.log(`SerpApi: ${categorized.length} deduped flights, cheapest=${categorized[0]?.price}€, range=${categorized[0]?.price}-${categorized[categorized.length - 1]?.price}€`);

  return { flights: categorized, originCode, destCode };
}
