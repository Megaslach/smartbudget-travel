// Destination images via backend proxy (uses server-side Pexels key).
// Falls back to client-side fetcher if backend unreachable.

import { createImageFetcher } from '@smartbudget/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smartbudget-api.vercel.app/api';

const clientFetcher = createImageFetcher({
  pexelsKey: process.env.NEXT_PUBLIC_PEXELS_KEY,
  pixabayKey: process.env.NEXT_PUBLIC_PIXABAY_KEY,
});

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

export const getDestinationImage = async (destination: string): Promise<string> => {
  if (!destination) return clientFetcher.getDestinationImage(destination);
  const key = destination.toLowerCase().split(',')[0].trim();
  const cached = cache.get(key);
  if (cached) return cached;
  const inFlight = inflight.get(key);
  if (inFlight) return inFlight;

  const p = (async () => {
    try {
      const r = await fetch(`${API_URL}/destinations/image?q=${encodeURIComponent(destination)}`);
      if (r.ok) {
        const j = await r.json();
        if (j?.url) {
          cache.set(key, j.url);
          return j.url as string;
        }
      }
    } catch {}
    // Fallback to client-side fetcher if backend fails
    const url = await clientFetcher.getDestinationImage(destination);
    cache.set(key, url);
    return url;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
};

export const getActivityImage = clientFetcher.getActivityImage;
export const getOgImageFromUrl = clientFetcher.getOgImageFromUrl;
