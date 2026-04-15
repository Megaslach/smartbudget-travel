export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  createdAt?: string;
}

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

export interface FlightEstimate {
  avgPrice: number;
  source: string;
  note: string;
  options: FlightOption[];
  searchUrl: string;
  isRealData?: boolean;
}

export interface AccommodationEstimate {
  avgPerNight: number;
  total: number;
  source: string;
  note: string;
  options: HotelOption[];
  searchUrl: string;
  isRealData?: boolean;
}

export interface ActivitiesEstimate {
  total: number;
  perDayPerPerson: number;
  options: ActivityOption[];
  searchUrl: string;
}

export interface PremiumFilters {
  accommodationArea?: string;
  accommodationType?: 'hotel' | 'airbnb' | 'hostel' | 'luxury';
  flightClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  foodBudget?: 'budget' | 'moderate' | 'premium' | 'luxury';
  interests?: string[];
  maxBudget?: number;
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

export interface SmartTip {
  type: 'saving' | 'timing' | 'alternative' | 'insider' | 'warning';
  icon: string;
  title: string;
  description: string;
  potentialSaving?: number;
  isPremium: boolean;
}

export interface FlexibleDate {
  startDate: string;
  endDate: string;
  estimatedSaving: number;
  label: string;
}

export interface FlexibleDateScanResult {
  offsetDays: number;
  startDate: string;
  endDate: string;
  label: string;
  pricePerPerson: number;
  pricePerGroup: number;
  savingPerPerson: number;
  savingPerGroup: number;
  savingPercent: number;
  source: 'serpapi' | 'amadeus' | 'kiwi';
}

export interface FlexibleDatesScanResponse {
  basePricePerPerson: number;
  basePriceGroup: number;
  people: number;
  originalStart: string;
  originalEnd: string;
  results: FlexibleDateScanResult[];
  scannedAt: string;
}

export interface AiTipsResult {
  tips: SmartTip[];
  flexibleDates?: FlexibleDate[];
  bestBookingWindow: string;
  priceOutlook: 'rising' | 'stable' | 'falling';
  priceOutlookNote: string;
}

export interface PriceComparison {
  totalDiff: number;
  totalDiffPercent: number;
  flightDiffPerPerson: number;
  hotelDiffPerNight: number;
  trend: 'up' | 'down' | 'stable';
  advice: string;
}

export interface Simulation {
  id: string;
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  budget: number | BudgetEstimate;
  budgetData?: BudgetEstimate;
  aiTips?: AiTipsResult;
  itinerary?: Itinerary | null;
  createdAt: string;
  role?: 'owner' | 'editor';
  sharedBy?: string | null;
  priceAlertEnabled?: boolean;
  priceAlertThreshold?: number;
  lastPriceTotal?: number | null;
  lastPriceCheckAt?: string | null;
}

export interface CompareResult {
  destination: string;
  budget: BudgetEstimate | null;
  error: string | null;
}

export interface CompareResponse {
  results: CompareResult[];
  duration: number;
  people: number;
  departureCity: string;
  startDate: string;
  endDate: string;
}

export interface Collaborator {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface CollaboratorsResponse {
  owner: { id: string; email: string; name: string };
  collaborators: Collaborator[];
}

export interface Comment {
  id: string;
  text: string;
  dayIndex: number | null;
  activityIndex: number | null;
  createdAt: string;
  author: { id: string; name: string; email: string };
}

export interface InviteInfo {
  simulation: { id: string; destination: string; startDate: string; endDate: string; people: number };
  invitedBy: string;
  expiresAt: string;
}

export interface PriceAlertConfig {
  priceAlertEnabled: boolean;
  priceAlertThreshold: number;
  lastPriceTotal: number | null;
  lastPriceCheckAt: string | null;
}

export interface PricePoint {
  total: number;
  flightPrice?: number;
  hotelPrice?: number;
  checkedAt: string;
  initial?: boolean;
}

export type ItineraryTimeSlot = 'morning' | 'afternoon' | 'evening';
export type ItineraryCategory = 'sight' | 'food' | 'activity' | 'transport' | 'nature' | 'shopping' | 'nightlife';

export interface ItineraryActivity {
  time: ItineraryTimeSlot;
  title: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  duration: string;
  estimatedCost?: number;
  category?: ItineraryCategory;
  bookingUrl?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  summary: string;
  activities: ItineraryActivity[];
}

export interface Itinerary {
  destination: string;
  days: ItineraryDay[];
  generatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SimulationResponse {
  simulation: {
    id: string;
    destination: string;
    departureCity: string;
    startDate: string;
    endDate: string;
    duration: number;
    people: number;
    budget: BudgetEstimate;
    aiTips?: AiTipsResult;
    createdAt: string;
  };
}

export interface PriceCheckResponse {
  original: BudgetEstimate;
  current: BudgetEstimate;
  comparison: PriceComparison;
}

export interface TripResponse {
  itinerary: Itinerary;
  simulation: {
    id: string;
    destination: string;
    duration: number;
    people: number;
    budget: number;
  };
}

export interface ApiError {
  error: string;
  upgrade?: boolean;
}
