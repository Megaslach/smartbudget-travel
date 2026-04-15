import { env } from '../config/env';
import { cities } from '../data/airports';

export interface KiwiFlightOffer {
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
  source: 'kiwi';
}

const AIRLINE_NAMES: Record<string, string> = {
  AF: 'Air France', KL: 'KLM', BA: 'British Airways', LH: 'Lufthansa', IB: 'Iberia',
  FR: 'Ryanair', U2: 'easyJet', VY: 'Vueling', TO: 'Transavia', W6: 'Wizz Air',
  AA: 'American Airlines', DL: 'Delta', UA: 'United', B6: 'JetBlue', AS: 'Alaska',
  AZ: 'ITA Airways', OS: 'Austrian', LX: 'Swiss', SN: 'Brussels Airlines', TP: 'TAP',
  EK: 'Emirates', QR: 'Qatar Airways', EY: 'Etihad', SV: 'Saudia', TK: 'Turkish Airlines',
  SQ: 'Singapore Airlines', CX: 'Cathay Pacific', JL: 'Japan Airlines', NH: 'ANA',
  QF: 'Qantas', AC: 'Air Canada', NZ: 'Air New Zealand',
};

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

function toKiwiDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function cabinCode(cls?: string): string {
  if (cls === 'business') return 'C';
  if (cls === 'first') return 'F';
  if (cls === 'premium_economy') return 'W';
  return 'M';
}

export async function searchKiwiFlights(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
}): Promise<{ flights: KiwiFlightOffer[]; originCode: string; destCode: string } | null> {
  if (!env.KIWI_API_KEY) {
    console.log('KIWI_API_KEY not set, skipping Kiwi search');
    return null;
  }

  const originCode = resolveIata(params.departureCity);
  const destCode = resolveIata(params.destination);

  if (!originCode || !destCode) {
    console.log(`Kiwi: could not resolve IATA codes. origin=${originCode}, dest=${destCode}`);
    return null;
  }

  const url = new URL('https://api.tequila.kiwi.com/v2/search');
  url.searchParams.set('fly_from', originCode);
  url.searchParams.set('fly_to', destCode);
  url.searchParams.set('date_from', toKiwiDate(params.startDate));
  url.searchParams.set('date_to', toKiwiDate(params.startDate));
  url.searchParams.set('return_from', toKiwiDate(params.endDate));
  url.searchParams.set('return_to', toKiwiDate(params.endDate));
  url.searchParams.set('adults', String(params.people));
  url.searchParams.set('curr', 'EUR');
  url.searchParams.set('locale', 'fr');
  url.searchParams.set('limit', '10');
  url.searchParams.set('sort', 'price');
  url.searchParams.set('selected_cabins', cabinCode(params.flightClass));

  try {
    console.log(`Kiwi flight search: ${originCode} → ${destCode} (${params.startDate} → ${params.endDate})`);

    const res = await fetch(url.toString(), {
      headers: { apikey: env.KIWI_API_KEY, Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Kiwi API ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const items = data?.data;
    if (!items || items.length === 0) {
      console.log('No Kiwi flights found');
      return null;
    }

    const flights: KiwiFlightOffer[] = items.slice(0, 8).map((it: any) => {
      const legs = it.route || [];
      const outbound = legs.filter((r: any) => r.return === 0);
      const inbound = legs.filter((r: any) => r.return === 1);
      const firstOut = outbound[0] || legs[0];
      const lastOut = outbound[outbound.length - 1] || firstOut;
      const firstIn = inbound[0];
      const lastIn = inbound[inbound.length - 1];
      const airlineCode = firstOut?.airline || it.airlines?.[0] || '';
      const totalStops = Math.max(0, outbound.length - 1);

      // Kiwi Tequila returns TOTAL price for all passengers (adults param).
      // Divide by people to normalize to per-person.
      const totalPrice = Number(it.price) || 0;
      const pricePerPerson = params.people > 0 ? totalPrice / params.people : totalPrice;

      return {
        airline: airlineCode,
        airlineName: AIRLINE_NAMES[airlineCode] || airlineCode || 'Compagnie',
        price: Math.round(pricePerPerson),
        currency: 'EUR',
        departureAt: firstOut?.local_departure || firstOut?.utc_departure || '',
        arrivalAt: lastOut?.local_arrival || lastOut?.utc_arrival || '',
        returnDepartureAt: firstIn?.local_departure || firstIn?.utc_departure || '',
        returnArrivalAt: lastIn?.local_arrival || lastIn?.utc_arrival || '',
        duration: it.duration?.departure ? formatSeconds(it.duration.departure) : '',
        stops: totalStops,
        cabinClass: cabinCode(params.flightClass),
        bookingUrl: it.deep_link || `https://www.kiwi.com/fr/search/results/${originCode}/${destCode}/${params.startDate}/${params.endDate}`,
        source: 'kiwi' as const,
      };
    }).filter((f: KiwiFlightOffer) => f.price > 0);

    flights.sort((a, b) => a.price - b.price);

    console.log(`Found ${flights.length} real Kiwi flights`);
    return { flights, originCode, destCode };
  } catch (err: any) {
    console.error('Kiwi flight search error:', err.message || err);
    return null;
  }
}
