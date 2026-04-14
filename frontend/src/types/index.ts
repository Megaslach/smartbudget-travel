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
}

export interface HotelOption {
  name: string;
  type: string;
  pricePerNight: number;
  rating: number;
  bookingUrl: string;
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
}

export interface AccommodationEstimate {
  avgPerNight: number;
  total: number;
  source: string;
  note: string;
  options: HotelOption[];
  searchUrl: string;
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

export interface Simulation {
  id: string;
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  budget: number | BudgetEstimate;
  itinerary?: string;
  createdAt: string;
}

export interface ItineraryActivity {
  time: string;
  activity: string;
  location: string;
  estimatedCost: number;
  description: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
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
    createdAt: string;
  };
}

export interface TripResponse {
  itinerary: ItineraryDay[];
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
