// Image fetcher for destinations + activities.
//
// Strategy (in order):
//  1. Pexels API search if EXPO_PUBLIC_PEXELS_KEY is set (best quality photos).
//  2. Pixabay API search if EXPO_PUBLIC_PIXABAY_KEY is set (alt to Pexels).
//  3. Wikipedia "Tourism in X" / "Tourisme à X" articles (better than plain
//     city article — usually returns a postcard-style photo).
//  4. Wikipedia plain article (fallback).
//  5. LoremFlickr keyword search (last resort).
//
// All results are cached in memory + dedup'd by inflight requests.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const PEXELS_KEY = process.env.EXPO_PUBLIC_PEXELS_KEY;
const PIXABAY_KEY = process.env.EXPO_PUBLIC_PIXABAY_KEY;

const wikiHeaders = {
  'Api-User-Agent': 'SmartBudgetTravel/1.0 (https://smartbudget-travel.netlify.app)',
};

const browserHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/** Pexels (free key required, 200 req/h). High-quality stock photos. */
async function fetchPexels(query: string): Promise<string | null> {
  if (!PEXELS_KEY) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.photos?.[0]?.src?.large || j?.photos?.[0]?.src?.medium || null;
  } catch {
    return null;
  }
}

/** Pixabay (free key required, 5000 req/h). */
async function fetchPixabay(query: string): Promise<string | null> {
  if (!PIXABAY_KEY) return null;
  try {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&per_page=3&image_type=photo&orientation=horizontal&safesearch=true&category=places`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.hits?.[0]?.largeImageURL || j?.hits?.[0]?.webformatURL || null;
  } catch {
    return null;
  }
}

async function fetchWiki(lang: 'fr' | 'en', title: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const r = await fetch(url, { headers: wikiHeaders });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.originalimage?.source || j?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/** Extract og:image from any page. */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const r = await fetch(pageUrl, { headers: browserHeaders });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 200_000);
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && m[1]) {
        if (m[1].startsWith('//')) return 'https:' + m[1];
        if (m[1].startsWith('/')) {
          const u = new URL(pageUrl);
          return `${u.protocol}//${u.host}${m[1]}`;
        }
        return m[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

const loremFlickr = (keywords: string) =>
  `https://loremflickr.com/600/400/${encodeURIComponent(keywords.replace(/\s+/g, ','))}`;

const cleanCity = (s: string) => s.split(',')[0].trim();

const stripActivityVerbs = (s: string) =>
  s.replace(
    /^(visite|tour|découverte|excursion|balade|promenade|cours|atelier|dégustation|déjeuner|dîner|soirée)\s+(de|à|du|des|en|sur|au|aux)?\s*/i,
    '',
  ).trim();

async function resolve(key: string, fetcher: () => Promise<string>): Promise<string> {
  const cached = cache.get(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const img = await fetcher();
    cache.set(key, img);
    return img;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Get a beautiful, touristy image of a destination. */
export function getDestinationImage(destination: string): Promise<string> {
  if (!destination) return Promise.resolve(loremFlickr('travel,city'));
  const clean = cleanCity(destination);
  const key = `dest:${clean.toLowerCase()}`;

  return resolve(key, async () => {
    // 1. Pexels — magazine-quality photos
    const pexels = await fetchPexels(`${clean} travel`);
    if (pexels) return pexels;

    // 2. Pixabay — alternative if Pexels not set
    const pixabay = await fetchPixabay(`${clean} city`);
    if (pixabay) return pixabay;

    // 3. Wikipedia "Tourisme à X" / "Tourism in X" — usually a postcard photo
    const tourismFr = await fetchWiki('fr', `Tourisme à ${clean}`);
    if (tourismFr) return tourismFr;
    const tourismEn = await fetchWiki('en', `Tourism in ${clean}`);
    if (tourismEn) return tourismEn;

    // 4. Plain Wikipedia article
    const fr = await fetchWiki('fr', clean);
    if (fr) return fr;
    const en = await fetchWiki('en', clean);
    if (en) return en;

    // 5. LoremFlickr fallback
    return loremFlickr(`${clean},city,landmark,travel`);
  });
}

/** Get an image for an activity. */
export function getActivityImage(activity: string, destination: string, bookingUrl?: string): Promise<string> {
  const cleanAct = stripActivityVerbs(activity || '').trim() || activity;
  const cleanDest = cleanCity(destination || '');
  const key = `act:${cleanAct.toLowerCase()}:${cleanDest.toLowerCase()}`;

  return resolve(key, async () => {
    // 1. Pexels — best quality
    const pexels = await fetchPexels(`${cleanAct} ${cleanDest}`);
    if (pexels) return pexels;

    // 2. Pixabay
    const pixabay = await fetchPixabay(`${cleanAct} ${cleanDest}`);
    if (pixabay) return pixabay;

    // 3. og:image from booking page (only if it's a product URL, not search)
    if (bookingUrl && !/[?&]q=|\/search/i.test(bookingUrl)) {
      const og = await fetchOgImage(bookingUrl);
      if (og && !/logo|sprite|icon/i.test(og)) return og;
    }

    // 4. Wikipedia (works for famous landmarks like Eiffel Tower, Colosseum)
    if (cleanAct) {
      const fr = await fetchWiki('fr', cleanAct);
      if (fr) return fr;
      const en = await fetchWiki('en', cleanAct);
      if (en) return en;
    }

    // 5. LoremFlickr fallback
    return loremFlickr(`${cleanAct},${cleanDest}`);
  });
}

/** Get og:image from a specific URL (used for hotels). */
export function getOgImageFromUrl(url: string): Promise<string | null> {
  if (!url) return Promise.resolve(null);
  const key = `og:${url}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);

  const p = (async () => {
    const img = await fetchOgImage(url);
    if (img) cache.set(key, img);
    return img;
  })();
  return p;
}
