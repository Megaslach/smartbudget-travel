import { env } from './env';

/**
 * Central affiliate config.
 * Each helper takes a plain destination URL and appends the tracking params
 * needed by the program. If an affiliate ID is missing (not yet configured),
 * the helper returns the URL unchanged — so the app keeps working without
 * revenue rather than breaking links.
 */

const appendParams = (url: string, params: Record<string, string | undefined>): string => {
  const entries = Object.entries(params).filter(([, v]) => v && v.length > 0) as [string, string][];
  if (entries.length === 0) return url;
  const sep = url.includes('?') ? '&' : '?';
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `${url}${sep}${qs}`;
};

export const withBookingAffiliate = (url: string): string => {
  if (!env.BOOKING_AFFILIATE_ID) return url;
  return appendParams(url, { aid: env.BOOKING_AFFILIATE_ID, label: 'smartbudget' });
};

export const withSkyscannerAffiliate = (url: string): string => {
  if (!env.SKYSCANNER_AFFILIATE_ID) return url;
  return appendParams(url, { associateid: env.SKYSCANNER_AFFILIATE_ID });
};

export const withGetYourGuideAffiliate = (url: string): string => {
  if (!env.GETYOURGUIDE_AFFILIATE_ID) return url;
  return appendParams(url, { partner_id: env.GETYOURGUIDE_AFFILIATE_ID });
};

export const withRentalcarsAffiliate = (url: string): string => {
  if (!env.RENTALCARS_AFFILIATE_ID) return url;
  return appendParams(url, { affiliateCode: env.RENTALCARS_AFFILIATE_ID });
};

export const withAffiliate = (url: string): string => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('booking.com')) return withBookingAffiliate(url);
    if (host.includes('skyscanner')) return withSkyscannerAffiliate(url);
    if (host.includes('getyourguide')) return withGetYourGuideAffiliate(url);
    if (host.includes('rentalcars')) return withRentalcarsAffiliate(url);
    return url;
  } catch {
    return url;
  }
};
