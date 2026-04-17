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

/**
 * TravelPayouts marker-based affiliation.
 * Every link routed through the TP network picks up the `marker` param,
 * which TP uses to credit commissions across Hotellook, Aviasales, Trip.com,
 * Kiwi, etc. Used both for their direct search URLs and for wrapping
 * partner URLs via the TP redirect.
 */
export const withTravelPayoutsMarker = (url: string): string => {
  if (!env.TRAVELPAYOUTS_MARKER) return url;
  return appendParams(url, { marker: env.TRAVELPAYOUTS_MARKER });
};

/**
 * Wraps an external partner URL through TravelPayouts' redirect so the
 * commission is tracked. Falls back to the raw URL when the marker is not
 * configured yet.
 */
export const throughTravelPayouts = (partnerUrl: string): string => {
  if (!env.TRAVELPAYOUTS_MARKER) return partnerUrl;
  return `https://tp.media/r?marker=${encodeURIComponent(env.TRAVELPAYOUTS_MARKER)}&u=${encodeURIComponent(partnerUrl)}`;
};

export const withTheForkAffiliate = (url: string): string => {
  return withTravelPayoutsMarker(url);
};

export const withAffiliate = (url: string): string => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('booking.com')) return withBookingAffiliate(url);
    if (host.includes('skyscanner')) return withSkyscannerAffiliate(url);
    if (host.includes('getyourguide')) return withGetYourGuideAffiliate(url);
    if (host.includes('rentalcars')) return withRentalcarsAffiliate(url);
    if (host.includes('hotellook') || host.includes('aviasales') || host.includes('tp.media')) return withTravelPayoutsMarker(url);
    if (host.includes('thefork')) return withTheForkAffiliate(url);
    return url;
  } catch {
    return url;
  }
};
