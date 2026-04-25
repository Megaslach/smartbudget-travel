import { api } from './api';

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const normalize = (s: string) => s.trim().toLowerCase().split(',')[0].trim();

const fallbackUnsplash = (query: string) =>
  `https://source.unsplash.com/featured/600x400/?${encodeURIComponent(query)},city`;

export async function getDestinationImage(destination: string): Promise<string | null> {
  if (!destination) return null;
  const key = normalize(destination);
  if (cache.has(key)) return cache.get(key) || null;

  if (inflight.has(key)) return inflight.get(key)!;

  const promise = (async () => {
    try {
      const { destinations } = await api.searchDestinations(key);
      const match = destinations[0];
      const img = match?.image || fallbackUnsplash(key);
      cache.set(key, img);
      return img;
    } catch {
      const img = fallbackUnsplash(key);
      cache.set(key, img);
      return img;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
