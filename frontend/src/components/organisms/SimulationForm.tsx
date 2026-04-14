'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, PlaneTakeoff, Calendar, Users, Search, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { api } from '@/lib/api';

interface Destination {
  name: string;
  country: string;
  emoji: string;
  image: string;
}

interface SimulationFormProps {
  onSubmit: (data: { destination: string; departureCity: string; startDate: string; endDate: string; people: number }) => Promise<void>;
  isLoading: boolean;
}

export default function SimulationForm({ onSubmit, isLoading }: SimulationFormProps) {
  const [destination, setDestination] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState('2');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchDestinations = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingDest(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchDestinations(query);
        setSuggestions(res.destinations);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchingDest(false);
      }
    }, 400);
  };

  const selectDestination = (dest: Destination) => {
    setDestination(`${dest.name}, ${dest.country}`);
    setSelectedDest(dest);
    setShowSuggestions(false);
  };

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!destination.trim()) newErrors.destination = 'Destination requise';
    if (!departureCity.trim()) newErrors.departureCity = 'Ville de départ requise';
    if (!startDate) newErrors.startDate = 'Date de départ requise';
    if (!endDate) newErrors.endDate = 'Date de retour requise';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'La date de retour doit être après le départ';
    }
    if (!people || parseInt(people) < 1) newErrors.people = 'Minimum 1 personne';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      destination: destination.trim(),
      departureCity: departureCity.trim(),
      startDate,
      endDate,
      people: parseInt(people),
    });
  };

  const duration = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6"
    >
      {selectedDest && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative rounded-2xl overflow-hidden h-40"
        >
          <img
            src={selectedDest.image}
            alt={selectedDest.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <span className="text-2xl mr-2">{selectedDest.emoji}</span>
            <span className="text-xl font-bold">{selectedDest.name}</span>
            <span className="text-white/70 ml-2">{selectedDest.country}</span>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Ville de départ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville de départ</label>
          <div className="relative">
            <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Paris, Lyon, Marseille..."
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.departureCity ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
          </div>
          {errors.departureCity && <p className="text-red-500 text-xs mt-1">{errors.departureCity}</p>}
        </div>

        {/* Destination avec autocomplete */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tokyo, Bali, Marrakech..."
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setSelectedDest(null);
                searchDestinations(e.target.value);
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className={`w-full pl-11 pr-10 py-3 rounded-xl border ${errors.destination ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
            {searchingDest ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            )}
          </div>
          {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute z-50 top-full mt-2 w-full bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
              >
                {suggestions.map((dest, i) => (
                  <motion.button
                    key={`${dest.name}-${i}`}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => selectDestination(dest)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-sand-50 transition-colors text-left"
                  >
                    <img src={dest.image} alt={dest.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{dest.emoji} {dest.name}</p>
                      <p className="text-sm text-gray-400 truncate">{dest.country}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de départ</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && new Date(e.target.value) >= new Date(endDate)) setEndDate('');
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.startDate ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
          </div>
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de retour</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.endDate ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
          </div>
          {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
        </div>
      </div>

      {/* Voyageurs + info durée */}
      <div className="grid md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Voyageurs</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              min="1"
              max="20"
              placeholder="2"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border ${errors.people ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
          </div>
          {errors.people && <p className="text-red-500 text-xs mt-1">{errors.people}</p>}
        </div>

        {duration > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 text-primary-800"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">{duration} nuit{duration > 1 ? 's' : ''}</span>
          </motion.div>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        {isLoading ? 'Analyse des prix en cours...' : 'Estimer mon budget'}
      </Button>

      {isLoading && (
        <p className="text-center text-sm text-gray-400">
          L&apos;IA analyse les prix de vols, hôtels et activités...
        </p>
      )}
    </motion.form>
  );
}
