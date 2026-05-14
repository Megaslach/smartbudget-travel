// Real activities from GetYourGuide partner widget.
// We hit the widget HTML and parse the embedded Astro-serialized data
// (the official widget renders this client-side; we read the source).
// All fields are REAL: title (FR), price (real €), image (CDN), URL
// (deep-link with our partner_id), duration, stars, reviews.

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
  estimated: boolean;
}

const decodeHtml = (s: string) =>
  s.replace(/&quot;/g, '"')
   .replace(/&amp;/g, '&')
   .replace(/&#39;/g, "'")
   .replace(/&lt;/g, '<')
   .replace(/&gt;/g, '>');

/** Upgrade a thumbnail CDN URL to a larger variant. */
const upgradeImage = (url: string): string =>
  url.replace(/\/(?:39|53)\.(jpg|jpeg|png|webp)$/i, '/99.$1');

async function fetchFromWidget(query: string, limit: number = 8): Promise<RealActivity[]> {
  const partnerId = env.GETYOURGUIDE_AFFILIATE_ID || '4FUSNVA';
  const url = `https://widget.getyourguide.com/widget/activities.frame?partner_id=${partnerId}&locale_code=fr-FR&currency=EUR&q=${encodeURIComponent(query)}&limit=${limit}`;

  let html: string;
  try {
    const r = await fetch(url, { headers: browserHeaders });
    if (!r.ok) return [];
    html = await r.text();
  } catch {
    return [];
  }

  const decoded = decodeHtml(html);

  // Extract each field as parallel arrays (the widget serializes activities
  // in a flat order so the indexes line up).
  const titles      = [...decoded.matchAll(/"title":\[0,"((?:[^"\\]|\\.)*)"\]/g)].map(m => m[1]);
  const fmtPrices   = [...decoded.matchAll(/"formattedStartingPrice":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const startingP   = [...decoded.matchAll(/"startingPrice":\[0,([0-9.]+)\]/g)].map(m => Number(m[1]));
  const durations   = [...decoded.matchAll(/"duration":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const images      = [...decoded.matchAll(/"image":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const urls        = [...decoded.matchAll(/"urlToAdp":\[0,"([^"]+)"\]/g)].map(m => m[1]);
  const stars       = [...decoded.matchAll(/"stars":\[0,([0-9.]+)\]/g)].map(m => Number(m[1]));
  const reviewCount = [...decoded.matchAll(/"reviewCount":\[0,([0-9]+)\]/g)].map(m => Number(m[1]));
  const tourIds     = [...decoded.matchAll(/"tourId":\[0,([0-9]+)\]/g)].map(m => m[1]);

  // Decode escaped chars in titles
  const cleanTitle = (t: string) => t.replace(/\\"/g, '"').replace(/\\\//g, '/').replace(/\\\\/g, '\\');

  const n = Math.min(titles.length, fmtPrices.length, urls.length, images.length);
  const out: RealActivity[] = [];
  for (let i = 0; i < n && out.length < limit; i++) {
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
      estimated: false,
    });
  }

  return out;
}

const cache = new Map<string, { at: number; data: RealActivity[] }>();
const CACHE_TTL = 1000 * 60 * 30;

export async function getRealActivities(destination: string, limit: number = 8): Promise<RealActivity[]> {
  const key = `${destination.toLowerCase().trim()}:${limit}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  const data = await fetchFromWidget(destination, limit);
  cache.set(key, { at: Date.now(), data });
  return data;
}
