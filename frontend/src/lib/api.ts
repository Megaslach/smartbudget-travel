import { AuthResponse, SimulationResponse, TripResponse, Simulation, PriceCheckResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data as T;
  }

  // Auth
  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe(): Promise<{ user: AuthResponse['user'] }> {
    return this.request('/auth/me');
  }

  async updateProfile(data: { email?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: AuthResponse['user'] }> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request('/auth/account', {
      method: 'DELETE',
    });
  }

  // Destinations & Airports
  async searchDestinations(query: string): Promise<{ destinations: { name: string; country: string; countryCode: string; emoji: string; airports: { code: string; name: string }[]; image: string; imageQuery: string; matchType: string; popular: boolean }[] }> {
    return this.request(`/destinations/search?q=${encodeURIComponent(query)}`);
  }

  async searchAirports(query: string): Promise<{ airports: { city: string; country: string; emoji: string; code: string; airportName: string }[] }> {
    return this.request(`/airports/search?q=${encodeURIComponent(query)}`);
  }

  // Simulations
  async simulate(data: { destination: string; departureCity: string; startDate: string; endDate: string; people: number; premiumFilters?: import('@/types').PremiumFilters }): Promise<SimulationResponse> {
    return this.request<SimulationResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserSimulations(): Promise<{ simulations: Simulation[] }> {
    return this.request('/user/simulations');
  }

  // Trip generation (premium)
  async generateTrip(simulationId: string): Promise<TripResponse> {
    return this.request<TripResponse>('/generate-trip', {
      method: 'POST',
      body: JSON.stringify({ simulationId }),
    });
  }

  async getSimulationDetail(id: string): Promise<{ simulation: Simulation }> {
    return this.request(`/simulation/${id}`);
  }

  async priceCheck(id: string): Promise<PriceCheckResponse> {
    return this.request(`/simulation/${id}/price-check`);
  }

  async getSharedSimulation(id: string): Promise<{ simulation: Simulation & { sharedBy: string } }> {
    return this.request(`/shared/${id}`);
  }

  // Stripe
  async createCheckoutSession(): Promise<{ url: string }> {
    return this.request('/create-checkout-session', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
