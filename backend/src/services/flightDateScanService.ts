import { searchSerpApiFlights } from './serpapiFlightService';
import { searchAmadeusFlights } from './amadeusFlightService';
import { searchKiwiFlights } from './kiwiFlightService';

export interface FlexibleDateResult {
  offsetDays: number;
  startDate: string;
  endDate: string;
  label: string;
  pricePerPerson: number;
  pricePerGroup: number;
  savingPerPerson: number;
  savingPerGroup: number;
  savingPercent: number;
  source: 'serpapi' | 'amadeus' | 'kiwi';
}

const OFFSETS = [-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function labelFor(offset: number): string {
  const abs = Math.abs(offset);
  const direction = offset < 0 ? 'avant' : 'après';
  if (abs === 7) return `1 semaine ${direction}`;
  if (abs === 1) return `1 jour ${direction}`;
  return `${abs} jours ${direction}`;
}

async function cheapestFlight(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
}): Promise<{ pricePerPerson: number; source: FlexibleDateResult['source'] } | null> {
  // Prefer SerpApi (fastest, most reliable). Fallback to Amadeus then Kiwi.
  const serp = await searchSerpApiFlights(params).catch(() => null);
  if (serp?.flights?.[0]) {
    return { pricePerPerson: serp.flights[0].price, source: 'serpapi' };
  }
  const ama = await searchAmadeusFlights(params).catch(() => null);
  if (ama?.flights?.[0]) {
    return { pricePerPerson: ama.flights[0].price, source: 'amadeus' };
  }
  const kiwi = await searchKiwiFlights(params).catch(() => null);
  if (kiwi?.flights?.[0]) {
    return { pricePerPerson: kiwi.flights[0].price, source: 'kiwi' };
  }
  return null;
}

export async function scanFlexibleDates(params: {
  departureCity: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  flightClass?: string;
  basePricePerPerson: number;
}): Promise<FlexibleDateResult[]> {
  const base = params.basePricePerPerson;
  if (!base || base <= 0) return [];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const scans = OFFSETS.map(async (offset) => {
    const shiftedStart = shiftDate(params.startDate, offset);
    const shiftedEnd = shiftDate(params.endDate, offset);
    if (new Date(shiftedStart) < today) return null;

    const result = await cheapestFlight({
      departureCity: params.departureCity,
      destination: params.destination,
      startDate: shiftedStart,
      endDate: shiftedEnd,
      people: params.people,
      flightClass: params.flightClass,
    });

    if (!result) return null;

    const savingPerPerson = Math.round(base - result.pricePerPerson);
    const savingPerGroup = savingPerPerson * params.people;
    const savingPercent = Math.round((savingPerPerson / base) * 100);

    return {
      offsetDays: offset,
      startDate: shiftedStart,
      endDate: shiftedEnd,
      label: labelFor(offset),
      pricePerPerson: Math.round(result.pricePerPerson),
      pricePerGroup: Math.round(result.pricePerPerson * params.people),
      savingPerPerson,
      savingPerGroup,
      savingPercent,
      source: result.source,
    } as FlexibleDateResult;
  });

  const settled = await Promise.allSettled(scans);
  const results: FlexibleDateResult[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled' && r.value) results.push(r.value);
  }

  // Return only offsets cheaper than original, sorted by savings desc.
  return results
    .filter(r => r.savingPerPerson > 0)
    .sort((a, b) => b.savingPerPerson - a.savingPerPerson);
}
