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

/** Resolve ALL airport IATA codes for a city (Paris → CDG, ORY, BVA). */
function resolveAllIata(cityInput: string): string[] {
  const codeMatch = cityInput.match(/\(([A-Z]{3})\)/);
  if (codeMatch) return [codeMatch[1]];

  const cleaned = cityInput.replace(/\s*\([A-Z]{3}\)\s*$/, '').split(',')[0].trim();
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(cleaned);
  const city = cities.find(c => norm(c.name) === q);
  if (city && city.airports.length > 0) {
    return city.airports.map((a) => a.code);
  }
  return [];
}

/** Build a Skyscanner deep-link that pre-fills origin, dest, dates and adults. */
function buildSkyscannerDeepLink(originCode: string, destCode: string, startDate: string, endDate: string, people: number, cabinClass: string): string {
  const fmt = (d: string) => d.replace(/-/g, '').slice(2); // YYYY-MM-DD → YYMMDD
  const cabin = cabinClass === 'business' ? 'business' : cabinClass === 'first' ? 'first' : cabinClass === 'premium_economy' ? 'premiumeconomy' : 'economy';
  return `https://www.skyscanner.fr/transport/vols/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${fmt(startDate)}/${fmt(endDate)}/?adultes=${people}&cabineclass=${cabin}`;
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

  // Resolve ALL airports for both city inputs — searching CDG only when Paris
  // has CDG+ORY+BVA misses the cheaper Beauvais flights. We search up to 2
  // airports per side in parallel and keep the best.
  const originCodes = resolveAllIata(params.departureCity).slice(0, 2);
  const destCodes = resolveAllIata(params.destination).slice(0, 2);

  if (originCodes.length === 0 || destCodes.length === 0) {
    console.log(`SerpApi: could not resolve IATA codes. origins=${originCodes.join(',') || 'none'}, dests=${destCodes.join(',') || 'none'}`);
    return null;
  }

  const originCode = originCodes[0];
  const destCode = destCodes[0];

  console.log(`SerpApi Google Flights (multi-airport): origins=[${originCodes.join(',')}] → dests=[${destCodes.join(',')}] (${params.startDate} → ${params.endDate})`);

  // Build all O×D combinations × 2 sort orders. Cap at 6 calls to stay under
  // SerpAPI rate limits and within the cascade timeout budget.
  const calls: FetchParams[] = [];
  for (const o of originCodes) {
    for (const d of destCodes) {
      for (const sortBy of [1, 2] as const) {
        calls.push({
          origin: o,
          destination: d,
          startDate: params.startDate,
          endDate: params.endDate,
          people: params.people,
          flightClass: params.flightClass,
          directOnly: params.directFlightOnly,
          timePref: params.flightTimePreference,
          sortBy,
        });
      }
    }
  }

  const cappedCalls = calls.slice(0, 6);
  const results = await Promise.all(cappedCalls.map((c) => fetchSerpApi(c).catch(() => [])));
  const merged = results.flat();

  if (merged.length === 0) {
    console.log('SerpApi: no flights found across all airport combinations');
    return null;
  }

  // Skyscanner deep-link as universal fallback — reliably pre-fills origin,
  // dest, dates, adults, cabin (Google's bookingBase only kept the origin).
  const bookingBase = buildSkyscannerDeepLink(originCode, destCode, params.startDate, params.endDate, params.people, params.flightClass || 'economy');

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

    // Per-flight booking URL: Skyscanner deep-link is the most reliable —
    // pre-fills origin, dest, dates, adults, cabin so the user lands directly
    // on the filtered results page (Google's booking_token expires in hours).
    // We also try to bias toward the specific airline when its code looks valid.
    const ssOrigin = firstLeg.departure_airport?.id || originCode;
    const ssDest = lastLeg.arrival_airport?.id || destCode;
    const flightBookingUrl = buildSkyscannerDeepLink(
      ssOrigin, ssDest,
      params.startDate, params.endDate, params.people,
      params.flightClass || 'economy',
    );

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
      bookingUrl: flightBookingUrl,
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
