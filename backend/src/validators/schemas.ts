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
});

export const generateTripSchema = z.object({
  simulationId: z.string().uuid('ID de simulation invalide'),
});
