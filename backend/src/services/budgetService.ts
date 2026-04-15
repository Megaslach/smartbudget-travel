import { openai } from '../config/openai';
import { searchRealFlights, RealFlightOffer } from './flightSearchService';
import { searchRealHotels, RealHotelOffer } from './hotelSearchService';

export interface FlightOption {
  airline: string;
  price: number;
  type: string;
  bookingUrl: string;
  departureAt?: string;
  arrivalAt?: string;
  duration?: string;
  stops?: number;
  isRealData?: boolean;
}

export interface HotelOption {
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  bookingUrl: string;
  totalPrice?: number;
  roomType?: string;
  isRealData?: boolean;
}

export interface ActivityOption {
  name: string;
  price: number;
  duration: string;
  bookingUrl: string;
}

export interface FlightEstimate {
  avgPrice: number;
  source: string;
  note: string;
  options: FlightOption[];
  searchUrl: string;
  isRealData: boolean;
}

export interface AccommodationEstimate {
  avgPerNight: number;
  total: number;
  source: string;
  note: string;
  options: HotelOption[];
  searchUrl: string;
  isRealData: boolean;
}

export interface ActivitiesEstimate {
  total: number;
  perDayPerPerson: number;
  options: ActivityOption[];
  searchUrl: string;
}

export interface BudgetEstimate {
  flights: FlightEstimate;
  accommodation: AccommodationEstimate;
  food: number;
  transport: number;
  activities: ActivitiesEstimate;
  total: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

export interface PremiumFilters {
  accommodationArea?: string;
  accommodationType?: 'hotel' | 'airbnb' | 'hostel' | 'luxury';
  flightClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  foodBudget?: 'budget' | 'moderate' | 'premium' | 'luxury';
  interests?: string[];
  maxBudget?: number;
}

export interface SimulationInput {
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  departureAirport?: string;
  arrivalAirport?: string;
  premiumFilters?: PremiumFilters;
}

function buildActivityUrl(activityName: string, destination: string): string {
  // Deep search per activity: GetYourGuide query combining name + destination
  // This lands on a pre-filled search page with the specific activity
  const query = encodeURIComponent(`${activityName} ${destination}`);
  return `https://www.getyourguide.fr/s/?q=${query}`;
}

function buildSearchUrls(input: SimulationInput, originCode?: string, destCode?: string) {
  const { destination, departureCity, startDate, endDate, people } = input;
  const area = input.premiumFilters?.accommodationArea;
  const accomSearch = area ? `${area}, ${destination}` : destination;
  const destEnc = encodeURIComponent(destination);
  const accomEnc = encodeURIComponent(accomSearch);

  const oc = (originCode || '').toLowerCase();
  const dc = (destCode || '').toLowerCase();
  const sd = startDate.replace(/-/g, '').slice(2);
  const ed = endDate.replace(/-/g, '').slice(2);

  const skyscanner = oc && dc
    ? `https://www.skyscanner.fr/transport/vols/${oc}/${dc}/${sd}/${ed}/?adultes=${people}&cabineclass=economy`
    : `https://www.skyscanner.fr/transport/vols/${encodeURIComponent(departureCity)}/${destEnc}/${sd}/${ed}/`;

  return {
    skyscanner,
    googleFlights: `https://www.google.com/travel/flights?q=Flights+from+${encodeURIComponent(departureCity)}+to+${destEnc}+on+${startDate}+return+${endDate}`,
    booking: `https://www.booking.com/searchresults.fr.html?ss=${accomEnc}&checkin=${startDate}&checkout=${endDate}&group_adults=${people}`,
    airbnb: `https://www.airbnb.fr/s/${accomEnc}/homes?checkin=${startDate}&checkout=${endDate}&adults=${people}`,
    getyourguide: `https://www.getyourguide.fr/s/?q=${destEnc}`,
  };
}

export async function estimateBudget(input: SimulationInput): Promise<BudgetEstimate> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;
  const pf = input.premiumFilters;

  // ======== 1. REAL FLIGHTS (Amadeus) ========
  let realFlights: RealFlightOffer[] | null = null;
  let originCode = '';
  let destCode = '';

  try {
    const flightResult = await searchRealFlights({
      departureCity,
      destination,
      startDate,
      endDate,
      people,
      flightClass: pf?.flightClass,
    });
    if (flightResult && flightResult.flights.length > 0) {
      realFlights = flightResult.flights;
      originCode = flightResult.originCode;
      destCode = flightResult.destCode;
    }
  } catch (err) {
    console.error('Real flight search failed:', err);
  }

  // ======== 2. REAL HOTELS (Amadeus) ========
  let realHotels: RealHotelOffer[] | null = null;

  try {
    const hotelResult = await searchRealHotels({
      destination,
      startDate,
      endDate,
      people,
      accommodationType: pf?.accommodationType,
      accommodationArea: pf?.accommodationArea,
    });
    if (hotelResult && hotelResult.length > 0) {
      realHotels = hotelResult;
    }
  } catch (err) {
    console.error('Real hotel search failed:', err);
  }

  const urls = buildSearchUrls(input, originCode, destCode);

  // ======== 3. AI for activities/food/transport (+ flight/hotel fallback) ========
  const aiData = await getAiEstimates(input, urls, !!realFlights, !!realHotels);

  // ======== 4. BUILD FINAL RESULT ========
  let flights: FlightEstimate;
  if (realFlights && realFlights.length > 0) {
    const avgPrice = Math.round(realFlights.reduce((s, f) => s + f.price, 0) / realFlights.length);
    flights = {
      avgPrice: Math.round(realFlights[0].price),
      source: 'Skyscanner — Prix réels',
      note: `${realFlights.length} vols trouvés pour ${startDate}. Prix par personne A/R.`,
      searchUrl: urls.skyscanner,
      isRealData: true,
      options: realFlights.slice(0, 5).map((f) => ({
        airline: `${f.airlineName}`,
        price: Math.round(f.price),
        type: f.stops === 0 ? 'Vol direct' : `${f.stops} escale${f.stops > 1 ? 's' : ''}`,
        bookingUrl: f.bookingUrl,
        departureAt: f.departureAt,
        arrivalAt: f.arrivalAt,
        duration: f.duration,
        stops: f.stops,
        isRealData: true,
      })),
    };
  } else {
    flights = aiData.flights;
    flights.searchUrl = urls.skyscanner;
    flights.isRealData = false;
  }

  let accommodation: AccommodationEstimate;
  if (realHotels && realHotels.length > 0) {
    const avgPerNight = Math.round(realHotels.reduce((s, h) => s + h.pricePerNight, 0) / realHotels.length);
    const total = avgPerNight * duration;
    accommodation = {
      avgPerNight,
      total,
      source: 'Skyscanner — Prix réels',
      note: `${realHotels.length} hébergements trouvés. Prix par nuit.`,
      searchUrl: urls.booking,
      isRealData: true,
      options: realHotels.map((h) => ({
        name: h.hotelName,
        type: `${h.rating > 0 ? h.rating + '★' : 'Hôtel'}`,
        pricePerNight: h.pricePerNight,
        rating: h.rating || 0,
        bookingUrl: h.bookingUrl,
        totalPrice: h.totalPrice,
        roomType: h.roomType,
        isRealData: true,
      })),
    };
  } else {
    accommodation = aiData.accommodation;
    accommodation.searchUrl = urls.booking;
    accommodation.isRealData = false;
  }

  const activities = aiData.activities;
  activities.searchUrl = urls.getyourguide;

  const flightsTotal = flights.avgPrice * people;
  const total = flightsTotal + accommodation.total + aiData.food + aiData.transport + activities.total;

  const hasReal = flights.isRealData || accommodation.isRealData;
  const confidence = flights.isRealData && accommodation.isRealData ? 'high'
    : hasReal ? 'medium' : 'low';

  const dataSources: string[] = [];
  if (flights.isRealData) dataSources.push('vols réels (Skyscanner)');
  if (accommodation.isRealData) dataSources.push('hôtels réels (Skyscanner)');
  if (!flights.isRealData || !accommodation.isRealData) dataSources.push('estimation IA');

  return {
    flights,
    accommodation,
    food: aiData.food,
    transport: aiData.transport,
    activities,
    total,
    currency: 'EUR',
    confidence,
    summary: aiData.summary + (hasReal ? ` Sources : ${dataSources.join(', ')}.` : ''),
  };
}

async function getAiEstimates(
  input: SimulationInput,
  urls: ReturnType<typeof buildSearchUrls>,
  hasRealFlights: boolean,
  hasRealHotels: boolean,
): Promise<{
  flights: FlightEstimate;
  accommodation: AccommodationEstimate;
  food: number;
  transport: number;
  activities: ActivitiesEstimate;
  summary: string;
}> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;
  const pf = input.premiumFilters;

  const premiumSection = pf ? [
    pf.accommodationArea && `- Quartier hébergement : ${pf.accommodationArea}`,
    pf.accommodationType && `- Type : ${pf.accommodationType}`,
    pf.flightClass && `- Classe vol : ${pf.flightClass}`,
    pf.foodBudget && `- Repas : ${pf.foodBudget}`,
    pf.interests?.length && `- Intérêts : ${pf.interests.join(', ')}`,
    pf.maxBudget && `- Budget max : ${pf.maxBudget}€`,
  ].filter(Boolean).join('\n') : '';

  const prompt = `Expert voyage. ${departureCity} → ${destination}, ${startDate} au ${endDate} (${duration} nuits), ${people} pers.
${premiumSection ? '\nFiltres:\n' + premiumSection : ''}

Retourne UNIQUEMENT ce JSON :
{
  ${!hasRealFlights ? `"flights":{"avgPrice":<A/R par pers EUR>,"note":"<info>","options":[{"airline":"<compagnie>","price":<prix>,"type":"direct/escale"}]},` : ''}
  ${!hasRealHotels ? `"accommodation":{"avgPerNight":<par nuit groupe>,"total":<total>,"note":"<info>","options":[{"name":"<hotel>","type":"<type>","pricePerNight":<prix>,"rating":<note>}]},` : ''}
  "food":<total nourriture>,
  "transport":<total transport local>,
  "activities":{"total":<total>,"perDayPerPerson":<par jour/pers>,"options":[{"name":"<activité réelle>","price":<prix/pers>,"duration":"<durée>"}]},
  "summary":"<2 phrases résumé>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Expert budget voyage. JSON uniquement. Noms réels.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No AI response');
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);

    const flightsAi: FlightEstimate = parsed.flights ? {
      avgPrice: parsed.flights.avgPrice || 300,
      source: 'Estimation IA (configurez RapidAPI pour les prix réels)',
      note: parsed.flights.note || '',
      searchUrl: urls.skyscanner,
      isRealData: false,
      options: (parsed.flights.options || []).map((f: any) => ({
        ...f,
        bookingUrl: urls.skyscanner,
        isRealData: false,
      })),
    } : { avgPrice: 300, source: 'Estimation IA', note: '', searchUrl: urls.skyscanner, isRealData: false, options: [] };

    const accomAi: AccommodationEstimate = parsed.accommodation ? {
      avgPerNight: parsed.accommodation.avgPerNight || 80,
      total: parsed.accommodation.total || 80 * duration,
      source: 'Estimation IA (configurez RapidAPI pour les prix réels)',
      note: parsed.accommodation.note || '',
      searchUrl: urls.booking,
      isRealData: false,
      options: (parsed.accommodation.options || []).map((h: any) => ({
        ...h,
        bookingUrl: urls.booking,
        isRealData: false,
      })),
    } : { avgPerNight: 80, total: 80 * duration, source: 'Estimation IA', note: '', searchUrl: urls.booking, isRealData: false, options: [] };

    const activities: ActivitiesEstimate = {
      total: parsed.activities?.total || 25 * duration * people,
      perDayPerPerson: parsed.activities?.perDayPerPerson || 25,
      searchUrl: urls.getyourguide,
      options: (parsed.activities?.options || []).map((a: any) => ({
        name: a.name,
        price: a.price,
        duration: a.duration,
        bookingUrl: buildActivityUrl(a.name, destination),
      })),
    };

    return {
      flights: flightsAi,
      accommodation: accomAi,
      food: parsed.food || 40 * duration * people,
      transport: parsed.transport || 15 * duration * people,
      activities,
      summary: parsed.summary || '',
    };
  } catch (error) {
    console.error('AI estimation failed:', error);
    return {
      flights: { avgPrice: 300, source: 'Estimation par défaut', note: '', searchUrl: urls.skyscanner, isRealData: false, options: [{ airline: 'Voir sur Skyscanner', price: 300, type: 'Rechercher', bookingUrl: urls.skyscanner }] },
      accommodation: { avgPerNight: 80, total: 80 * duration, source: 'Estimation par défaut', note: '', searchUrl: urls.booking, isRealData: false, options: [{ name: 'Voir sur Booking', type: 'Hôtel', pricePerNight: 80, rating: 0, bookingUrl: urls.booking }] },
      food: 40 * duration * people,
      transport: 15 * duration * people,
      activities: { total: 25 * duration * people, perDayPerPerson: 25, searchUrl: urls.getyourguide, options: [] },
      summary: 'Estimation par défaut. Configurez RAPIDAPI_KEY pour les prix réels.',
    };
  }
}
