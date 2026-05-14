// Server-side image resolver — pre-fills imageUrl on activities/hotels
// so mobile + web don't have to do client-side fetches.
// Uses Pexels API (requires PEXELS_KEY env var). Falls back to a
// deterministic LoremFlickr URL when no key or no match.

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const stripActivityVerbs = (s: string) =>
  s.replace(
    /^(visite|tour|découverte|excursion|balade|promenade|cours|atelier|dégustation|déjeuner|dîner|soirée)\s+(de|à|du|des|en|sur|au|aux)?\s*/i,
    '',
  ).trim();

const loremFlickr = (keywords: string) =>
  `https://loremflickr.com/600/400/${encodeURIComponent(keywords.replace(/\s+/g, ',').replace(/[^\w,]/g, ''))}`;

async function fetchPexels(query: string, key: string): Promise<string | null> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: key } });
    if (!r.ok) return null;
    const j = await r.json() as { photos?: { src?: { large?: string; medium?: string } }[] };
    return j?.photos?.[0]?.src?.large || j?.photos?.[0]?.src?.medium || null;
  } catch {
    return null;
  }
}

/** Resolve an image URL for an activity title in a destination. */
export async function resolveActivityImage(activityName: string, destination: string): Promise<string> {
  const key = process.env.PEXELS_KEY || process.env.EXPO_PUBLIC_PEXELS_KEY || process.env.NEXT_PUBLIC_PEXELS_KEY;
  const cleanAct = stripActivityVerbs(activityName).trim() || activityName;
  const cleanDest = destination.split(',')[0].trim();
  const cacheKey = `act:${cleanAct.toLowerCase()}:${cleanDest.toLowerCase()}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey)!;
  if (inflight.has(cacheKey)) return inflight.get(cacheKey)!;

  const p = (async () => {
    let img: string | null = null;
    if (key) {
      // Try activity + destination first (most specific)
      img = await fetchPexels(`${cleanAct} ${cleanDest}`, key);
      // If no result, try activity alone
      if (!img) img = await fetchPexels(cleanAct, key);
      // Last try: destination alone (we'll get something thematic)
      if (!img) img = await fetchPexels(cleanDest, key);
    }
    const resolved = img || loremFlickr(`${cleanAct},${cleanDest}`);
    cache.set(cacheKey, resolved);
    return resolved;
  })();

  inflight.set(cacheKey, p);
  try { return await p; }
  finally { inflight.delete(cacheKey); }
}

/** Resolve images for many activities in parallel. */
export async function resolveActivityImages<T extends { name: string; imageUrl?: string }>(
  activities: T[],
  destination: string,
): Promise<T[]> {
  return Promise.all(
    activities.map(async (a) => {
      if (a.imageUrl) return a; // already has one (e.g. from SerpAPI)
      const url = await resolveActivityImage(a.name, destination);
      return { ...a, imageUrl: url };
    }),
  );
}

/** Resolve a hotel image when SerpAPI didn't provide one. */
export async function resolveHotelImage(hotelName: string, destination: string): Promise<string> {
  return resolveActivityImage(hotelName, destination);
}
