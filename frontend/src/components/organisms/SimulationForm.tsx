'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, PlaneTakeoff, Users, Search, Plane, Lock, Crown, Building2, UtensilsCrossed, Compass, Wallet, ChevronDown, Clock, Car, Baby, Accessibility, Heart, Zap, Leaf } from 'lucide-react';
import Button from '@/components/atoms/Button';
import DateRangePicker from '@/components/molecules/DateRangePicker';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PremiumFilters } from '@/types';
import { useRouter } from 'next/navigation';

interface Airport { code: string; name: string }
interface Destination {
  name: string;
  country: string;
  countryCode: string;
  emoji: string;
  airports: Airport[];
  imageQuery: string;
  matchType: string;
  popular: boolean;
}
interface AirportResult { city: string; country: string; emoji: string; code: string; airportName: string }

interface SimulationFormProps {
  onSubmit: (data: { destination: string; departureCity: string; startDate: string; endDate: string; people: number; premiumFilters?: PremiumFilters }) => Promise<void>;
  isLoading: boolean;
}

function useAutocomplete<T>(searchFn: (q: string) => Promise<T[]>, delay = 200) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < 1) { setResults([]); setShow(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await searchFn(q);
        setResults(r);
        setShow(r.length > 0);
      } catch { setResults([]); }
    }, delay);
  }, [searchFn, delay]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return { query, setQuery, results, show, setShow, ref, search };
}

const INTERESTS = [
  { id: 'culture', label: 'Culture & Musées', icon: '🏛️' },
  { id: 'nature', label: 'Nature & Rando', icon: '🌿' },
  { id: 'beach', label: 'Plage & Farniente', icon: '🏖️' },
  { id: 'gastronomy', label: 'Gastronomie', icon: '🍽️' },
  { id: 'nightlife', label: 'Vie nocturne', icon: '🎉' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'sport', label: 'Sport & Aventure', icon: '🧗' },
  { id: 'wellness', label: 'Bien-être & Spa', icon: '🧖' },
  { id: 'photography', label: 'Photographie', icon: '📸' },
  { id: 'history', label: 'Histoire', icon: '📜' },
];

export default function SimulationForm({ onSubmit, isLoading }: SimulationFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isPremium = user?.isPremium ?? false;

  const [destination, setDestination] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState('2');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [showPremiumFilters, setShowPremiumFilters] = useState(false);

  // Premium filters
  const [accommodationArea, setAccommodationArea] = useState('');
  const [accommodationType, setAccommodationType] = useState<PremiumFilters['accommodationType']>();
  const [roomType, setRoomType] = useState<PremiumFilters['roomType']>();
  const [flightClass, setFlightClass] = useState<PremiumFilters['flightClass']>('economy');
  const [flightTimePreference, setFlightTimePreference] = useState<PremiumFilters['flightTimePreference']>('any');
  const [directFlightOnly, setDirectFlightOnly] = useState(false);
  const [maxLayoverHours, setMaxLayoverHours] = useState('');
  const [foodBudget, setFoodBudget] = useState<PremiumFilters['foodBudget']>('moderate');
  const [dietaryPreferences, setDietaryPreferences] = useState<NonNullable<PremiumFilters['dietaryPreferences']>>([]);
  const [transportPreference, setTransportPreference] = useState<PremiumFilters['transportPreference']>('mixed');
  const [tripPace, setTripPace] = useState<PremiumFilters['tripPace']>('balanced');
  const [tripStyle, setTripStyle] = useState<PremiumFilters['tripStyle']>();
  const [interests, setInterests] = useState<string[]>([]);
  const [mustSeeList, setMustSeeList] = useState('');
  const [avoidList, setAvoidList] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [hasChildren, setHasChildren] = useState(false);
  const [hasAccessibilityNeeds, setHasAccessibilityNeeds] = useState(false);

  const depAc = useAutocomplete<AirportResult>(
    useCallback(async (q: string) => (await api.searchAirports(q)).airports, []),
  );
  const destAc = useAutocomplete<Destination>(
    useCallback(async (q: string) => (await api.searchDestinations(q)).destinations, []),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!destination.trim()) e.destination = 'Destination requise';
    if (!departureCity.trim()) e.departureCity = 'Ville de départ requise';
    if (!startDate) e.startDate = 'Date de départ requise';
    if (!endDate) e.endDate = 'Date de retour requise';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) e.endDate = 'Retour doit être après le départ';
    if (!people || parseInt(people) < 1) e.people = 'Min. 1 personne';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const premiumFilters: PremiumFilters | undefined = isPremium && showPremiumFilters ? {
      ...(accommodationArea ? { accommodationArea } : {}),
      ...(accommodationType ? { accommodationType } : {}),
      ...(roomType ? { roomType } : {}),
      ...(flightClass && flightClass !== 'economy' ? { flightClass } : {}),
      ...(flightTimePreference && flightTimePreference !== 'any' ? { flightTimePreference } : {}),
      ...(directFlightOnly ? { directFlightOnly } : {}),
      ...(maxLayoverHours ? { maxLayoverHours: parseInt(maxLayoverHours) } : {}),
      ...(foodBudget && foodBudget !== 'moderate' ? { foodBudget } : {}),
      ...(dietaryPreferences.length > 0 ? { dietaryPreferences } : {}),
      ...(transportPreference && transportPreference !== 'mixed' ? { transportPreference } : {}),
      ...(tripPace && tripPace !== 'balanced' ? { tripPace } : {}),
      ...(tripStyle ? { tripStyle } : {}),
      ...(interests.length > 0 ? { interests } : {}),
      ...(mustSeeList ? { mustSeeList } : {}),
      ...(avoidList ? { avoidList } : {}),
      ...(maxBudget ? { maxBudget: parseInt(maxBudget) } : {}),
      ...(hasChildren ? { hasChildren } : {}),
      ...(hasAccessibilityNeeds ? { hasAccessibilityNeeds } : {}),
    } : undefined;

    await onSubmit({ destination: destination.trim(), departureCity: departureCity.trim(), startDate, endDate, people: parseInt(people), premiumFilters });
  };

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6">

      {selectedDest && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative rounded-2xl overflow-hidden h-40 bg-gradient-to-r from-primary-600 to-primary-400">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <span className="text-4xl block mb-2">{selectedDest.emoji}</span>
              <span className="text-2xl font-bold font-display">{selectedDest.name}</span>
              <p className="text-white/70 text-sm mt-1">{selectedDest.country}</p>
              {selectedDest.airports.length > 0 && (
                <div className="flex gap-2 mt-2 justify-center flex-wrap">
                  {selectedDest.airports.map(a => (
                    <span key={a.code} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{a.code} — {a.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Départ avec autocomplete aéroports */}
        <div ref={depAc.ref} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <PlaneTakeoff className="inline h-4 w-4 mr-1 text-gray-400" />Ville de départ
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Paris, Lyon, Marseille..."
              value={departureCity}
              onChange={(e) => { setDepartureCity(e.target.value); depAc.search(e.target.value); }}
              onFocus={() => depAc.results.length > 0 && depAc.setShow(true)}
              className={`w-full px-4 py-3 rounded-xl border ${errors.departureCity ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
          </div>
          {errors.departureCity && <p className="text-red-500 text-xs mt-1">{errors.departureCity}</p>}
          <AnimatePresence>
            {depAc.show && depAc.results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                {depAc.results.map((a, i) => (
                  <button key={`${a.code}-${i}`} type="button" onClick={() => { setDepartureCity(`${a.city} (${a.code})`); depAc.setShow(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sand-50 transition-colors text-left text-sm">
                    <Plane className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900">{a.emoji} {a.city}</span>
                      <span className="text-gray-400 ml-1">— {a.airportName}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{a.code}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Destination avec autocomplete */}
        <div ref={destAc.ref} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />Destination
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Tokyo, Bali, Marrakech..."
              value={destination}
              onChange={(e) => { setDestination(e.target.value); setSelectedDest(null); destAc.search(e.target.value); }}
              onFocus={() => destAc.results.length > 0 && destAc.setShow(true)}
              className={`w-full px-4 pr-10 py-3 rounded-xl border ${errors.destination ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          </div>
          {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
          <AnimatePresence>
            {destAc.show && destAc.results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
                {destAc.results.map((d, i) => (
                  <button key={`${d.name}-${i}`} type="button" onClick={() => { setDestination(`${d.name}, ${d.country}`); setSelectedDest(d); destAc.setShow(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sand-50 transition-colors text-left">
                    <span className="text-xl flex-shrink-0">{d.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.country}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {d.airports.slice(0, 2).map(a => (
                        <span key={a.code} className="text-[10px] font-mono font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{a.code}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dates picker + travelers */}
      <div className="grid md:grid-cols-2 gap-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          error={errors.startDate || errors.endDate}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5"><Users className="inline h-4 w-4 mr-1 text-gray-400" />Voyageurs</label>
          <input type="number" min="1" max="20" placeholder="2" value={people} onChange={(e) => setPeople(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.people ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`} />
          {errors.people && <p className="text-red-500 text-xs mt-1">{errors.people}</p>}
        </div>
      </div>

      {/* Premium Filters Section */}
      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => {
            if (!isPremium) { router.push('/pricing'); return; }
            setShowPremiumFilters(!showPremiumFilters);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
            isPremium
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300'
              : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isPremium ? <Crown className="h-5 w-5 text-amber-500" /> : <Lock className="h-5 w-5 text-gray-400" />}
            <span className={`font-semibold text-sm ${isPremium ? 'text-amber-800' : 'text-gray-500'}`}>
              Filtres Premium
            </span>
            {!isPremium && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">PRO</span>}
          </div>
          {isPremium ? (
            <ChevronDown className={`h-4 w-4 text-amber-500 transition-transform ${showPremiumFilters ? 'rotate-180' : ''}`} />
          ) : (
            <span className="text-xs text-gray-400">Passer Premium →</span>
          )}
        </button>

        <AnimatePresence>
          {isPremium && showPremiumFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-5">
                {/* Quartier hébergement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Building2 className="inline h-4 w-4 mr-1 text-amber-500" />Quartier / Zone d&apos;hébergement
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Shibuya, Le Marais, Trastevere..."
                    value={accommodationArea}
                    onChange={(e) => setAccommodationArea(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30"
                  />
                  <p className="text-xs text-gray-400 mt-1">L&apos;IA cherchera des logements dans ce quartier spécifiquement</p>
                </div>

                {/* Type hébergement + Chambre */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Building2 className="inline h-4 w-4 mr-1 text-amber-500" />Type d&apos;hébergement
                    </label>
                    <select
                      value={accommodationType || ''}
                      onChange={(e) => setAccommodationType(e.target.value as PremiumFilters['accommodationType'] || undefined)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="">Tous types</option>
                      <option value="hostel">Auberge de jeunesse</option>
                      <option value="apartment">Appartement</option>
                      <option value="villa">Villa / Maison</option>
                      <option value="bnb">Chambre d&apos;hôtes / B&amp;B</option>
                      <option value="hotel">Hôtel classique (3-4*)</option>
                      <option value="luxury">Hôtel de luxe (5*)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Building2 className="inline h-4 w-4 mr-1 text-amber-500" />Type de chambre
                    </label>
                    <select
                      value={roomType || ''}
                      onChange={(e) => setRoomType(e.target.value as PremiumFilters['roomType'] || undefined)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="">Peu importe</option>
                      <option value="single">Simple (1 pers)</option>
                      <option value="double">Double (lit double)</option>
                      <option value="twin">Twin (2 lits simples)</option>
                      <option value="family">Familiale</option>
                      <option value="suite">Suite</option>
                    </select>
                  </div>
                </div>

                {/* Classe de vol + Heure de vol */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Plane className="inline h-4 w-4 mr-1 text-amber-500" />Classe de vol
                    </label>
                    <select
                      value={flightClass || 'economy'}
                      onChange={(e) => setFlightClass(e.target.value as PremiumFilters['flightClass'])}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="economy">Économique</option>
                      <option value="premium_economy">Premium Economy</option>
                      <option value="business">Classe Affaires</option>
                      <option value="first">Première Classe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Clock className="inline h-4 w-4 mr-1 text-amber-500" />Heure de départ préférée
                    </label>
                    <select
                      value={flightTimePreference || 'any'}
                      onChange={(e) => setFlightTimePreference(e.target.value as PremiumFilters['flightTimePreference'])}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="any">Peu importe</option>
                      <option value="morning">Matin (6h — 12h)</option>
                      <option value="afternoon">Après-midi (12h — 18h)</option>
                      <option value="evening">Soir (18h — 23h)</option>
                      <option value="night">Vol de nuit (23h — 6h)</option>
                    </select>
                  </div>
                </div>

                {/* Vols directs + Escale max */}
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={directFlightOnly}
                      onChange={(e) => setDirectFlightOnly(e.target.checked)}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Vols directs uniquement</p>
                      <p className="text-[11px] text-gray-500">Ignorer les vols avec escale</p>
                    </div>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Clock className="inline h-4 w-4 mr-1 text-amber-500" />Escale max (heures)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 4"
                      min="0"
                      max="24"
                      value={maxLayoverHours}
                      onChange={(e) => setMaxLayoverHours(e.target.value)}
                      disabled={directFlightOnly}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Budget repas + Budget max */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <UtensilsCrossed className="inline h-4 w-4 mr-1 text-amber-500" />Style de restauration
                    </label>
                    <select
                      value={foodBudget || 'moderate'}
                      onChange={(e) => setFoodBudget(e.target.value as PremiumFilters['foodBudget'])}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="budget">Street food / Budget</option>
                      <option value="moderate">Mixte restaurant / local</option>
                      <option value="premium">Bons restaurants</option>
                      <option value="luxury">Gastronomique / Étoilé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Wallet className="inline h-4 w-4 mr-1 text-amber-500" />Budget maximum (€)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 3000"
                      min="0"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30"
                    />
                  </div>
                </div>

                {/* Transport préféré + Rythme */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Car className="inline h-4 w-4 mr-1 text-amber-500" />Transport préféré
                    </label>
                    <select
                      value={transportPreference || 'mixed'}
                      onChange={(e) => setTransportPreference(e.target.value as PremiumFilters['transportPreference'])}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="mixed">Mixte</option>
                      <option value="car">Voiture de location</option>
                      <option value="public">Transports en commun</option>
                      <option value="walk_bike">Marche / Vélo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Zap className="inline h-4 w-4 mr-1 text-amber-500" />Rythme du voyage
                    </label>
                    <select
                      value={tripPace || 'balanced'}
                      onChange={(e) => setTripPace(e.target.value as PremiumFilters['tripPace'])}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30 appearance-none"
                    >
                      <option value="relaxed">Détente (peu d&apos;activités)</option>
                      <option value="balanced">Équilibré</option>
                      <option value="packed">Intense (journées chargées)</option>
                    </select>
                  </div>
                </div>

                {/* Style de voyage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Heart className="inline h-4 w-4 mr-1 text-amber-500" />Style de voyage
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'cultural', label: 'Culturel', icon: '🏛️' },
                      { id: 'adventure', label: 'Aventure', icon: '🧗' },
                      { id: 'romantic', label: 'Romantique', icon: '💕' },
                      { id: 'family', label: 'Famille', icon: '👨‍👩‍👧' },
                      { id: 'nightlife', label: 'Festif', icon: '🎉' },
                      { id: 'wellness', label: 'Bien-être', icon: '🧘' },
                      { id: 'gastronomic', label: 'Gastronomique', icon: '🍷' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTripStyle(tripStyle === s.id ? undefined : s.id as PremiumFilters['tripStyle'])}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          tripStyle === s.id
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Régimes alimentaires */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Leaf className="inline h-4 w-4 mr-1 text-amber-500" />Régime alimentaire
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'vegetarian', label: 'Végétarien' },
                      { id: 'vegan', label: 'Végan' },
                      { id: 'gluten_free', label: 'Sans gluten' },
                      { id: 'halal', label: 'Halal' },
                      { id: 'kosher', label: 'Casher' },
                    ].map((d) => {
                      const active = dietaryPreferences.includes(d.id as any);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDietaryPreferences(prev => active ? prev.filter(x => x !== d.id) : [...prev, d.id as any])}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            active
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Must-see + À éviter */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Heart className="inline h-4 w-4 mr-1 text-amber-500" />À visiter absolument
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tour Eiffel, Louvre, Versailles"
                      value={mustSeeList}
                      onChange={(e) => setMustSeeList(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Compass className="inline h-4 w-4 mr-1 text-amber-500" />À éviter
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: quartiers touristiques, fast-food"
                      value={avoidList}
                      onChange={(e) => setAvoidList(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all bg-amber-50/30"
                    />
                  </div>
                </div>

                {/* Enfants + PMR */}
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={hasChildren}
                      onChange={(e) => setHasChildren(e.target.checked)}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <Baby className="h-4 w-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Voyage avec enfants</p>
                      <p className="text-[11px] text-gray-500">Activités & hébergements adaptés</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/30 cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={hasAccessibilityNeeds}
                      onChange={(e) => setHasAccessibilityNeeds(e.target.checked)}
                      className="h-4 w-4 rounded accent-amber-500"
                    />
                    <Accessibility className="h-4 w-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Accessibilité PMR</p>
                      <p className="text-[11px] text-gray-500">Priorise les lieux accessibles</p>
                    </div>
                  </label>
                </div>

                {/* Centres d'intérêt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Compass className="inline h-4 w-4 mr-1 text-amber-500" />Centres d&apos;intérêt
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => toggleInterest(i.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          interests.includes(i.id)
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {i.icon} {i.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">L&apos;IA proposera des activités en rapport avec vos centres d&apos;intérêt</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        {isLoading ? 'Analyse des prix en cours...' : 'Estimer mon budget'}
      </Button>
      {isLoading && <p className="text-center text-sm text-gray-400 animate-pulse">L&apos;IA recherche les meilleurs prix sur Skyscanner, Booking, Airbnb...</p>}
    </motion.form>
  );
}
