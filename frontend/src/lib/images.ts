import { createImageFetcher } from '@smartbudget/shared';

const fetcher = createImageFetcher({
  pexelsKey: process.env.NEXT_PUBLIC_PEXELS_KEY,
  pixabayKey: process.env.NEXT_PUBLIC_PIXABAY_KEY,
});

export const getDestinationImage = fetcher.getDestinationImage;
export const getActivityImage = fetcher.getActivityImage;
export const getOgImageFromUrl = fetcher.getOgImageFromUrl;
