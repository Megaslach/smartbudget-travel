import { env } from '../config/env';
import { cities } from '../data/airports';

export interface SerpApiFlightOffer {
  airline: string;
  airlineName: string;
  price: number;
  currency: string;
  departureAt: string;
  arrivalAt: string;
  returnDepartureAt: string;
  returnArrivalAt: string;
  duration: string;
  stops: number;
  cabinClass: string;
  bookingUrl: string;
  source: 'serpapi';
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

export async function searchSerpApiFlights(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
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

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_flights');
  url.searchParams.set('departure_id', originCode);
  url.searchParams.set('arrival_id', destCode);
  url.searchParams.set('outbound_date', params.startDate);
  url.searchParams.set('return_date', params.endDate);
  url.searchParams.set('adults', String(params.people));
  url.searchParams.set('currency', 'EUR');
  url.searchParams.set('hl', 'fr');
  url.searchParams.set('gl', 'fr');
  url.searchParams.set('travel_class', String(travelClassCode(params.flightClass)));
  url.searchParams.set('type', '1'); // Round trip
  url.searchParams.set('api_key', env.SERPAPI_KEY);

  try {
    console.log(`SerpApi Google Flights: ${originCode} → ${destCode} (${params.startDate} → ${params.endDate})`);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      console.error(`SerpApi flights ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data: any = await res.json();
    if (data.error) {
      console.error('SerpApi flights error:', data.error);
      return null;
    }

    const itineraries: any[] = [...(data.best_flights || []), ...(data.other_flights || [])];
    if (itineraries.length === 0) {
      console.log('SerpApi: no flights found');
      return null;
    }

    const bookingBase = data.search_metadata?.google_flights_url
      || `https://www.google.com/travel/flights?q=Flights+from+${originCode}+to+${destCode}+on+${params.startDate}+through+${params.endDate}`;

    const flights: SerpApiFlightOffer[] = itineraries.slice(0, 8).map((it: any) => {
      const flights = it.flights || [];
      const firstLeg = flights[0] || {};
      const lastLeg = flights[flights.length - 1] || firstLeg;
      const stops = Math.max(0, flights.length - 1);
      const airlineCode = firstLeg.airline || '';
      const airlineName = firstLeg.airline || 'Compagnie';
      const totalMinutes = it.total_duration || flights.reduce((s: number, f: any) => s + (f.duration || 0), 0);

      // SerpApi Google Flights returns TOTAL price for all adults combined.
      // Divide by people to normalize to per-person.
      const totalPrice = Number(it.price) || 0;
      const pricePerPerson = params.people > 0 ? totalPrice / params.people : totalPrice;

      return {
        airline: airlineCode,
        airlineName,
        price: Math.round(pricePerPerson),
        currency: 'EUR',
        departureAt: firstLeg.departure_airport?.time || '',
        arrivalAt: lastLeg.arrival_airport?.time || '',
        returnDepartureAt: '',
        returnArrivalAt: '',
        duration: totalMinutes ? formatMinutes(totalMinutes) : '',
        stops,
        cabinClass: params.flightClass || 'economy',
        bookingUrl: it.booking_token
          ? `https://www.google.com/travel/flights/booking?token=${it.booking_token}`
          : bookingBase,
        source: 'serpapi' as const,
      };
    }).filter((f: SerpApiFlightOffer) => f.price > 0);

    flights.sort((a, b) => a.price - b.price);

    console.log(`Found ${flights.length} real SerpApi flights`);
    return { flights, originCode, destCode };
  } catch (err: any) {
    console.error('SerpApi flight search error:', err.message || err);
    return null;
  }
}
