// Real activities from GetYourGuide partner widget.
// Reads the widget HTML and parses the embedded Astro-serialized data
// to get REAL: title, price, image, deep-link URL, duration, ratings.
// Filters by trip dates + premium filters to return only RELEVANT
// activities for the user's specific trip.

import { env } from '../config/env';

const browserHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

export interface RealActivity {
  name: string;
  tourId?: string;
  bookingUrl: string;
  imageUrl: string;
  price: number;
  priceLabel: string;
  duration: string;
  rating?: number;
  reviewCount?: number;
  availabilityMessage?: string;
  availabilityDate?: string; // YYYY-MM-DD extracted from message when possible
  estimated: boolean;
}

export interface ActivityFetchOptions {
  destination: string;
  limit?: number;
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  participants?: number;
  tripStyle?: 'cultural' | 'adventure' | 'romantic' | 'family' | 'nightlife' | 'wellness' | 'gastronomic';
  interests?: string[];
  hasChildren?: boolean;
  hasAccessibilityNeeds?: boolean;
  budgetLevel?: 'budget' | 'moderate' | 'premium' | 'luxury';
}

const decodeHtml = (s: string) =>
  s.replace(/&quot;/g, '"')
   .replace(/&amp;/g, '&')
   .replace(/&#39;/g, "'")
   .replace(/&lt;/g, '<')
   .replace(/&gt;/g, '>');

const upgradeImage = (url: string): string =>
  url.replace(/\/(?:39|53)\.(jpg|jpeg|png|webp)$/i, '/99.$1');

/** Map our trip filters to extra search keywords that bias GetYourGuide
 *  toward the right kind of activities. */
function buildSearchKeywords(opts: ActivityFetchOptions): string[] {
  const kws: string[] = [];
  switch (opts.tripStyle) {
    case 'cultural':    kws.push('musée', 'culture', 'histoire'); break;
    case 'adventure':   kws.push('aventure', 'plein air', 'sport'); break;
    case 'romantic':    kws.push('romantique', 'couple', 'soirée'); break;
    case 'family':      kws.push('famille', 'enfants'); break;
    case 'nightlife':   kws.push('nuit', 'bar', 'club'); break;
    case 'wellness':    kws.push('spa', 'bien-être', 'détente'); break;
    case 'gastronomic': kws.push('gastronomie', 'cuisine', 'dégustation'); break;
  }
  if (opts.hasChildren) kws.push('famille');
  if (opts.hasAccessibilityNeeds) kws.push('accessible');

  if (opts.interests?.length) {
    const map: Record<string, string> = {
      'culture': 'musée art',
      'nature': 'nature parc',
      'plage': 'plage',
      'gastronomie': 'cuisine',
      'nightlife': 'bar nuit',
      'shopping': 'shopping',
      'sport': 'sport',
      'bien-être': 'spa',
      'photo': 'photo',
      'histoire': 'histoire',
    };
    opts.interests.forEach((i) => {
      const k = map[i.toLowerCase()];
      if (k) kws.push(k);
    });
  }
  return [...new Set(kws)].slice(0, 3);
}

/** Try to parse an availability string into a YYYY-MM-DD date when present. */
function parseAvailability(message?: string): string | undefined {
  if (!message) return;
  // "Disponible à partir du 02/06/2026"
  const m = message.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return;
}

async function fetchOneQuery(query: string, opts: ActivityFetchOptions): Promise<RealActivity[]> {
  const partnerId = env.GETYOURGUIDE_AFFILIATE_ID || '4FUSNVA';
  const limit = opts.limit ?? 12;

  const params: Record<string, string> = {
    partner_id: partnerId,
    locale_code: 'fr-FR',
    currency: 'EUR',
    q: query,
    limit: String(limit),
  };
  if (opts.startDate) params.date_from = opts.startDate;
  if (opts.endDate)   params.date_to   = opts.endDate;
  if (opts.participants) params.participants = String(opts.participants);

  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `https://widget.getyourguide.com/widget/activities.frame?${qs}`;

  let html: string;
  try {
    const r = await fetch(url, { headers: browserHeaders });
    if (!r.ok) return [];
    html = await r.text();
  } catch {
    return [];
  }

  const decoded = decodeHtml(html);
  const titles      = [...decoded.matchAll(/"title":\[0,"((?:[^"\\]|\\.)*)"\]/g)].map(m => m[1]);
  const fmtPrices   = [...decoded.matchAll(/"formattedStartingPrice":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const startingP   = [...decoded.matchAll(/"startingPrice":\[0,([0-9.]+)\]/g)].map(m => Number(m[1]));
  const durations   = [...decoded.matchAll(/"duration":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const images      = [...decoded.matchAll(/"image":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const urls        = [...decoded.matchAll(/"urlToAdp":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const stars       = [...decoded.matchAll(/"stars":\[0,([0-9.]+)\]/g)].map(m => Number(m[1]));
  const reviewCount = [...decoded.matchAll(/"reviewCount":\[0,([0-9]+)\]/g)].map(m => Number(m[1]));
  const tourIds     = [...decoded.matchAll(/"tourId":\[0,([0-9]+)\]/g)].map(m => m[1]);
  const availMsgs   = [...decoded.matchAll(/"availability":\[0,\{"message":\[0,"([^"]+)"/g)].map(m => m[1]);

  const cleanTitle = (t: string) => t.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\\\/g, '\\');

  const n = Math.min(titles.length, fmtPrices.length, urls.length, images.length);
  const out: RealActivity[] = [];
  for (let i = 0; i < n; i++) {
    const name = cleanTitle(titles[i] || '');
    if (!name || name.length < 4) continue;
    out.push({
      name,
      tourId: tourIds[i],
      bookingUrl: urls[i].replace(/&amp;/g, '&'),
      imageUrl: upgradeImage(images[i]),
      price: startingP[i] || 0,
      priceLabel: fmtPrices[i] || `${Math.round(startingP[i] || 0)} €`,
      duration: durations[i] || '2-4h',
      rating: stars[i],
      reviewCount: reviewCount[i],
      availabilityMessage: availMsgs[i],
      availabilityDate: parseAvailability(availMsgs[i]),
      estimated: false,
    });
  }

  return out;
}

/** Filter activities so only those AVAILABLE during the trip window remain. */
function filterByTripDates(activities: RealActivity[], startDate?: string, endDate?: string): RealActivity[] {
  if (!startDate || !endDate) return activities;
  return activities.filter((a) => {
    // If we couldn't parse a future date from the message, KEEP it (likely
    // means "available today" or generally available).
    if (!a.availabilityDate) return true;
    // Activity available on/before trip end → keep
    return a.availabilityDate <= endDate;
  });
}

/** Filter by budget level (when set). */
function filterByBudgetLevel(activities: RealActivity[], level?: ActivityFetchOptions['budgetLevel']): RealActivity[] {
  if (!level) return activities;
  const ranges: Record<NonNullable<ActivityFetchOptions['budgetLevel']>, [number, number]> = {
    budget:   [0, 35],
    moderate: [0, 80],
    premium:  [50, 200],
    luxury:   [100, 99999],
  };
  const [min, max] = ranges[level];
  return activities.filter((a) => a.price >= min && a.price <= max);
}

const cache = new Map<string, { at: number; data: RealActivity[] }>();
const CACHE_TTL = 1000 * 60 * 30;

/** Main entry — returns RELEVANT activities for the trip context. */
export async function getRealActivities(
  opts: ActivityFetchOptions | string,
  limit: number = 8,
): Promise<RealActivity[]> {
  const o: ActivityFetchOptions = typeof opts === 'string'
    ? { destination: opts, limit }
    : { ...opts, limit: opts.limit ?? limit };

  const key = JSON.stringify({
    d: o.destination.toLowerCase().trim(),
    s: o.startDate, e: o.endDate, p: o.participants,
    st: o.tripStyle, in: o.interests, ch: o.hasChildren, ac: o.hasAccessibilityNeeds,
    bl: o.budgetLevel, l: o.limit,
  });
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  // 1) Primary query: destination + relevant style keywords
  const kws = buildSearchKeywords(o);
  const primaryQ = kws.length > 0 ? `${o.destination} ${kws.join(' ')}` : o.destination;

  // Fetch more than needed so we can filter without running short
  const raw = await fetchOneQuery(primaryQ, { ...o, limit: (o.limit ?? 8) * 2 });

  // 2) Filter by trip dates + budget level
  let filtered = filterByTripDates(raw, o.startDate, o.endDate);
  filtered = filterByBudgetLevel(filtered, o.budgetLevel);

  // 3) If filtering left us too short, re-query without keywords as backup
  if (filtered.length < 3 && kws.length > 0) {
    const backup = await fetchOneQuery(o.destination, { ...o, limit: (o.limit ?? 8) * 2 });
    const known = new Set(filtered.map((a) => a.tourId));
    const extra = backup.filter((a) => !known.has(a.tourId));
    const extraFiltered = filterByTripDates(filterByBudgetLevel(extra, o.budgetLevel), o.startDate, o.endDate);
    filtered = [...filtered, ...extraFiltered];
  }

  const final = filtered.slice(0, o.limit ?? 8);
  cache.set(key, { at: Date.now(), data: final });
  return final;
}
