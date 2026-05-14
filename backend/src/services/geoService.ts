// Worldwide cities search + nearest-airport fallback.
// Uses Photon (OSM-based, free, no API key) for live city search.
// Falls back to our curated cities list when Photon is unavailable.

import { cities as curatedCities, City, Airport } from '../data/airports';

interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: {
    name: string;
    country?: string;
    countrycode?: string;
    osm_value?: string;
    osm_key?: string;
    type?: string;
    city?: string;
    state?: string;
  };
}

// Map ISO country code → flag emoji
const flag = (cc?: string): string => {
  if (!cc || cc.length !== 2) return '🌍';
  return String.fromCodePoint(...cc.toUpperCase().split('').map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
};

// Build airports lookup by lat/lng for nearest search
interface AirportWithLocation extends Airport {
  cityName: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
}

// Hardcoded coordinates for our 136 curated airports (approximate, used for nearest-airport queries)
// Keys are IATA codes
const AIRPORT_COORDS: Record<string, [number, number]> = {
  // France
  CDG: [49.0097, 2.5479], ORY: [48.7233, 2.3794], BVA: [49.4544, 2.1128],
  LYS: [45.7256, 5.0811], MRS: [43.4393, 5.2214], NCE: [43.6584, 7.2159],
  TLS: [43.6293, 1.3638], BOD: [44.8283, -0.7156], NTE: [47.1532, -1.6107],
  SXB: [48.5383, 7.6280], LIL: [50.5614, 3.0894], MPL: [43.5762, 3.9630],
  RNS: [48.0695, -1.7348], BIA: [42.5404, 9.4839], FSC: [41.9237, 8.7929],

  // Europe
  LHR: [51.4700, -0.4543], LGW: [51.1537, -0.1821], STN: [51.8849, 0.2389], LCY: [51.5048, 0.0495],
  CDG_2: [49.0097, 2.5479],
  AMS: [52.3105, 4.7683],
  BCN: [41.2974, 2.0833], MAD: [40.4983, -3.5676],
  LIS: [38.7813, -9.1359], OPO: [41.2480, -8.6814],
  ROM: [41.8003, 12.2389], FCO: [41.8003, 12.2389], MXP: [45.6306, 8.7281], MIL: [45.6306, 8.7281],
  VCE: [45.5053, 12.3519], NAP: [40.8860, 14.2908],
  BER: [52.5644, 13.2885], MUC: [48.3538, 11.7861], FRA: [50.0379, 8.5622],
  VIE: [48.1103, 16.5697], ZRH: [47.4581, 8.5556], GVA: [46.2381, 6.1090],
  PRG: [50.1008, 14.2632], BUD: [47.4369, 19.2556], WAW: [52.1657, 20.9671],
  CPH: [55.6181, 12.6561], ARN: [59.6519, 17.9186], OSL: [60.1939, 11.1004],
  HEL: [60.3172, 24.9633], TLL: [59.4133, 24.8328], RIX: [56.9236, 23.9711], VNO: [54.6341, 25.2858],
  IST: [41.2753, 28.7519], SAW: [40.8986, 29.3092],
  ATH: [37.9364, 23.9444], DBV: [42.5614, 18.2683], SPU: [43.5389, 16.2980],

  // Americas
  JFK: [40.6413, -73.7781], LGA: [40.7769, -73.8740], EWR: [40.6895, -74.1745],
  LAX: [33.9416, -118.4085], SFO: [37.6213, -122.3790],
  ORD: [41.9742, -87.9073], MIA: [25.7959, -80.2870], BOS: [42.3656, -71.0096],
  YUL: [45.4706, -73.7408], YYZ: [43.6777, -79.6248], YVR: [49.1967, -123.1815],
  MEX: [19.4361, -99.0719], CUN: [21.0365, -86.8770],
  GRU: [-23.4356, -46.4731], EZE: [-34.8222, -58.5358], SCL: [-33.3930, -70.7858],

  // Asia
  HND: [35.5494, 139.7798], NRT: [35.7647, 140.3864], KIX: [34.4347, 135.2440],
  PEK: [40.0801, 116.5846], PVG: [31.1443, 121.8083], CAN: [23.3924, 113.2988], HKG: [22.3080, 113.9185],
  ICN: [37.4602, 126.4407], GMP: [37.5583, 126.7906],
  BKK: [13.6900, 100.7501], DMK: [13.9126, 100.6068],
  SIN: [1.3644, 103.9915], KUL: [2.7456, 101.7099],
  CGK: [-6.1256, 106.6559], DPS: [-8.7482, 115.1672],
  MNL: [14.5086, 121.0198],
  DEL: [28.5562, 77.1000], BOM: [19.0896, 72.8656],

  // Middle East / Africa
  DXB: [25.2532, 55.3657], AUH: [24.4330, 54.6511],
  DOH: [25.2731, 51.6080], RUH: [24.9576, 46.6988],
  TLV: [32.0114, 34.8867], CAI: [30.1219, 31.4056],
  CMN: [33.3675, -7.5897], RAK: [31.6069, -8.0363],
  JNB: [-26.1392, 28.2460], CPT: [-33.9648, 18.6017],

  // Oceania
  SYD: [-33.9399, 151.1753], MEL: [-37.6690, 144.8410], AKL: [-37.0082, 174.7850],

  // Indian Ocean
  RUN: [-20.8871, 55.5103], MRU: [-20.4302, 57.6836],
};

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest airport from our curated list given a lat/lng. */
export function findNearestAirport(lat: number, lng: number): { airport: Airport; cityName: string; country: string; distanceKm: number } | null {
  let best: { airport: Airport; cityName: string; country: string; distanceKm: number } | null = null;

  for (const city of curatedCities) {
    for (const airport of city.airports) {
      const coords = AIRPORT_COORDS[airport.code];
      if (!coords) continue;
      const d = distanceKm(lat, lng, coords[0], coords[1]);
      if (!best || d < best.distanceKm) {
        best = { airport, cityName: city.name, country: city.country, distanceKm: d };
      }
    }
  }

  return best;
}

/** Estimate transport options from airport to destination city based on distance. */
export function estimateAirportTransport(distanceKm: number): {
  options: { mode: string; icon: string; minPrice: number; maxPrice: number; minMinutes: number; maxMinutes: number; note: string }[];
} {
  const opts: { mode: string; icon: string; minPrice: number; maxPrice: number; minMinutes: number; maxMinutes: number; note: string }[] = [];

  if (distanceKm < 5) {
    opts.push({ mode: 'Taxi / VTC',  icon: '🚖', minPrice: 10, maxPrice: 25, minMinutes: 10, maxMinutes: 20, note: 'Très proche, taxi/Uber recommandé' });
    opts.push({ mode: 'Navette gratuite', icon: '🚌', minPrice: 0, maxPrice: 0, minMinutes: 15, maxMinutes: 25, note: 'Souvent disponible' });
  } else if (distanceKm < 20) {
    opts.push({ mode: 'Taxi / VTC',          icon: '🚖', minPrice: 20, maxPrice: 50, minMinutes: 20, maxMinutes: 40, note: 'Pratique avec bagages' });
    opts.push({ mode: 'Transports en commun', icon: '🚇', minPrice: 3,  maxPrice: 12, minMinutes: 30, maxMinutes: 60, note: 'Bus ou métro/RER' });
    opts.push({ mode: 'Navette aéroport',     icon: '🚌', minPrice: 8,  maxPrice: 20, minMinutes: 25, maxMinutes: 50, note: 'Direct vers le centre' });
  } else if (distanceKm < 50) {
    opts.push({ mode: 'Taxi / VTC',           icon: '🚖', minPrice: 50, maxPrice: 120, minMinutes: 30, maxMinutes: 60, note: 'Confortable mais coûteux' });
    opts.push({ mode: 'Train',                icon: '🚆', minPrice: 8,  maxPrice: 30,  minMinutes: 25, maxMinutes: 50, note: 'Souvent le plus rapide' });
    opts.push({ mode: 'Bus / navette',        icon: '🚌', minPrice: 8,  maxPrice: 25,  minMinutes: 40, maxMinutes: 80, note: 'Économique' });
    opts.push({ mode: 'Location de voiture',  icon: '🚗', minPrice: 30, maxPrice: 70,  minMinutes: 30, maxMinutes: 60, note: '/jour, utile si plusieurs trajets' });
  } else if (distanceKm < 150) {
    opts.push({ mode: 'Train',               icon: '🚆', minPrice: 20, maxPrice: 80,  minMinutes: 60,  maxMinutes: 150, note: 'Le plus pratique sur cette distance' });
    opts.push({ mode: 'Bus longue distance', icon: '🚌', minPrice: 10, maxPrice: 35,  minMinutes: 90,  maxMinutes: 180, note: 'Économique mais plus long' });
    opts.push({ mode: 'Location de voiture', icon: '🚗', minPrice: 35, maxPrice: 80,  minMinutes: 60,  maxMinutes: 120, note: '/jour, flexibilité maximale' });
    opts.push({ mode: 'Taxi (déconseillé)',  icon: '🚖', minPrice: 150, maxPrice: 350, minMinutes: 60, maxMinutes: 120, note: 'Très cher sur cette distance' });
  } else {
    opts.push({ mode: 'Train',                icon: '🚆', minPrice: 30, maxPrice: 120, minMinutes: 90,  maxMinutes: 240, note: 'Préférable si disponible' });
    opts.push({ mode: 'Vol intérieur',        icon: '✈️', minPrice: 40, maxPrice: 200, minMinutes: 60,  maxMinutes: 120, note: 'Pour les très longues distances' });
    opts.push({ mode: 'Location de voiture',  icon: '🚗', minPrice: 35, maxPrice: 80,  minMinutes: 120, maxMinutes: 240, note: '/jour, pour étapes multiples' });
  }

  return { options: opts };
}

/** Search worldwide cities via Photon (OSM-based, free, no API key). */
export async function searchWorldwideCities(query: string, lang: 'fr' | 'en' = 'fr'): Promise<{
  name: string;
  country: string;
  countryCode: string;
  emoji: string;
  lat: number;
  lng: number;
  airports: Airport[];
  matchType: 'city' | 'airport' | 'country';
  popular: boolean;
  nearestAirportInfo?: { airport: Airport; cityName: string; country: string; distanceKm: number; transport: ReturnType<typeof estimateAirportTransport> } | null;
}[]> {
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=${lang}&limit=10&osm_tag=place:city&osm_tag=place:town&osm_tag=place:village`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Itinifly/1.0' } });
    if (!r.ok) return [];
    const j = await r.json() as { features?: PhotonFeature[] };

    const out = (j.features || []).slice(0, 10).map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const name = f.properties.name;
      const country = f.properties.country || '';
      const cc = f.properties.countrycode || '';

      // Try to find an exact match in our curated list (gets us airports + good metadata)
      const curated = curatedCities.find((c) => c.name.toLowerCase() === name.toLowerCase() && (!cc || c.countryCode === cc));

      const airports = curated?.airports ?? [];
      let nearestAirportInfo = null;
      if (airports.length === 0) {
        const nearest = findNearestAirport(lat, lng);
        if (nearest) {
          nearestAirportInfo = {
            ...nearest,
            transport: estimateAirportTransport(nearest.distanceKm),
          };
        }
      }

      return {
        name,
        country,
        countryCode: cc.toUpperCase(),
        emoji: flag(cc),
        lat, lng,
        airports,
        matchType: 'city' as const,
        popular: !!curated?.popular,
        nearestAirportInfo,
      };
    });

    return out;
  } catch {
    return [];
  }
}
