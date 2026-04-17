import { env } from '../config/env';
import { withBookingAffiliate } from '../config/affiliates';

export interface SerpApiHotelOffer {
  hotelName: string;
  hotelId: string;
  rating: number;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  thumbnail?: string;
  bookingUrl: string;
  source: 'serpapi';
}

function buildBookingFallback(hotelName: string, destination: string, checkIn: string, checkOut: string, adults: number): string {
  return withBookingAffiliate(`https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(hotelName + ' ' + destination)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1`);
}

export async function searchSerpApiHotels(params: {
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  accommodationArea?: string;
  accommodationType?: string;
}): Promise<SerpApiHotelOffer[] | null> {
  if (!env.SERPAPI_KEY) return null;

  const query = params.accommodationArea
    ? `${params.accommodationArea}, ${params.destination}`
    : params.destination;

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_hotels');
  url.searchParams.set('q', query);
  url.searchParams.set('check_in_date', params.startDate);
  url.searchParams.set('check_out_date', params.endDate);
  url.searchParams.set('adults', String(params.people));
  url.searchParams.set('currency', 'EUR');
  url.searchParams.set('hl', 'fr');
  url.searchParams.set('gl', 'fr');
  const at = params.accommodationType;
  if (at === 'hotel' || at === 'luxury') url.searchParams.set('property_types', '17');
  if (at === 'apartment' || at === 'villa' || at === 'bnb' || at === 'airbnb') url.searchParams.set('vacation_rentals', 'true');
  url.searchParams.set('api_key', env.SERPAPI_KEY);

  const duration = Math.max(1, Math.ceil(
    (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  try {
    console.log(`SerpApi Google Hotels: "${query}" (${params.startDate} → ${params.endDate})`);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      console.error(`SerpApi hotels ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data: any = await res.json();
    if (data.error) {
      console.error('SerpApi hotels error:', data.error);
      return null;
    }

    const properties: any[] = data.properties || [];
    if (properties.length === 0) {
      console.log('SerpApi: no hotels found');
      return null;
    }

    const hotels: SerpApiHotelOffer[] = properties
      .slice(0, 12)
      .map((p: any): SerpApiHotelOffer | null => {
        const pricePerNight = p.rate_per_night?.extracted_lowest || p.rate_per_night?.lowest
          ? parseFloat(String(p.rate_per_night.extracted_lowest ?? String(p.rate_per_night.lowest).replace(/[^\d.]/g, '')))
          : 0;
        const totalPrice = p.total_rate?.extracted_lowest || p.total_rate?.lowest
          ? parseFloat(String(p.total_rate.extracted_lowest ?? String(p.total_rate.lowest).replace(/[^\d.]/g, '')))
          : pricePerNight * duration;

        if (!pricePerNight || pricePerNight <= 0) return null;

        return {
          hotelName: p.name || 'Hôtel',
          hotelId: p.property_token || p.serpapi_property_details_link || '',
          rating: p.overall_rating || 0,
          stars: p.extracted_hotel_class || p.hotel_class || 0,
          pricePerNight: Math.round(pricePerNight),
          totalPrice: Math.round(totalPrice),
          currency: 'EUR',
          checkIn: params.startDate,
          checkOut: params.endDate,
          roomType: p.type || 'Chambre standard',
          thumbnail: p.images?.[0]?.thumbnail || p.images?.[0]?.original_image,
          bookingUrl: p.link || buildBookingFallback(p.name || '', params.destination, params.startDate, params.endDate, params.people),
          source: 'serpapi' as const,
        };
      })
      .filter((h): h is SerpApiHotelOffer => h !== null)
      .sort((a, b) => a.pricePerNight - b.pricePerNight)
      .slice(0, 5);

    console.log(`Found ${hotels.length} real SerpApi hotels`);
    return hotels.length > 0 ? hotels : null;
  } catch (err: any) {
    console.error('SerpApi hotel search error:', err.message || err);
    return null;
  }
}
