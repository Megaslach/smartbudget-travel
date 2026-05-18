// Shared image fetcher used by web + mobile.
// Returns a factory bound to the API keys you provide.

export interface ImageFetcherConfig {
  pexelsKey?: string;
  pixabayKey?: string;
}

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const wikiHeaders: Record<string, string> = {
  'Api-User-Agent': 'SmartBudgetTravel/1.0',
};

const browserHeaders: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const cleanCity = (s: string) => s.split(',')[0].trim();

const stripActivityVerbs = (s: string) =>
  s.replace(
    /^(visite|tour|découverte|excursion|balade|promenade|cours|atelier|dégustation|déjeuner|dîner|soirée)\s+(de|à|du|des|en|sur|au|aux)?\s*/i,
    '',
  ).trim();

const loremFlickr = (keywords: string) =>
  `https://loremflickr.com/600/400/${encodeURIComponent(keywords.replace(/\s+/g, ','))}`;

// Hand-picked category fallbacks (Pexels CDN URLs that always load).
// Used when the activity-specific image fails or returns nothing useful.
const CATEGORY_FALLBACKS: Record<string, string> = {
  sight:     'https://images.pexels.com/photos/3811807/pexels-photo-3811807.jpeg?auto=compress&w=940',
  food:      'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&w=940',
  activity:  'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&w=940',
  nature:    'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&w=940',
  shopping:  'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&w=940',
  nightlife: 'https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&w=940',
  transport: 'https://images.pexels.com/photos/1303081/pexels-photo-1303081.jpeg?auto=compress&w=940',
  default:   'https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&w=940',
};

// French → English city name translations (for image search).
// Pexels returns better photos for English city names.
const FR_TO_EN: Record<string, string> = {
  'cracovie': 'Krakow',
  'varsovie': 'Warsaw',
  'venise': 'Venice',
  'florence': 'Florence',
  'rome': 'Rome',
  'naples': 'Naples',
  'séville': 'Seville',
  'seville': 'Seville',
  'lisbonne': 'Lisbon',
  'porto': 'Porto',
  'munich': 'Munich',
  'berlin': 'Berlin',
  'bruxelles': 'Brussels',
  'vienne': 'Vienna',
  'prague': 'Prague',
  'budapest': 'Budapest',
  'athènes': 'Athens',
  'athenes': 'Athens',
  'santorin': 'Santorini',
  'mykonos': 'Mykonos',
  'londres': 'London',
  'edimbourg': 'Edinburgh',
  'édimbourg': 'Edinburgh',
  'dublin': 'Dublin',
  'reykjavik': 'Reykjavik',
  'copenhague': 'Copenhagen',
  'stockholm': 'Stockholm',
  'oslo': 'Oslo',
  'helsinki': 'Helsinki',
  'marrakech': 'Marrakech',
  'fès': 'Fes',
  'fes': 'Fes',
  'le caire': 'Cairo',
  'tunis': 'Tunis',
  'le cap': 'Cape Town',
  'dubaï': 'Dubai',
  'dubai': 'Dubai',
  'petra': 'Petra Jordan',
  'bangkok': 'Bangkok',
  'phuket': 'Phuket',
  'chiang mai': 'Chiang Mai',
  'bali': 'Bali Indonesia',
  'tokyo': 'Tokyo',
  'kyoto': 'Kyoto',
  'séoul': 'Seoul',
  'seoul': 'Seoul',
  'hong kong': 'Hong Kong',
  'singapour': 'Singapore',
  'hanoï': 'Hanoi',
  'hanoi': 'Hanoi',
  'hoi an': 'Hoi An',
  'delhi': 'Delhi',
  'goa': 'Goa beach',
  'new york': 'New York',
  'los angeles': 'Los Angeles',
  'miami': 'Miami',
  'montréal': 'Montreal',
  'montreal': 'Montreal',
  'toronto': 'Toronto',
  'mexico': 'Mexico City',
  'cancún': 'Cancun beach',
  'cancun': 'Cancun beach',
  'rio': 'Rio de Janeiro',
  'buenos aires': 'Buenos Aires',
  'cusco': 'Cusco Peru',
  'sydney': 'Sydney',
  'maurice': 'Mauritius',
  'saint-denis': 'Reunion island',
  'istanbul': 'Istanbul',
  'amsterdam': 'Amsterdam',
  'barcelone': 'Barcelona',
  'madrid': 'Madrid',
};

// Region-based fallbacks — guarantees a beautiful travel photo
// when the specific city query returns nothing.
const REGION_FALLBACKS: Record<string, string> = {
  europe:    'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&w=940',
  asia:      'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&w=940',
  americas:  'https://images.pexels.com/photos/2129796/pexels-photo-2129796.jpeg?auto=compress&w=940',
  africa:    'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&w=940',
  oceania:   'https://images.pexels.com/photos/995765/pexels-photo-995765.jpeg?auto=compress&w=940',
  beach:     'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&w=940',
  default:   'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&w=940',
};

const translateToEnglish = (city: string): string => {
  const norm = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return FR_TO_EN[norm] || FR_TO_EN[city.toLowerCase()] || city;
};

export const getCategoryFallback = (category?: string) =>
  CATEGORY_FALLBACKS[category || 'default'] || CATEGORY_FALLBACKS.default;

async function fetchPexels(key: string | undefined, query: string): Promise<string | null> {
  if (!key) return null;
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: key } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.photos?.[0]?.src?.large || j?.photos?.[0]?.src?.medium || null;
  } catch {
    return null;
  }
}

async function fetchPixabay(key: string | undefined, query: string): Promise<string | null> {
  if (!key) return null;
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=3&image_type=photo&orientation=horizontal&safesearch=true&category=places`;
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

export function createImageFetcher(config: ImageFetcherConfig) {
  const { pexelsKey, pixabayKey } = config;

  const getDestinationImage = (destination: string): Promise<string> => {
    if (!destination) return Promise.resolve(REGION_FALLBACKS.default);
    const clean = cleanCity(destination);
    const english = translateToEnglish(clean);
    const key = `dest:${clean.toLowerCase()}`;
    return resolve(key, async () => {
      // Try English city + "skyline" first — Pexels has many cityscape photos
      const pexelsSkyline = await fetchPexels(pexelsKey, `${english} skyline`);
      if (pexelsSkyline) return pexelsSkyline;
      // Then English city + "cityscape"
      const pexelsCity = await fetchPexels(pexelsKey, `${english} cityscape`);
      if (pexelsCity) return pexelsCity;
      // Then just English city
      const pexelsName = await fetchPexels(pexelsKey, english);
      if (pexelsName) return pexelsName;
      // Try Pixabay with English name + "city"
      const pixabay = await fetchPixabay(pixabayKey, `${english} city`);
      if (pixabay) return pixabay;
      // Wiki — but skip "Tourisme à" / "Tourism in" pages because they return
      // weird infobox first-images (maps, coats of arms). Use direct page only.
      const wikiEn = await fetchWiki('en', english);
      if (wikiEn && !/coat_of_arms|flag|map|svg/i.test(wikiEn)) return wikiEn;
      // Final fallback: generic travel photo (always loads)
      return REGION_FALLBACKS.default;
    });
  };

  const getActivityImage = (activity: string, destination: string, bookingUrl?: string): Promise<string> => {
    const cleanAct = stripActivityVerbs(activity || '').trim() || activity;
    const cleanDest = cleanCity(destination || '');
    const key = `act:${cleanAct.toLowerCase()}:${cleanDest.toLowerCase()}`;
    return resolve(key, async () => {
      const pexels = await fetchPexels(pexelsKey, `${cleanAct} ${cleanDest}`);
      if (pexels) return pexels;
      const pixabay = await fetchPixabay(pixabayKey, `${cleanAct} ${cleanDest}`);
      if (pixabay) return pixabay;
      if (bookingUrl && !/[?&]q=|\/search/i.test(bookingUrl)) {
        const og = await fetchOgImage(bookingUrl);
        if (og && !/logo|sprite|icon/i.test(og)) return og;
      }
      if (cleanAct) {
        const fr = await fetchWiki('fr', cleanAct);
        if (fr) return fr;
        const en = await fetchWiki('en', cleanAct);
        if (en) return en;
      }
      return loremFlickr(`${cleanAct},${cleanDest}`);
    });
  };

  const getOgImageFromUrl = async (url: string): Promise<string | null> => {
    if (!url) return null;
    const key = `og:${url}`;
    if (cache.has(key)) return cache.get(key)!;
    const img = await fetchOgImage(url);
    if (img) cache.set(key, img);
    return img;
  };

  return { getDestinationImage, getActivityImage, getOgImageFromUrl };
}
