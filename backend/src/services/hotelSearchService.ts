import { env } from '../config/env';

export interface RealHotelOffer {
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
  bookingUrl: string;
  source: 'skyscanner';
}

// ---- Helper ----

async function rapidApiFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error(`RapidAPI ${res.status}: ${res.statusText}`);
  return res.json();
}

// ---- Step 1: resolve destination → entityId ----

async function resolveHotelEntity(query: string): Promise<{ entityId: string; destId: string } | null> {
  try {
    const data = await rapidApiFetch(
      `https://sky-scrapper.p.rapidapi.com/api/v1/hotels/searchDestinationOrHotel?query=${encodeURIComponent(query)}&locale=fr-FR`
    );
    const results = data?.data;
    if (!results || results.length === 0) return null;
    const best = results[0];
    return {
      entityId: best.entityId || best.hierarchy?.entityId || '',
      destId: best.destId || best.entityId || '',
    };
  } catch (err) {
    console.error('Sky Scrapper hotel destination search error:', err);
    return null;
  }
}

// ---- Step 2: search hotels ----

function buildBookingLink(hotelName: string, destination: string, checkIn: string, checkOut: string, adults: number): string {
  return `https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(hotelName + ' ' + destination)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1`;
}

export async function searchRealHotels(params: {
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  accommodationType?: string;
  accommodationArea?: string;
}): Promise<RealHotelOffer[] | null> {
  if (!env.RAPIDAPI_KEY) return null;

  const searchQuery = params.accommodationArea
    ? `${params.accommodationArea}, ${params.destination}`
    : params.destination;

  console.log(`Sky Scrapper: resolving hotel destination "${searchQuery}"...`);

  const entity = await resolveHotelEntity(searchQuery);
  if (!entity) {
    console.log(`Could not resolve hotel entity for: ${searchQuery}`);
    return null;
  }

  const duration = Math.max(1, Math.ceil(
    (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));

  try {
    console.log(`Sky Scrapper hotel search: entityId=${entity.entityId}, ${params.startDate} → ${params.endDate}`);

    const searchUrl = `https://sky-scrapper.p.rapidapi.com/api/v1/hotels/searchHotels`
      + `?entityId=${entity.entityId}`
      + `&checkin=${params.startDate}`
      + `&checkout=${params.endDate}`
      + `&adults=${params.people}`
      + `&rooms=1`
      + `&currency=EUR`
      + `&market=FR`
      + `&locale=fr-FR`;

    const data = await rapidApiFetch(searchUrl);

    const hotels = data?.data?.hotels;
    if (!hotels || hotels.length === 0) {
      console.log('No hotels found');
      return null;
    }

    const results: RealHotelOffer[] = hotels
      .slice(0, 8)
      .map((hotel: any) => {
        const totalPrice = hotel.price?.raw || hotel.rawPrice || 0;
        const pricePerNight = duration > 0 ? Math.round(totalPrice / duration) : totalPrice;
        const stars = hotel.stars || 0;
        const rating = hotel.rating?.value || hotel.reviewScore || 0;

        return {
          hotelName: hotel.name || 'Hôtel',
          hotelId: hotel.hotelId || hotel.id || '',
          rating: typeof rating === 'number' ? Math.round(rating * 10) / 10 : 0,
          stars,
          pricePerNight,
          totalPrice: Math.round(totalPrice),
          currency: 'EUR',
          checkIn: params.startDate,
          checkOut: params.endDate,
          roomType: hotel.roomType || 'Chambre standard',
          bookingUrl: buildBookingLink(
            hotel.name || 'hotel',
            params.destination,
            params.startDate,
            params.endDate,
            params.people
          ),
          source: 'skyscanner' as const,
        };
      })
      .filter((h: RealHotelOffer) => h.totalPrice > 0)
      .sort((a: RealHotelOffer, b: RealHotelOffer) => a.pricePerNight - b.pricePerNight)
      .slice(0, 5);

    console.log(`Found ${results.length} real hotel offers`);
    return results;
  } catch (error: any) {
    console.error('Sky Scrapper hotel search error:', error.message || error);
    return null;
  }
}
