import {
  AuthResponse, SimulationResponse, TripResponse, Simulation, PriceCheckResponse,
  CompareResponse, CollaboratorsResponse, Comment, InviteInfo, PriceAlertConfig, PricePoint,
  FlexibleDatesScanResponse, PremiumFilters,
} from '../types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
}

export class ApiClient {
  private baseUrl: string;
  private getTokenFn?: () => string | null | Promise<string | null>;
  private token: string | null = null;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getTokenFn = config.getToken;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async resolveToken(): Promise<string | null> {
    if (this.token) return this.token;
    if (this.getTokenFn) return await this.getTokenFn();
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = await this.resolveToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw { status: response.status, ...data };
    }

    return data as T;
  }

  // Auth
  register(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe(): Promise<{ user: AuthResponse['user'] }> {
    return this.request('/auth/me');
  }

  updateProfile(data: { email?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: AuthResponse['user'] }> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAccount(): Promise<{ message: string }> {
    return this.request('/auth/account', { method: 'DELETE' });
  }

  // Destinations & Airports
  searchDestinations(query: string) {
    return this.request<{ destinations: { name: string; country: string; countryCode: string; emoji: string; airports: { code: string; name: string }[]; image: string; imageQuery: string; matchType: string; popular: boolean }[] }>(
      `/destinations/search?q=${encodeURIComponent(query)}`
    );
  }

  searchAirports(query: string) {
    return this.request<{ airports: { city: string; country: string; emoji: string; code: string; airportName: string }[] }>(
      `/airports/search?q=${encodeURIComponent(query)}`
    );
  }

  // Simulations
  simulate(data: {
    destination: string; departureCity: string; startDate: string; endDate: string;
    people: number; premiumFilters?: PremiumFilters;
  }): Promise<SimulationResponse> {
    return this.request<SimulationResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getUserSimulations(): Promise<{ simulations: Simulation[] }> {
    return this.request('/user/simulations');
  }

  // Trip generation (premium)
  generateTrip(simulationId: string, options?: {
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

  getSimulationDetail(id: string): Promise<{ simulation: Simulation }> {
    return this.request(`/simulation/${id}`);
  }

  priceCheck(id: string): Promise<PriceCheckResponse> {
    return this.request(`/simulation/${id}/price-check`);
  }

  deleteSimulation(id: string): Promise<{ success: boolean }> {
    return this.request(`/simulation/${id}`, { method: 'DELETE' });
  }

  getSharedSimulation(id: string): Promise<{ simulation: Simulation & { sharedBy: string } }> {
    return this.request(`/shared/${id}`);
  }

  // Stripe
  createCheckoutSession(plan: 'oneshot' | 'annual' = 'oneshot'): Promise<{ url: string }> {
    return this.request('/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  createPortalSession(): Promise<{ url: string }> {
    return this.request('/create-portal-session', {
      method: 'POST',
    });
  }

  // Comparator
  compareDestinations(data: {
    destinations: string[]; departureCity: string;
    startDate: string; endDate: string; people: number;
  }): Promise<CompareResponse> {
    return this.request<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Collaboration
  createInvite(simulationId: string): Promise<{ token: string; expiresAt: string }> {
    return this.request(`/simulation/${simulationId}/invite`, { method: 'POST' });
  }

  getInviteInfo(token: string): Promise<InviteInfo> {
    return this.request(`/invite/${token}`);
  }

  acceptInvite(token: string): Promise<{ simulationId: string }> {
    return this.request(`/invite/${token}/accept`, { method: 'POST' });
  }

  listCollaborators(simulationId: string): Promise<CollaboratorsResponse> {
    return this.request(`/simulation/${simulationId}/collaborators`);
  }

  removeCollaborator(simulationId: string, userId: string): Promise<{ success: boolean }> {
    return this.request(`/simulation/${simulationId}/collaborators/${userId}`, { method: 'DELETE' });
  }

  listComments(simulationId: string): Promise<{ comments: Comment[] }> {
    return this.request(`/simulation/${simulationId}/comments`);
  }

  createComment(simulationId: string, data: { text: string; dayIndex?: number; activityIndex?: number }): Promise<{ comment: Comment }> {
    return this.request(`/simulation/${simulationId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteComment(commentId: string): Promise<{ success: boolean }> {
    return this.request(`/comment/${commentId}`, { method: 'DELETE' });
  }

  // Price alerts
  updatePriceAlert(simulationId: string, data: { enabled: boolean; threshold?: number }): Promise<{ alert: PriceAlertConfig }> {
    return this.request(`/simulation/${simulationId}/alert`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  getPriceHistory(simulationId: string): Promise<{ history: PricePoint[] }> {
    return this.request(`/simulation/${simulationId}/price-history`);
  }

  scanFlexibleDates(simulationId: string): Promise<FlexibleDatesScanResponse> {
    return this.request(`/simulation/${simulationId}/flexible-dates`);
  }
}
