import { env } from '../config/env';
import { cities } from '../data/airports';

export interface RealFlightOffer {
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
  source: 'skyscanner';
}

// ---- Helpers ----

function resolveIataCode(cityInput: string): string | null {
  const codeMatch = cityInput.match(/\(([A-Z]{3})\)/);
  if (codeMatch) return codeMatch[1];

  const cleaned = cityInput.replace(/\s*\([A-Z]{3}\)\s*$/, '').trim();
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(cleaned);
  const city = cities.find(c => norm(c.name) === q);
  if (city && city.airports.length > 0) return city.airports[0].code;
  return null;
}

function buildSkyscannerLink(originCode: string, destCode: string, departDate: string, returnDate: string, adults: number, cabin: string): string {
  const fmt = (d: string) => d.replace(/-/g, '').slice(2);
  return `https://www.skyscanner.fr/transport/vols/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${fmt(departDate)}/${fmt(returnDate)}/?adultes=${adults}&cabineclass=${cabin}`;
}

async function rapidApiFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error(`RapidAPI ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---- Step 1: resolve city → skyId + entityId via Sky Scrapper ----

interface SkyEntity {
  skyId: string;
  entityId: string;
  name: string;
}

async function resolveSkyScannerEntity(query: string): Promise<SkyEntity | null> {
  try {
    const data = await rapidApiFetch(
      `https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport?query=${encodeURIComponent(query)}&locale=fr-FR`
    );
    const results = data?.data;
    if (!results || results.length === 0) return null;

    const best = results[0];
    return {
      skyId: best.skyId,
      entityId: best.entityId,
      name: best.presentation?.title || query,
    };
  } catch (err) {
    console.error('Sky Scrapper airport search error:', err);
    return null;
  }
}

// ---- Step 2: search flights ----

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export async function searchRealFlights(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
}): Promise<{ flights: RealFlightOffer[]; originCode: string; destCode: string } | null> {
  if (!env.RAPIDAPI_KEY) return null;

  // Resolve IATA codes from local DB
  const originIata = resolveIataCode(params.departureCity);
  const destIata = resolveIataCode(params.destination);

  // Resolve Sky Scrapper entities (skyId + entityId needed for search)
  const originQuery = originIata || params.departureCity;
  const destQuery = destIata || params.destination;

  console.log(`Sky Scrapper: resolving "${originQuery}" and "${destQuery}"...`);

  const [originEntity, destEntity] = await Promise.all([
    resolveSkyScannerEntity(originQuery),
    resolveSkyScannerEntity(destQuery),
  ]);

  if (!originEntity || !destEntity) {
    console.log(`Could not resolve entities: origin=${originEntity?.skyId}, dest=${destEntity?.skyId}`);
    return null;
  }

  const cabinClass = params.flightClass === 'business' ? 'business'
    : params.flightClass === 'first' ? 'first'
    : params.flightClass === 'premium_economy' ? 'premium_economy'
    : 'economy';

  const originCode = originIata || originEntity.skyId;
  const destCode = destIata || destEntity.skyId;

  try {
    console.log(`Sky Scrapper flight search: ${originEntity.skyId}(${originEntity.entityId}) → ${destEntity.skyId}(${destEntity.entityId})`);

    const searchUrl = `https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlightsComplete`
      + `?originSkyId=${originEntity.skyId}`
      + `&destinationSkyId=${destEntity.skyId}`
      + `&originEntityId=${originEntity.entityId}`
      + `&destinationEntityId=${destEntity.entityId}`
      + `&date=${params.startDate}`
      + `&returnDate=${params.endDate}`
      + `&adults=${params.people}`
      + `&cabinClass=${cabinClass}`
      + `&currency=EUR`
      + `&market=FR`
      + `&locale=fr-FR`;

    const data = await rapidApiFetch(searchUrl);

    if (!data?.data?.itineraries || data.data.itineraries.length === 0) {
      console.log('No flight itineraries found');
      return null;
    }

    const skyscannerLink = buildSkyscannerLink(originCode, destCode, params.startDate, params.endDate, params.people, cabinClass);

    const flights: RealFlightOffer[] = data.data.itineraries.slice(0, 8).map((itin: any) => {
      const price = itin.price?.raw || itin.price?.formatted?.replace(/[^\d.,]/g, '') || 0;
      const outLeg = itin.legs?.[0];
      const inLeg = itin.legs?.[1];

      const carrier = outLeg?.carriers?.marketing?.[0] || {};
      const airlineName = carrier.name || 'Compagnie';
      const airlineCode = carrier.alternateId || '';

      return {
        airline: airlineCode,
        airlineName,
        price: typeof price === 'number' ? Math.round(price) : Math.round(parseFloat(String(price).replace(',', '.'))),
        currency: 'EUR',
        departureAt: outLeg?.departure || '',
        arrivalAt: outLeg?.arrival || '',
        returnDepartureAt: inLeg?.departure || '',
        returnArrivalAt: inLeg?.arrival || '',
        duration: outLeg?.durationInMinutes ? formatMinutes(outLeg.durationInMinutes) : '',
        stops: outLeg?.stopCount ?? 0,
        cabinClass,
        bookingUrl: skyscannerLink,
        source: 'skyscanner' as const,
      };
    }).filter((f: RealFlightOffer) => f.price > 0);

    flights.sort((a, b) => a.price - b.price);

    console.log(`Found ${flights.length} real Skyscanner flights`);
    return { flights, originCode, destCode };
  } catch (error: any) {
    console.error('Sky Scrapper flight search error:', error.message || error);
    return null;
  }
}
