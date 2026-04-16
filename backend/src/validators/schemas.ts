import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const simulationSchema = z.object({
  destination: z.string().min(2, 'Destination requise'),
  departureCity: z.string().min(2, 'Ville de départ requise'),
  startDate: z.string().min(1, 'Date de départ requise'),
  endDate: z.string().min(1, 'Date de retour requise'),
  people: z.number().int().min(1, 'Minimum 1 personne').max(20, 'Maximum 20 personnes'),
  // Premium filters (optional)
  premiumFilters: z.object({
    accommodationArea: z.string().optional(),
    accommodationType: z.enum(['hotel', 'apartment', 'villa', 'hostel', 'luxury', 'bnb']).optional(),
    roomType: z.enum(['single', 'double', 'twin', 'family', 'suite']).optional(),
    flightClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
    flightTimePreference: z.enum(['morning', 'afternoon', 'evening', 'night', 'any']).optional(),
    directFlightOnly: z.boolean().optional(),
    maxLayoverHours: z.number().optional(),
    foodBudget: z.enum(['budget', 'moderate', 'premium', 'luxury']).optional(),
    dietaryPreferences: z.array(z.enum(['vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher'])).optional(),
    transportPreference: z.enum(['car', 'public', 'mixed', 'walk_bike']).optional(),
    tripPace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
    tripStyle: z.enum(['cultural', 'adventure', 'romantic', 'family', 'nightlife', 'wellness', 'gastronomic']).optional(),
    interests: z.array(z.string()).optional(),
    mustSeeList: z.string().optional(),
    avoidList: z.string().optional(),
    maxBudget: z.number().optional(),
    hasChildren: z.boolean().optional(),
    hasAccessibilityNeeds: z.boolean().optional(),
  }).optional(),
});

export const generateTripSchema = z.object({
  simulationId: z.string().uuid('ID de simulation invalide'),
  activitiesPerDay: z.number().int().min(1).max(6).optional(),
  tripPace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
  tripStyle: z.enum(['cultural', 'adventure', 'romantic', 'family', 'nightlife', 'wellness', 'gastronomic']).optional(),
  interests: z.array(z.string()).optional(),
  hasChildren: z.boolean().optional(),
  hasAccessibilityNeeds: z.boolean().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  transportPreference: z.enum(['car', 'public', 'mixed', 'walk_bike']).optional(),
  budgetLevel: z.enum(['budget', 'moderate', 'premium', 'luxury']).optional(),
  avoidList: z.string().optional(),
  mustSeeList: z.string().optional(),
});

export const compareSchema = z.object({
  destinations: z.array(z.string().min(2)).min(2, 'Au moins 2 destinations').max(4, 'Maximum 4 destinations'),
  departureCity: z.string().min(2, 'Ville de départ requise'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  people: z.number().int().min(1).max(20),
});

export const priceAlertSchema = z.object({
  enabled: z.boolean(),
  threshold: z.number().min(1).max(50).optional(),
});

export const inviteAcceptSchema = z.object({
  token: z.string().min(10),
});

export const commentSchema = z.object({
  text: z.string().min(1).max(2000),
  dayIndex: z.number().int().min(0).optional(),
  activityIndex: z.number().int().min(0).optional(),
});
