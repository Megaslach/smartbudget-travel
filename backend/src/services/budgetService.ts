import { openai } from '../config/openai';
import { searchSerpApiFlights, SerpApiFlightOffer } from './serpapiFlightService';
import { searchSerpApiHotels, SerpApiHotelOffer } from './serpapiHotelService';
import { searchAmadeusFlights, AmadeusFlightOffer } from './amadeusFlightService';
import { searchAmadeusHotels, AmadeusHotelOffer } from './amadeusHotelService';
import { searchRealFlights, RealFlightOffer } from './flightSearchService';
import { searchKiwiFlights, KiwiFlightOffer } from './kiwiFlightService';
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
  imageUrl?: string;
}

export interface ActivityOption {
  name: string;
  price: number;
  duration: string;
  bookingUrl: string;
  imageUrl?: string;
}

export interface CarRentalOption {
  provider: string;
  category: string;
  pricePerDay: number;
  totalPrice: number;
  location: string;
  features: string[];
  bookingUrl: string;
  imageUrl?: string;
}

export interface PublicTransportOption {
  name: string;
  type: 'single' | 'day_pass' | 'multi_day' | 'taxi' | 'uber' | 'airport_transfer' | 'bike';
  price: number;
  description: string;
}

export interface LocalTransportEstimate {
  estimatedBudget: number;
  recommendation: string;
  carRentals: {
    options: CarRentalOption[];
    searchUrl: string;
  };
  publicTransport: {
    options: PublicTransportOption[];
  };
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
  localTransport?: LocalTransportEstimate;
  activities: ActivitiesEstimate;
  total: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

export interface PremiumFilters {
  accommodationArea?: string;
  accommodationType?: 'hotel' | 'apartment' | 'villa' | 'hostel' | 'luxury' | 'bnb';
  roomType?: 'single' | 'double' | 'twin' | 'family' | 'suite';
  flightClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  flightTimePreference?: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  directFlightOnly?: boolean;
  maxLayoverHours?: number;
  foodBudget?: 'budget' | 'moderate' | 'premium' | 'luxury';
  dietaryPreferences?: Array<'vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'kosher'>;
  transportPreference?: 'car' | 'public' | 'mixed' | 'walk_bike';
  tripPace?: 'relaxed' | 'balanced' | 'packed';
  tripStyle?: 'cultural' | 'adventure' | 'romantic' | 'family' | 'nightlife' | 'wellness' | 'gastronomic';
  interests?: string[];
  mustSeeList?: string;
  avoidList?: string;
  maxBudget?: number;
  hasChildren?: boolean;
  hasAccessibilityNeeds?: boolean;
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

function buildActivityImageUrl(activityName: string, destination: string): string {
  // Free Unsplash Source: keyword-based, deterministic per activity
  const keywords = encodeURIComponent(`${activityName},${destination},travel`);
  return `https://source.unsplash.com/400x300/?${keywords}`;
}

function buildCarRentalImageUrl(category: string): string {
  const k = category.toLowerCase();
  let keywords = 'rental,car';
  if (k.includes('suv') || k.includes('4x4')) keywords = 'suv,car';
  else if (k.includes('premium') || k.includes('luxe')) keywords = 'luxury,car';
  else if (k.includes('compact')) keywords = 'compact,car';
  else if (k.includes('écon') || k.includes('econ')) keywords = 'economy,hatchback,car';
  else if (k.includes('berline') || k.includes('sedan')) keywords = 'sedan,car';
  else if (k.includes('mini')) keywords = 'mini,city,car';
  else if (k.includes('van') || k.includes('monospace')) keywords = 'minivan,car';
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(keywords)}`;
}

function buildCarRentalBookingUrl(provider: string, destination: string, startDate: string, endDate: string): string {
  const destEnc = encodeURIComponent(destination);
  const prov = provider.toLowerCase();
  if (prov.includes('hertz')) return `https://www.hertz.fr/rentacar/reservation/?pickupLocation=${destEnc}&pickupDate=${startDate}&returnDate=${endDate}`;
  if (prov.includes('avis')) return `https://www.avis.fr/reserver/location-voiture?pickupLocation=${destEnc}&pickupDate=${startDate}&returnDate=${endDate}`;
  if (prov.includes('europcar')) return `https://www.europcar.fr/fr-fr/rechercher-une-voiture-de-location?pickupLocation=${destEnc}&pickupDate=${startDate}&returnDate=${endDate}`;
  if (prov.includes('sixt')) return `https://www.sixt.fr/location-de-voiture/?pickupLocation=${destEnc}&pickupDate=${startDate}&returnDate=${endDate}`;
  if (prov.includes('enterprise')) return `https://www.enterprise.fr/fr/reservation.html?pickupLocation=${destEnc}&pickupDate=${startDate}&returnDate=${endDate}`;
  return `https://www.kayak.fr/cars/${destEnc}/${startDate}/${endDate}`;
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
    kayakCars: `https://www.kayak.fr/cars/${destEnc}/${startDate}/${endDate}`,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => { console.log(`${label} timed out after ${ms}ms`); resolve(null); }, ms)),
  ]);
}

async function searchFlightsCascade(input: SimulationInput): Promise<{
  flights: Array<SerpApiFlightOffer | AmadeusFlightOffer | KiwiFlightOffer | RealFlightOffer> | null;
  source: 'serpapi' | 'amadeus' | 'kiwi' | 'skyscanner' | null;
  originCode: string;
  destCode: string;
}> {
  const { departureCity, destination, startDate, endDate, people } = input;
  const pf = input.premiumFilters;
  const params = { departureCity, destination, startDate, endDate, people, flightClass: pf?.flightClass };

  const providers: Array<{ fn: () => Promise<any>; name: 'serpapi' | 'amadeus' | 'kiwi' | 'skyscanner' }> = [
    { fn: () => searchSerpApiFlights(params), name: 'serpapi' },
    { fn: () => searchAmadeusFlights(params), name: 'amadeus' },
    { fn: () => searchKiwiFlights(params), name: 'kiwi' },
    { fn: () => searchRealFlights(params), name: 'skyscanner' },
  ];

  for (const p of providers) {
    try {
      const result = await withTimeout(p.fn(), 10000, `Flight:${p.name}`);
      if (result && result.flights && result.flights.length > 0) {
        return { flights: result.flights, source: p.name, originCode: result.originCode || '', destCode: result.destCode || '' };
      }
    } catch (err) { console.error(`${p.name} flight search failed:`, err); }
  }
  return { flights: null, source: null, originCode: '', destCode: '' };
}

async function searchHotelsCascade(input: SimulationInput): Promise<{
  hotels: Array<SerpApiHotelOffer | AmadeusHotelOffer | RealHotelOffer> | null;
  source: 'serpapi' | 'amadeus' | 'skyscanner' | null;
}> {
  const { destination, startDate, endDate, people } = input;
  const pf = input.premiumFilters;
  const params = { destination, startDate, endDate, people, accommodationType: pf?.accommodationType, accommodationArea: pf?.accommodationArea };

  const providers: Array<{ fn: () => Promise<any>; name: 'serpapi' | 'amadeus' | 'skyscanner' }> = [
    { fn: () => searchSerpApiHotels(params), name: 'serpapi' },
    { fn: () => searchAmadeusHotels(params), name: 'amadeus' },
    { fn: () => searchRealHotels(params), name: 'skyscanner' },
  ];

  for (const p of providers) {
    try {
      const result = await withTimeout(p.fn(), 10000, `Hotel:${p.name}`);
      if (result && Array.isArray(result) && result.length > 0) {
        return { hotels: result, source: p.name };
      }
    } catch (err) { console.error(`${p.name} hotel search failed:`, err); }
  }
  return { hotels: null, source: null };
}

export async function estimateBudget(input: SimulationInput): Promise<BudgetEstimate> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;
  const pf = input.premiumFilters;

  // ======== 1 & 2. REAL FLIGHTS + HOTELS IN PARALLEL ========
  const [flightResult, hotelResult] = await Promise.all([
    searchFlightsCascade(input),
    searchHotelsCascade(input),
  ]);

  const realFlights = flightResult.flights;
  const flightSource = flightResult.source;
  const originCode = flightResult.originCode;
  const destCode = flightResult.destCode;
  const realHotels = hotelResult.hotels;
  const hotelSource = hotelResult.source;

  const urls = buildSearchUrls(input, originCode, destCode);

  // ======== 3. AI for activities/food/transport (+ flight/hotel fallback) ========
  const aiData = await getAiEstimates(input, urls, !!realFlights, !!realHotels);

  // ======== 4. BUILD FINAL RESULT ========
  let flights: FlightEstimate;
  if (realFlights && realFlights.length > 0) {
    const sourceLabel = flightSource === 'serpapi' ? 'Google Flights — Prix réels'
      : flightSource === 'amadeus' ? 'Amadeus — Prix réels'
      : flightSource === 'kiwi' ? 'Kiwi.com — Prix réels'
      : 'Skyscanner — Prix réels';
    flights = {
      avgPrice: Math.round(realFlights[0].price),
      source: sourceLabel,
      note: `${realFlights.length} vols trouvés pour ${startDate}. Prix par personne A/R.`,
      searchUrl: (flightSource === 'kiwi' || flightSource === 'serpapi') ? (realFlights[0].bookingUrl || urls.skyscanner) : urls.skyscanner,
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
    const hotelSourceLabel = hotelSource === 'serpapi' ? 'Google Hotels — Prix réels'
      : hotelSource === 'amadeus' ? 'Amadeus — Prix réels'
      : 'Skyscanner — Prix réels';
    accommodation = {
      avgPerNight,
      total,
      source: hotelSourceLabel,
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
        imageUrl: (h as any).thumbnail || undefined,
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

  const flightSrcName = flightSource === 'serpapi' ? 'Google Flights'
    : flightSource === 'amadeus' ? 'Amadeus'
    : flightSource === 'kiwi' ? 'Kiwi.com'
    : 'Skyscanner';
  const hotelSrcName = hotelSource === 'serpapi' ? 'Google Hotels'
    : hotelSource === 'amadeus' ? 'Amadeus'
    : 'Skyscanner';
  const dataSources: string[] = [];
  if (flights.isRealData) dataSources.push(`vols réels (${flightSrcName})`);
  if (accommodation.isRealData) dataSources.push(`hôtels réels (${hotelSrcName})`);
  if (!flights.isRealData || !accommodation.isRealData) dataSources.push('estimation IA');

  return {
    flights,
    accommodation,
    food: aiData.food,
    transport: aiData.transport,
    localTransport: aiData.localTransport,
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
  localTransport: LocalTransportEstimate;
  activities: ActivitiesEstimate;
  summary: string;
}> {
  const { destination, departureCity, startDate, endDate, duration, people } = input;
  const pf = input.premiumFilters;

  const premiumSection = pf ? [
    pf.accommodationArea && `- Quartier hébergement : ${pf.accommodationArea}`,
    pf.accommodationType && `- Type : ${pf.accommodationType}`,
    pf.roomType && `- Chambre : ${pf.roomType}`,
    pf.flightClass && `- Classe vol : ${pf.flightClass}`,
    pf.flightTimePreference && pf.flightTimePreference !== 'any' && `- Heure vol : ${pf.flightTimePreference}`,
    pf.directFlightOnly && `- Vols directs uniquement`,
    pf.maxLayoverHours && `- Escale max : ${pf.maxLayoverHours}h`,
    pf.foodBudget && `- Repas : ${pf.foodBudget}`,
    pf.dietaryPreferences?.length && `- Régime : ${pf.dietaryPreferences.join(', ')}`,
    pf.transportPreference && `- Transport préféré : ${pf.transportPreference}`,
    pf.tripPace && `- Rythme : ${pf.tripPace}`,
    pf.tripStyle && `- Style voyage : ${pf.tripStyle}`,
    pf.interests?.length && `- Intérêts : ${pf.interests.join(', ')}`,
    pf.mustSeeList && `- À visiter absolument : ${pf.mustSeeList}`,
    pf.avoidList && `- À éviter : ${pf.avoidList}`,
    pf.hasChildren && `- Voyage avec enfants`,
    pf.hasAccessibilityNeeds && `- Besoins d'accessibilité (PMR)`,
    pf.maxBudget && `- Budget max : ${pf.maxBudget}€`,
  ].filter(Boolean).join('\n') : '';

  const prompt = `Expert voyage. ${departureCity} → ${destination}, ${startDate} au ${endDate} (${duration} nuits), ${people} pers.
${premiumSection ? '\nFiltres:\n' + premiumSection : ''}

Retourne UNIQUEMENT ce JSON :
{
  ${!hasRealFlights ? `"flights":{"avgPrice":<A/R par pers EUR>,"note":"<info>","options":[{"airline":"<compagnie>","price":<prix>,"type":"direct/escale"}]},` : ''}
  ${!hasRealHotels ? `"accommodation":{"avgPerNight":<par nuit groupe>,"total":<total>,"note":"<info>","options":[{"name":"<hotel>","type":"<type>","pricePerNight":<prix>,"rating":<note>}]},` : ''}
  "food":<total nourriture>,
  "transport":<total transport local EUR pour tout le séjour et le groupe>,
  "localTransport":{
    "recommendation":"<1 phrase : voiture recommandée ou transports en commun suffisants, pourquoi>",
    "carRentals":[
      {"provider":"<Hertz/Avis/Europcar/Sixt/Enterprise>","category":"<Économique/Compacte/Berline/SUV/Premium>","pricePerDay":<EUR/jour réaliste>,"location":"<aéroport ou ville précise>","features":["<boîte auto/manuelle>","<X places>","<climatisation>"]}
    ],
    "publicTransport":[
      {"name":"<ex: Ticket métro/bus unitaire>","type":"single","price":<prix EUR>,"description":"<validité, correspondances>"},
      {"name":"<ex: Pass journée>","type":"day_pass","price":<prix EUR>,"description":"<détail>"},
      {"name":"<ex: Pass 3 jours touristique>","type":"multi_day","price":<prix EUR>,"description":"<détail>"},
      {"name":"<ex: Uber centre ↔ aéroport>","type":"uber","price":<prix EUR moyen>,"description":"<durée approximative>"},
      {"name":"<ex: Taxi course moyenne>","type":"taxi","price":<prix EUR>,"description":"<détail>"},
      {"name":"<ex: Navette aéroport officielle>","type":"airport_transfer","price":<prix EUR>,"description":"<fréquence>"}
    ]
  },
  "activities":{"total":<total>,"perDayPerPerson":<par jour/pers>,"options":[{"name":"<activité réelle>","price":<prix/pers>,"duration":"<durée>"}]},
  "summary":"<2 phrases résumé>"
}

IMPORTANT pour localTransport :
- Fournis 3 catégories de voiture différentes (ex: Économique/SUV/Premium), prix réalistes pour ${destination}
- publicTransport : prix locaux RÉELS pour ${destination} (métro, pass, taxi, Uber). Adapte au pays/ville.
- Si la destination n'a pas de métro, retire l'option et mets bus/tram à la place.`;

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
      source: 'Prix indicatif (IA) — configurez SERPAPI_KEY pour les prix réels',
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
      source: 'Prix indicatif (IA) — configurez SERPAPI_KEY pour les prix réels',
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
        imageUrl: buildActivityImageUrl(a.name, destination),
      })),
    };

    const transportTotal = parsed.transport || 15 * duration * people;
    const carRentals: CarRentalOption[] = (parsed.localTransport?.carRentals || []).map((c: any) => {
      const pricePerDay = Number(c.pricePerDay) || 35;
      return {
        provider: c.provider || 'Europcar',
        category: c.category || 'Économique',
        pricePerDay,
        totalPrice: Math.round(pricePerDay * duration),
        location: c.location || `${destination} — Aéroport`,
        features: Array.isArray(c.features) ? c.features : [],
        bookingUrl: buildCarRentalBookingUrl(c.provider || '', destination, startDate, endDate),
        imageUrl: buildCarRentalImageUrl(c.category || ''),
      };
    });

    const publicTransport: PublicTransportOption[] = (parsed.localTransport?.publicTransport || []).map((p: any) => ({
      name: p.name || 'Ticket unitaire',
      type: p.type || 'single',
      price: Number(p.price) || 0,
      description: p.description || '',
    }));

    const localTransport: LocalTransportEstimate = {
      estimatedBudget: transportTotal,
      recommendation: parsed.localTransport?.recommendation || 'Les transports en commun couvrent la plupart des déplacements ; louez une voiture pour les excursions hors zone urbaine.',
      carRentals: {
        options: carRentals,
        searchUrl: urls.kayakCars,
      },
      publicTransport: {
        options: publicTransport,
      },
    };

    return {
      flights: flightsAi,
      accommodation: accomAi,
      food: parsed.food || 40 * duration * people,
      transport: transportTotal,
      localTransport,
      activities,
      summary: parsed.summary || '',
    };
  } catch (error) {
    console.error('AI estimation failed:', error);
    const fallbackTransport = 15 * duration * people;
    return {
      flights: { avgPrice: 300, source: 'Estimation par défaut', note: '', searchUrl: urls.skyscanner, isRealData: false, options: [{ airline: 'Voir sur Skyscanner', price: 300, type: 'Rechercher', bookingUrl: urls.skyscanner }] },
      accommodation: { avgPerNight: 80, total: 80 * duration, source: 'Estimation par défaut', note: '', searchUrl: urls.booking, isRealData: false, options: [{ name: 'Voir sur Booking', type: 'Hôtel', pricePerNight: 80, rating: 0, bookingUrl: urls.booking }] },
      food: 40 * duration * people,
      transport: fallbackTransport,
      localTransport: {
        estimatedBudget: fallbackTransport,
        recommendation: 'Consultez Kayak ou Booking Cars pour comparer les prix de location et prévoyez un pass de transports en commun.',
        carRentals: { options: [], searchUrl: urls.kayakCars },
        publicTransport: { options: [] },
      },
      activities: { total: 25 * duration * people, perDayPerPerson: 25, searchUrl: urls.getyourguide, options: [] },
      summary: 'Prix indicatifs générés par IA. Configurez SERPAPI_KEY pour obtenir les vrais prix Google Flights + Google Hotels.',
    };
  }
}
