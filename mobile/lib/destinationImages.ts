// Image fetcher for destinations + activities.
// Strategy:
//  1. Try Wikipedia summary API (free, no key, reliable for cities/landmarks).
//  2. Try French Wikipedia first, then English.
//  3. Fall back to LoremFlickr (Flickr-tagged search, also key-free) so we
//     always show *something* relevant instead of the same generic image.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const headers = {
  // Wikipedia recommends a User-Agent; React Native passes this through fetch.
  'Api-User-Agent': 'SmartBudgetTravel/1.0 (https://smartbudget-travel.netlify.app)',
};

async function fetchWiki(lang: 'fr' | 'en', title: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const r = await fetch(url, { headers });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.originalimage?.source || j?.thumbnail?.source || null;
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

/** Get an image URL for a specific activity. Falls back to destination if Wikipedia has no entry. */
export function getActivityImage(activity: string, destination: string): Promise<string> {
  const cleanAct = stripActivityVerbs(activity || '').trim() || activity;
  const cleanDest = cleanCity(destination || '');
  const key = `act:${cleanAct.toLowerCase()}:${cleanDest.toLowerCase()}`;
  return resolve(key, async () => {
    if (cleanAct) {
      const fr = await fetchWiki('fr', cleanAct);
      if (fr) return fr;
      const en = await fetchWiki('en', cleanAct);
      if (en) return en;
    }
    return loremFlickr(`${cleanAct},${cleanDest}`);
  });
}
