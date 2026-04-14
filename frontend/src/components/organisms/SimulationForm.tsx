'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, PlaneTakeoff, Calendar, Users, Search, Plane, Lock, Crown, Building2, UtensilsCrossed, Compass, Wallet, ChevronDown } from 'lucide-react';
import Button from '@/components/atoms/Button';
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
  const [flightClass, setFlightClass] = useState<PremiumFilters['flightClass']>('economy');
  const [foodBudget, setFoodBudget] = useState<PremiumFilters['foodBudget']>('moderate');
  const [interests, setInterests] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState('');

  const depAc = useAutocomplete<AirportResult>(
    useCallback(async (q: string) => (await api.searchAirports(q)).airports, []),
  );
  const destAc = useAutocomplete<Destination>(
    useCallback(async (q: string) => (await api.searchDestinations(q)).destinations, []),
  );

  const today = new Date().toISOString().split('T')[0];

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
      ...(flightClass && flightClass !== 'economy' ? { flightClass } : {}),
      ...(foodBudget && foodBudget !== 'moderate' ? { foodBudget } : {}),
      ...(interests.length > 0 ? { interests } : {}),
      ...(maxBudget ? { maxBudget: parseInt(maxBudget) } : {}),
    } : undefined;

    await onSubmit({ destination: destination.trim(), departureCity: departureCity.trim(), startDate, endDate, people: parseInt(people), premiumFilters });
  };

  const duration = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

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

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5"><Calendar className="inline h-4 w-4 mr-1 text-gray-400" />Départ</label>
          <input type="date" min={today} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate && new Date(e.target.value) >= new Date(endDate)) setEndDate(''); }}
            className={`w-full px-4 py-3 rounded-xl border ${errors.startDate ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`} />
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5"><Calendar className="inline h-4 w-4 mr-1 text-gray-400" />Retour</label>
          <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.endDate ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`} />
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>

      {/* Voyageurs + durée */}
      <div className="grid md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5"><Users className="inline h-4 w-4 mr-1 text-gray-400" />Voyageurs</label>
          <input type="number" min="1" max="20" placeholder="2" value={people} onChange={(e) => setPeople(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${errors.people ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`} />
          {errors.people && <p className="text-red-500 text-xs mt-1">{errors.people}</p>}
        </div>
        {duration > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 text-primary-800">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{duration} nuit{duration > 1 ? 's' : ''}</span>
          </motion.div>
        )}
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

                {/* Type hébergement + Classe de vol */}
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
                      <option value="airbnb">Airbnb / Appartement</option>
                      <option value="hotel">Hôtel classique (3-4*)</option>
                      <option value="luxury">Hôtel de luxe (5*)</option>
                    </select>
                  </div>
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
