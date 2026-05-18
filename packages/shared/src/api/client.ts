import {
  AuthResponse, SimulationResponse, TripResponse, Simulation, PriceCheckResponse,
  CompareResponse, CollaboratorsResponse, Comment, InviteInfo, PriceAlertConfig, PricePoint,
  FlexibleDatesScanResponse, PremiumFilters, TripGroup, TripProposal,
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
    stops?: { name: string; nights?: number }[];
    hostStay?: boolean;
    searchRadiusKm?: number;
  }): Promise<SimulationResponse> {
    return this.request<SimulationResponse>('/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateHostStay(simulationId: string, hostStay: boolean): Promise<{ simulation: Simulation }> {
    return this.request(`/simulation/${simulationId}/host-stay`, {
      method: 'PATCH',
      body: JSON.stringify({ hostStay }),
    });
  }

  /** Refresh hotel/activity list, keeping pinned items (by name). */
  regenerateOptions(simulationId: string, category: 'hotels' | 'activities', keepNames: string[]): Promise<{ simulation: Simulation }> {
    return this.request(`/simulation/${simulationId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ category, keepNames }),
    });
  }

  // Trip groups
  createGroup(data: { name: string; emoji?: string }): Promise<{ group: TripGroup }> {
    return this.request('/groups', { method: 'POST', body: JSON.stringify(data) });
  }
  listGroups(): Promise<{ groups: (TripGroup & { memberCount: number; myRole: string })[] }> {
    return this.request('/groups');
  }
  getGroup(id: string): Promise<{ group: TripGroup & { myRole: string } }> {
    return this.request(`/groups/${id}`);
  }
  createGroupInvite(id: string): Promise<{ token: string; expiresAt: string }> {
    return this.request(`/groups/${id}/invite`, { method: 'POST' });
  }
  getGroupInviteInfo(token: string): Promise<{ group: TripGroup; expiresAt: string }> {
    return this.request(`/group-invite/${token}`);
  }
  acceptGroupInvite(token: string): Promise<{ groupId: string }> {
    return this.request(`/group-invite/${token}/accept`, { method: 'POST' });
  }
  leaveGroup(id: string): Promise<{ success: boolean }> {
    return this.request(`/groups/${id}`, { method: 'DELETE' });
  }
  updateGroup(id: string, data: { name?: string; emoji?: string; notes?: string }): Promise<{ group: TripGroup }> {
    return this.request(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  }
  kickGroupMember(id: string, userId: string): Promise<{ success: boolean }> {
    return this.request(`/groups/${id}/members/${userId}`, { method: 'DELETE' });
  }
  proposeGroupSimulation(id: string, simulationId: string): Promise<{ proposal: any }> {
    return this.request(`/groups/${id}/proposals`, {
      method: 'POST',
      body: JSON.stringify({ simulationId }),
    });
  }
  removeGroupSimulation(id: string, proposalId: string): Promise<{ success: boolean }> {
    return this.request(`/groups/${id}/proposals/${proposalId}`, { method: 'DELETE' });
  }
  voteOnGroupSimulation(id: string, proposalId: string, vote: 'up' | 'down', comment?: string): Promise<{ vote: any }> {
    return this.request(`/groups/${id}/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote, comment }),
    });
  }
  removeVoteOnGroupSimulation(id: string, proposalId: string): Promise<{ success: boolean }> {
    return this.request(`/groups/${id}/proposals/${proposalId}/vote`, { method: 'DELETE' });
  }
  voteOnGroupItem(
    id: string,
    proposalId: string,
    itemType: 'hotel' | 'activity' | 'dates' | 'flight',
    itemKey: string,
    vote: 'up' | 'down',
    comment?: string,
  ): Promise<{ vote: any }> {
    return this.request(`/groups/${id}/proposals/${proposalId}/items/vote`, {
      method: 'POST',
      body: JSON.stringify({ itemType, itemKey, vote, comment }),
    });
  }
  removeVoteOnGroupItem(
    id: string,
    proposalId: string,
    itemType: 'hotel' | 'activity' | 'dates' | 'flight',
    itemKey: string,
  ): Promise<{ success: boolean }> {
    return this.request(`/groups/${id}/proposals/${proposalId}/items/vote`, {
      method: 'DELETE',
      body: JSON.stringify({ itemType, itemKey }),
    });
  }

  // Trip proposals (budget-first discovery)
  proposeTrips(data: {
    budgetTotal?: number;
    budgetPerPerson?: number;
    people: number;
    destination?: string;
    departureCity?: string;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
  }): Promise<{
    proposals: TripProposal[];
    feasibility?: 'ok' | 'tight' | 'impossible';
    advice?: string;
    alternatives?: TripProposal[];
  }> {
    return this.request('/propose-trips', { method: 'POST', body: JSON.stringify(data) });
  }

  getNearestAirport(lat: number, lng: number): Promise<{
    nearest: null | {
      airport: { code: string; name: string };
      cityName: string;
      country: string;
      distanceKm: number;
      transport: {
        options: { mode: string; icon: string; minPrice: number; maxPrice: number; minMinutes: number; maxMinutes: number; note: string }[];
      };
    };
  }> {
    return this.request(`/airports/nearest?lat=${lat}&lng=${lng}`);
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
