import { getAmadeus } from '../config/amadeus';
import { cities } from '../data/airports';
import { withBookingAffiliate } from '../config/affiliates';

export interface AmadeusHotelOffer {
  hotelName: string;
  hotelId: string;
  chainCode: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  bookingUrl: string;
  source: 'amadeus';
}

function resolveCityCode(cityInput: string): string | null {
  const codeMatch = cityInput.match(/\(([A-Z]{3})\)/);
  if (codeMatch) return codeMatch[1];

  const cleaned = cityInput.split(',')[0].replace(/\s*\([A-Z]{3}\)\s*$/, '').trim();
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const q = norm(cleaned);
  const city = cities.find(c => norm(c.name) === q);
  if (city && city.airports.length > 0) return city.airports[0].code;
  return null;
}

function buildBookingLink(hotelName: string, destination: string, checkIn: string, checkOut: string, adults: number): string {
  const destEnc = encodeURIComponent(destination);
  return withBookingAffiliate(`https://www.booking.com/searchresults.fr.html?ss=${encodeURIComponent(hotelName)}+${destEnc}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=1`);
}

export async function searchAmadeusHotels(params: {
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  accommodationType?: string;
  accommodationArea?: string;
}): Promise<AmadeusHotelOffer[] | null> {
  const amadeus = getAmadeus();
  if (!amadeus) return null;

  const cityCode = resolveCityCode(params.destination);
  if (!cityCode) {
    console.log(`Amadeus: could not resolve city code for: ${params.destination}`);
    return null;
  }

  try {
    console.log(`Amadeus hotel search: ${cityCode} (${params.startDate} → ${params.endDate}, ${params.people} guests)`);

    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode,
      radius: 20,
      radiusUnit: 'KM',
      hotelSource: 'ALL',
    });

    if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
      console.log(`Amadeus: no hotels found for city ${cityCode}`);
      return null;
    }

    const hotelIds = hotelListResponse.data
      .slice(0, 15)
      .map((h: any) => h.hotelId)
      .filter(Boolean)
      .join(',');

    if (!hotelIds) return null;

    const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds,
      checkInDate: params.startDate,
      checkOutDate: params.endDate,
      adults: params.people,
      roomQuantity: 1,
      currency: 'EUR',
    });

    if (!offersResponse.data || offersResponse.data.length === 0) {
      console.log('Amadeus: no hotel offers found');
      return null;
    }

    const duration = Math.max(1, Math.ceil(
      (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ));

    const hotels: AmadeusHotelOffer[] = offersResponse.data
      .filter((hotel: any) => hotel.offers && hotel.offers.length > 0)
      .map((hotel: any) => {
        const offer = hotel.offers[0];
        const totalPrice = parseFloat(offer.price.total || offer.price.base || '0');
        const rating = hotel.hotel?.rating ? parseInt(hotel.hotel.rating) : 0;

        return {
          hotelName: hotel.hotel?.name || 'Hôtel',
          hotelId: hotel.hotel?.hotelId || '',
          chainCode: hotel.hotel?.chainCode || '',
          rating,
          pricePerNight: Math.round(totalPrice / duration),
          totalPrice: Math.round(totalPrice),
          currency: offer.price.currency || 'EUR',
          checkIn: params.startDate,
          checkOut: params.endDate,
          roomType: offer.room?.description?.text || offer.room?.typeEstimated?.category || 'Chambre standard',
          bookingUrl: buildBookingLink(
            hotel.hotel?.name || 'hotel',
            params.destination,
            params.startDate,
            params.endDate,
            params.people,
          ),
          source: 'amadeus' as const,
        };
      })
      .filter((h: AmadeusHotelOffer) => h.totalPrice > 0)
      .sort((a: AmadeusHotelOffer, b: AmadeusHotelOffer) => a.pricePerNight - b.pricePerNight)
      .slice(0, 5);

    console.log(`Found ${hotels.length} real Amadeus hotels`);
    return hotels;
  } catch (error: any) {
    console.error('Amadeus hotel search error:', error?.response?.result?.errors || error.message || error);
    return null;
  }
}
