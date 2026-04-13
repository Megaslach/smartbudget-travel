export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  createdAt?: string;
}

export interface BudgetEstimate {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  total: number;
  currency: string;
}

export interface Simulation {
  id: string;
  destination: string;
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
