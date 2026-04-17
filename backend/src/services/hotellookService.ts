import { env } from '../config/env';
import { withTravelPayoutsMarker } from '../config/affiliates';

export interface HotellookHotelOffer {
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
  source: 'hotellook';
}

function buildHotellookBookingUrl(hotelId: string | number, checkIn: string, checkOut: string, adults: number): string {
  const base = `https://search.hotellook.com/hotels?hotelId=${encodeURIComponent(String(hotelId))}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&currency=EUR&language=fr`;
  return withTravelPayoutsMarker(base);
}

function buildHotellookSearchFallback(location: string, checkIn: string, checkOut: string, adults: number): string {
  const base = `https://search.hotellook.com/?destination=${encodeURIComponent(location)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&currency=EUR&language=fr`;
  return withTravelPayoutsMarker(base);
}

export async function searchHotellookHotels(params: {
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  accommodationArea?: string;
}): Promise<HotellookHotelOffer[] | null> {
  if (!env.TRAVELPAYOUTS_TOKEN) return null;

  const location = params.accommodationArea
    ? `${params.accommodationArea}, ${params.destination}`
    : params.destination;

  const duration = Math.max(1, Math.ceil(
    (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const url = new URL('https://engine.hotellook.com/api/v2/cache.json');
  url.searchParams.set('location', location);
  url.searchParams.set('checkIn', params.startDate);
  url.searchParams.set('checkOut', params.endDate);
  url.searchParams.set('adults', String(params.people));
  url.searchParams.set('currency', 'EUR');
  url.searchParams.set('limit', '12');
  url.searchParams.set('token', env.TRAVELPAYOUTS_TOKEN);

  try {
    console.log(`Hotellook cache: "${location}" (${params.startDate} → ${params.endDate})`);
    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      console.error(`Hotellook ${res.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data: any = await res.json();
    const items: any[] = Array.isArray(data) ? data : data?.hotels || [];
    if (!items || items.length === 0) {
      console.log('Hotellook: no hotels found');
      return null;
    }

    const hotels: HotellookHotelOffer[] = items
      .map((h: any): HotellookHotelOffer | null => {
        const totalPrice = Number(h.priceFrom || h.price_from || h.priceAvg || 0);
        if (!totalPrice || totalPrice <= 0) return null;
        const pricePerNight = Math.round(totalPrice / duration);
        const hotelId = h.hotelId || h.id || h.hotel_id || '';

        return {
          hotelName: h.hotelName || h.name || 'Hôtel',
          hotelId: String(hotelId),
          rating: Number(h.rating || h.stars || 0),
          stars: Number(h.stars || 0),
          pricePerNight,
          totalPrice: Math.round(totalPrice),
          currency: 'EUR',
          checkIn: params.startDate,
          checkOut: params.endDate,
          roomType: 'Chambre standard',
          thumbnail: h.photoUrl || undefined,
          bookingUrl: hotelId
            ? buildHotellookBookingUrl(hotelId, params.startDate, params.endDate, params.people)
            : buildHotellookSearchFallback(location, params.startDate, params.endDate, params.people),
          source: 'hotellook' as const,
        };
      })
      .filter((h): h is HotellookHotelOffer => h !== null)
      .sort((a, b) => a.pricePerNight - b.pricePerNight)
      .slice(0, 5);

    console.log(`Found ${hotels.length} real Hotellook hotels`);
    return hotels.length > 0 ? hotels : null;
  } catch (err: any) {
    console.error('Hotellook search error:', err.message || err);
    return null;
  }
}
