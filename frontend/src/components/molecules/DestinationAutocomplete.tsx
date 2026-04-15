'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, PlaneTakeoff, Plane, X } from 'lucide-react';
import { api } from '@/lib/api';

type Mode = 'destination' | 'airport';

interface DestinationAutocompleteProps {
  mode?: Mode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
}

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

export default function DestinationAutocomplete({
  mode = 'destination',
  value,
  onChange,
  placeholder,
  error,
  label,
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [dests, setDests] = useState<Destination[]>([]);
  const [airs, setAirs] = useState<AirportResult[]>([]);
  const [show, setShow] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    onChange(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 1) { setDests([]); setAirs([]); setShow(false); return; }
    timer.current = setTimeout(async () => {
      try {
        if (mode === 'airport') {
          const r = await api.searchAirports(q);
          setAirs(r.airports);
          setShow(r.airports.length > 0);
        } else {
          const r = await api.searchDestinations(q);
          setDests(r.destinations);
          setShow(r.destinations.length > 0);
        }
      } catch {
        setDests([]); setAirs([]);
      }
    }, 200);
  }, [mode, onChange]);

  const clear = () => {
    setQuery('');
    onChange('');
    setDests([]); setAirs([]); setShow(false);
  };

  const LeadIcon = mode === 'airport' ? PlaneTakeoff : MapPin;
  const defaultPlaceholder = mode === 'airport' ? 'Paris, Lyon, Marseille…' : 'Tokyo, Bali, Marrakech…';
  const defaultLabel = mode === 'airport' ? 'Ville de départ' : 'Destination';

  return (
    <div ref={wrapperRef} className="relative">
      {label !== '' && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <LeadIcon className="inline h-4 w-4 mr-1 text-gray-400" />
          {label ?? defaultLabel}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder ?? defaultPlaceholder}
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => {
            if (mode === 'airport' ? airs.length > 0 : dests.length > 0) setShow(true);
          }}
          className={`w-full px-4 pr-10 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 text-gray-400"
            aria-label="Effacer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden max-h-72 overflow-y-auto"
          >
            {mode === 'airport'
              ? airs.map((a, i) => (
                  <button
                    key={`${a.code}-${i}`}
                    type="button"
                    onClick={() => {
                      const v = `${a.city} (${a.code})`;
                      setQuery(v);
                      onChange(v);
                      setShow(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sand-50 transition-colors text-left text-sm"
                  >
                    <Plane className="h-4 w-4 text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900">{a.emoji} {a.city}</span>
                      <span className="text-gray-400 ml-1">— {a.airportName}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{a.code}</span>
                  </button>
                ))
              : dests.map((d, i) => (
                  <button
                    key={`${d.name}-${i}`}
                    type="button"
                    onClick={() => {
                      const v = `${d.name}, ${d.country}`;
                      setQuery(v);
                      onChange(v);
                      setShow(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sand-50 transition-colors text-left"
                  >
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
  );
}
