// Image fetcher for destinations + activities.
// Strategy for activities (preferred when bookingUrl exists):
//  1. Scrape <meta property="og:image"> from the booking page (GetYourGuide,
//     Booking, etc.). Most travel sites set this for social sharing — gives
//     the exact image the provider uses.
// Strategy for destinations + activity fallback:
//  1. Wikipedia summary API (FR then EN) — free, no key.
//  2. LoremFlickr keyword search — last resort.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const wikiHeaders = {
  'Api-User-Agent': 'SmartBudgetTravel/1.0 (https://smartbudget-travel.netlify.app)',
};

const browserHeaders = {
  // Some sites block requests without a real-browser UA.
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

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

/** Extract og:image from the HTML head of any URL. */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const r = await fetch(pageUrl, { headers: browserHeaders });
    if (!r.ok) return null;
    // Read only the first ~200KB — og:image is in the <head>, no need to parse the whole page.
    const html = (await r.text()).slice(0, 200_000);

    // Try multiple meta tag variants: og:image, og:image:secure_url, twitter:image
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && m[1]) {
        // Resolve relative URLs
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

/** Get an image URL for a destination/city. Caches per destination. */
export function getDestinationImage(destination: string): Promise<string> {
  if (!destination) return Promise.resolve(loremFlickr('travel,city'));
  const clean = cleanCity(destination);
  const key = `dest:${clean.toLowerCase()}`;
  return resolve(key, async () => {
    const fr = await fetchWiki('fr', clean);
    if (fr) return fr;
    const en = await fetchWiki('en', clean);
    if (en) return en;
    return loremFlickr(`${clean},city,landmark`);
  });
}

/** Get an image URL for a specific activity. Tries booking page og:image first
 *  (GetYourGuide, Viator, etc.), then Wikipedia, then LoremFlickr. */
export function getActivityImage(activity: string, destination: string, bookingUrl?: string): Promise<string> {
  const cleanAct = stripActivityVerbs(activity || '').trim() || activity;
  const cleanDest = cleanCity(destination || '');
  const key = `act:${cleanAct.toLowerCase()}:${cleanDest.toLowerCase()}:${bookingUrl || ''}`;
  return resolve(key, async () => {
    if (bookingUrl) {
      const og = await fetchOgImage(bookingUrl);
      if (og) return og;
    }
    if (cleanAct) {
      const fr = await fetchWiki('fr', cleanAct);
      if (fr) return fr;
      const en = await fetchWiki('en', cleanAct);
      if (en) return en;
    }
    return loremFlickr(`${cleanAct},${cleanDest}`);
  });
}

/** Get a hotel/booking image from a booking page URL. */
export function getOgImageFromUrl(url: string): Promise<string | null> {
  if (!url) return Promise.resolve(null);
  const key = `og:${url}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key)!);
  if (inflight.has(key)) return inflight.get(key)! as unknown as Promise<string | null>;

  const p = (async () => {
    const img = await fetchOgImage(url);
    if (img) cache.set(key, img);
    return img;
  })();
  inflight.set(key, p as Promise<any>);
  return p.finally(() => inflight.delete(key));
}
