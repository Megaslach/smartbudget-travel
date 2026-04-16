import {
  AuthResponse, SimulationResponse, TripResponse, Simulation, PriceCheckResponse,
  CompareResponse, CollaboratorsResponse, Comment, InviteInfo, PriceAlertConfig, PricePoint,
  FlexibleDatesScanResponse,
} from '@/types';

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
  async generateTrip(simulationId: string, options?: {
    activitiesPerDay?: number;
    tripPace?: 'relaxed' | 'balanced' | 'packed';
    tripStyle?: 'cultural' | 'adventure' | 'romantic' | 'family' | 'nightlife' | 'wellness' | 'gastronomic';
    interests?: string[];
    hasChildren?: boolean;
    hasAccessibilityNeeds?: boolean;
    dietaryPreferences?: string[];
    transportPreference?: 'car' | 'public' | 'mixed' | 'walk_bike';
    budgetLevel?: 'budget' | 'moderate' | 'premium' | 'luxury';
    avoidList?: string;
    mustSeeList?: string;
  }): Promise<TripResponse> {
    return this.request<TripResponse>('/generate-trip', {
      method: 'POST',
      body: JSON.stringify({ simulationId, ...options }),
    });
  }

  async getSimulationDetail(id: string): Promise<{ simulation: Simulation }> {
    return this.request(`/simulation/${id}`);
  }

  async priceCheck(id: string): Promise<PriceCheckResponse> {
    return this.request(`/simulation/${id}/price-check`);
  }

  async deleteSimulation(id: string): Promise<{ success: boolean }> {
    return this.request(`/simulation/${id}`, { method: 'DELETE' });
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

  // Feature 8: Comparator
  async compareDestinations(data: {
    destinations: string[];
    departureCity: string;
    startDate: string;
    endDate: string;
    people: number;
  }): Promise<CompareResponse> {
    return this.request<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feature 6: Collaboration
  async createInvite(simulationId: string): Promise<{ token: string; expiresAt: string }> {
    return this.request(`/simulation/${simulationId}/invite`, { method: 'POST' });
  }

  async getInviteInfo(token: string): Promise<InviteInfo> {
    return this.request(`/invite/${token}`);
  }

  async acceptInvite(token: string): Promise<{ simulationId: string }> {
    return this.request(`/invite/${token}/accept`, { method: 'POST' });
  }

  async listCollaborators(simulationId: string): Promise<CollaboratorsResponse> {
    return this.request(`/simulation/${simulationId}/collaborators`);
  }

  async removeCollaborator(simulationId: string, userId: string): Promise<{ success: boolean }> {
    return this.request(`/simulation/${simulationId}/collaborators/${userId}`, { method: 'DELETE' });
  }

  async listComments(simulationId: string): Promise<{ comments: Comment[] }> {
    return this.request(`/simulation/${simulationId}/comments`);
  }

  async createComment(simulationId: string, data: { text: string; dayIndex?: number; activityIndex?: number }): Promise<{ comment: Comment }> {
    return this.request(`/simulation/${simulationId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    return this.request(`/comment/${commentId}`, { method: 'DELETE' });
  }

  // Feature 1: Price alerts
  async updatePriceAlert(simulationId: string, data: { enabled: boolean; threshold?: number }): Promise<{ alert: PriceAlertConfig }> {
    return this.request(`/simulation/${simulationId}/alert`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPriceHistory(simulationId: string): Promise<{ history: PricePoint[] }> {
    return this.request(`/simulation/${simulationId}/price-history`);
  }

  async scanFlexibleDates(simulationId: string): Promise<FlexibleDatesScanResponse> {
    return this.request(`/simulation/${simulationId}/flexible-dates`);
  }
}

export const api = new ApiClient();
