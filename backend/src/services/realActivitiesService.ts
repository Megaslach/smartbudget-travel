// Real activities from GetYourGuide via the public partner widget.
// Extracts tour ID, slug (→ title), product URL, and CDN image URL from
// the rendered HTML. Prices are loaded by JS in the widget so we can't
// see them server-side — we estimate a ballpark per activity-type and
// display the real price when the user lands on the product page.

import { env } from '../config/env';

const browserHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

export interface RealActivity {
  name: string;
  tourId: string;
  bookingUrl: string;
  imageUrl: string;
  price: number;
  duration: string;
  estimated: boolean; // true if price is a heuristic, false if real
}

const titleFromSlug = (slug: string): string => {
  // "tokyo-l-experience-fast-furious-tokyo-drift-3-t794698"
  //   -> remove trailing -t<digits>
  //   -> first chunk is city-l<id>/<rest>
  const withoutTourId = slug.replace(/-t\d+$/, '');
  // Drop city prefix: "tokyo-l193/" or similar
  const noCity = withoutTourId.replace(/^[a-z0-9-]+-l\d+\/?/, '');
  return noCity
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
};

const estimatePrice = (title: string, duration: string): number => {
  const lower = title.toLowerCase();
  // Heuristics based on keywords. Always rounded.
  if (/^(transfert|transfer)/i.test(lower) || lower.includes('aeroport') || lower.includes('aéroport') || lower.includes('airport')) return 30;
  if (lower.includes('billet') || lower.includes('ticket') || lower.includes('entree') || lower.includes('entrée')) return 25;
  if (lower.includes('visite guidée') || lower.includes('guided tour') || lower.includes('tour guide')) return 55;
  if (lower.includes('croisière') || lower.includes('cruise') || lower.includes('boat')) return 75;
  if (lower.includes('jour complet') || lower.includes('full day') || lower.includes('journee') || lower.includes('journée')) return 95;
  if (lower.includes('vip') || lower.includes('privé') || lower.includes('private') || lower.includes('luxe')) return 180;
  if (lower.includes('demi') || lower.includes('half')) return 65;
  if (lower.includes('découverte') || lower.includes('discovery') || lower.includes('walking tour')) return 35;
  if (lower.includes('atelier') || lower.includes('class') || lower.includes('workshop')) return 70;
  if (lower.includes('dégustation') || lower.includes('tasting') || lower.includes('food tour')) return 85;
  return 50;
};

const estimateDuration = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('jour complet') || lower.includes('full day')) return 'Jour complet';
  if (lower.includes('demi') || lower.includes('half day')) return 'Demi-journée';
  if (lower.includes('aeroport') || lower.includes('transfert') || lower.includes('transfer')) return '30-60 min';
  if (lower.includes('croisière') || lower.includes('cruise')) return '2-3h';
  if (lower.includes('atelier') || lower.includes('workshop') || lower.includes('class')) return '2-3h';
  return '2-4h';
};

/** Extract activities by scraping GetYourGuide's partner widget HTML. */
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

  // Tour IDs
  const tourIdMatches = [...new Set([...html.matchAll(/data-gyg-event-tour-id="(\d+)"/g)].map(m => m[1]))];
  if (tourIdMatches.length === 0) return [];

  // Tour URLs: pattern `getyourguide.com/<city-slug>/<activity-slug>-t<id>`
  const urlPattern = /(getyourguide\.com\/[a-z][a-z0-9-]+-l\d+\/[a-z0-9-]+-t\d+)/g;
  const tourUrlsRaw = [...new Set([...html.matchAll(urlPattern)].map(m => m[1]))];

  // CDN image URLs
  const imagePattern = /https:\/\/cdn\.getyourguide\.com\/img\/tour\/[a-z0-9]+\.(jpg|jpeg|png|webp)\/(?:39|53)\.(?:jpg|jpeg|png|webp)/gi;
  const imagesRaw = [...new Set([...html.matchAll(imagePattern)].map(m => m[0]))];

  // Pair each tour ID with its URL + image
  const activities: RealActivity[] = [];
  for (const tourId of tourIdMatches.slice(0, limit)) {
    const urlMatch = tourUrlsRaw.find((u) => u.endsWith(`-t${tourId}`));
    if (!urlMatch) continue;

    const slug = urlMatch.replace(/^getyourguide\.com\//, '');
    const title = titleFromSlug(slug);
    if (!title || title.length < 4) continue;

    // Upgrade thumbnail to a larger size
    const matchingImg = imagesRaw[activities.length] || imagesRaw[0];
    const imageUrl = matchingImg
      ? matchingImg.replace(/\/(?:39|53)\.(jpg|jpeg|png|webp)$/i, '/99.$1')
      : `https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&w=940`;

    activities.push({
      name: title,
      tourId,
      bookingUrl: `https://www.getyourguide.com/${slug}?partner_id=${partnerId}`,
      imageUrl,
      price: estimatePrice(title, ''),
      duration: estimateDuration(title),
      estimated: true,
    });
  }

  return activities;
}

const cache = new Map<string, { at: number; data: RealActivity[] }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 min

/** Public: fetch real activities for a destination (cached). */
export async function getRealActivities(destination: string, limit: number = 8): Promise<RealActivity[]> {
  const key = `${destination.toLowerCase().trim()}:${limit}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  const data = await fetchFromWidget(destination, limit);
  cache.set(key, { at: Date.now(), data });
  return data;
}
