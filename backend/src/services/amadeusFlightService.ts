import { getAmadeus } from '../config/amadeus';
import { cities } from '../data/airports';
import { withSkyscannerAffiliate } from '../config/affiliates';

export interface AmadeusFlightOffer {
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
  source: 'amadeus';
}

const AIRLINE_NAMES: Record<string, string> = {
  AF: 'Air France', LH: 'Lufthansa', BA: 'British Airways', KL: 'KLM',
  FR: 'Ryanair', U2: 'easyJet', W6: 'Wizz Air', VY: 'Vueling',
  IB: 'Iberia', AZ: 'ITA Airways', SK: 'SAS', AY: 'Finnair',
  LX: 'Swiss', OS: 'Austrian', SN: 'Brussels Airlines', TP: 'TAP Portugal',
  EK: 'Emirates', QR: 'Qatar Airways', TK: 'Turkish Airlines', EY: 'Etihad',
  SQ: 'Singapore Airlines', CX: 'Cathay Pacific', NH: 'ANA', JL: 'Japan Airlines',
  DL: 'Delta', AA: 'American Airlines', UA: 'United', AC: 'Air Canada',
  AT: 'Royal Air Maroc', TO: 'Transavia', HV: 'Transavia', QS: 'SmartWings',
  PC: 'Pegasus', A3: 'Aegean', SV: 'Saudia', ET: 'Ethiopian',
};

function resolveIataCode(cityInput: string): string | null {
  const codeMatch = cityInput.match(/\(([A-Z]{3})\)/);
  if (codeMatch) return codeMatch[1];

  const cleaned = cityInput.replace(/\s*\([A-Z]{3}\)\s*$/, '').split(',')[0].trim();
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(cleaned);
  const city = cities.find(c => norm(c.name) === q);
  if (city && city.airports.length > 0) return city.airports[0].code;
  return null;
}

function buildSkyscannerLink(originCode: string, destCode: string, departDate: string, returnDate: string, adults: number, cabinClass: string): string {
  const fmt = (d: string) => d.replace(/-/g, '').slice(2);
  const cabin = cabinClass === 'BUSINESS' ? 'business' : cabinClass === 'FIRST' ? 'first' : cabinClass === 'PREMIUM_ECONOMY' ? 'premiumeconomy' : 'economy';
  return withSkyscannerAffiliate(`https://www.skyscanner.fr/transport/vols/${originCode.toLowerCase()}/${destCode.toLowerCase()}/${fmt(departDate)}/${fmt(returnDate)}/?adultes=${adults}&cabineclass=${cabin}`);
}

function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h${m.padStart(2, '0')}`;
}

export async function searchAmadeusFlights(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
}): Promise<{ flights: AmadeusFlightOffer[]; originCode: string; destCode: string } | null> {
  const amadeus = getAmadeus();
  if (!amadeus) {
    console.log('Amadeus not configured, skipping');
    return null;
  }

  const originCode = resolveIataCode(params.departureCity);
  const destCode = resolveIataCode(params.destination);

  if (!originCode || !destCode) {
    console.log(`Amadeus: could not resolve IATA codes. origin=${originCode}, dest=${destCode}`);
    return null;
  }

  const travelClass = params.flightClass === 'business' ? 'BUSINESS'
    : params.flightClass === 'first' ? 'FIRST'
    : params.flightClass === 'premium_economy' ? 'PREMIUM_ECONOMY'
    : 'ECONOMY';

  try {
    console.log(`Amadeus flight search: ${originCode} → ${destCode} (${params.startDate} → ${params.endDate}, ${params.people} pax, ${travelClass})`);

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destCode,
      departureDate: params.startDate,
      returnDate: params.endDate,
      adults: params.people,
      travelClass,
      currencyCode: 'EUR',
      max: 6,
    });

    if (!response.data || response.data.length === 0) {
      console.log('Amadeus: no flights found');
      return null;
    }

    const flights: AmadeusFlightOffer[] = response.data.map((offer: any) => {
      const outbound = offer.itineraries[0];
      const inbound = offer.itineraries[1];
      const firstSeg = outbound.segments[0];
      const lastOutSeg = outbound.segments[outbound.segments.length - 1];
      const carrierCode = firstSeg.carrierCode;
      const firstReturnSeg = inbound?.segments?.[0];
      const lastReturnSeg = inbound?.segments?.[inbound.segments.length - 1];

      const totalPrice = parseFloat(offer.price.total);
      const pricePerPerson = params.people > 1 ? Math.round(totalPrice / params.people) : Math.round(totalPrice);

      return {
        airline: carrierCode,
        airlineName: AIRLINE_NAMES[carrierCode] || carrierCode,
        price: pricePerPerson,
        currency: offer.price.currency || 'EUR',
        departureAt: firstSeg.departure.at,
        arrivalAt: lastOutSeg.arrival.at,
        returnDepartureAt: firstReturnSeg?.departure?.at || '',
        returnArrivalAt: lastReturnSeg?.arrival?.at || '',
        duration: formatDuration(outbound.duration),
        stops: outbound.segments.length - 1,
        cabinClass: travelClass,
        bookingUrl: buildSkyscannerLink(originCode, destCode, params.startDate, params.endDate, params.people, travelClass),
        source: 'amadeus' as const,
      };
    });

    flights.sort((a, b) => a.price - b.price);

    console.log(`Found ${flights.length} real Amadeus flights`);
    return { flights, originCode, destCode };
  } catch (error: any) {
    console.error('Amadeus flight search error:', error?.response?.result?.errors || error.message || error);
    return null;
  }
}
