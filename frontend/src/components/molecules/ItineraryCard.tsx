'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, Moon, MapPin, Clock, Euro, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import type { Itinerary, ItineraryActivity, ItineraryDay } from '@/types';
import Card from '@/components/atoms/Card';

const ActivityMap = dynamic(() => import('./ActivityMap'), { ssr: false });

const timeIcons = { morning: Sun, afternoon: Cloud, evening: Moon };
const timeLabels = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
const timeColors = {
  morning: 'from-amber-400 to-orange-400',
  afternoon: 'from-sky-400 to-blue-500',
  evening: 'from-indigo-500 to-purple-600',
};

const categoryBadges: Record<string, { label: string; color: string }> = {
  sight: { label: 'À voir', color: 'bg-indigo-100 text-indigo-700' },
  food: { label: 'Gastronomie', color: 'bg-orange-100 text-orange-700' },
  activity: { label: 'Activité', color: 'bg-purple-100 text-purple-700' },
  nature: { label: 'Nature', color: 'bg-emerald-100 text-emerald-700' },
  shopping: { label: 'Shopping', color: 'bg-pink-100 text-pink-700' },
  nightlife: { label: 'Nightlife', color: 'bg-fuchsia-100 text-fuchsia-700' },
  transport: { label: 'Transport', color: 'bg-slate-100 text-slate-700' },
};

interface ItineraryCardProps {
  itinerary: Itinerary | ItineraryDay[] | null | undefined;
}

export default function ItineraryCard({ itinerary }: ItineraryCardProps) {
  const [activeDay, setActiveDay] = useState(0);

  const days: ItineraryDay[] = Array.isArray(itinerary)
    ? (itinerary as ItineraryDay[])
    : itinerary?.days ?? [];

  if (days.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-gray-500">
        Itinéraire indisponible. Régénère-le pour voir les détails jour par jour.
      </Card>
    );
  }

  const day = days[Math.min(activeDay, days.length - 1)];

  const totalCost = (day.activities ?? []).reduce((s, a) => s + (a.estimatedCost || 0), 0);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-gray-900">Itinéraire jour par jour</h3>
          <p className="text-xs text-gray-500">Généré par IA, personnalisé pour ton voyage</p>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-5 scrollbar-hide">
        {days.map((d, i) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl border transition-all text-left min-w-[110px] ${
              activeDay === i
                ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/30'
                : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${activeDay === i ? 'text-primary-100' : 'text-gray-400'}`}>
              Jour {d.day}
            </div>
            <div className="text-sm font-bold truncate max-w-[140px]">{d.title}</div>
          </button>
        ))}
      </div>

      {/* Active day header */}
      <motion.div
        key={activeDay}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 via-white to-accent-50 border border-primary-100 mb-5"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary-700 font-semibold mb-1">
              <Calendar className="h-3.5 w-3.5" />
              {day.date ? new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : `Jour ${day.day}`}
            </div>
            <h4 className="font-display text-xl font-bold text-gray-900">{day.title}</h4>
            {day.summary && <p className="text-sm text-gray-600 mt-1">{day.summary}</p>}
          </div>
          {totalCost > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Budget du jour</p>
              <p className="font-display text-xl font-bold text-primary-700">{totalCost}€<span className="text-xs text-gray-400 font-normal">/pers</span></p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Map */}
      <div className="mb-5">
        <ActivityMap days={days} activeDay={activeDay} height={300} />
      </div>

      {/* Activities timeline */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {(day.activities ?? []).map((a, i) => (
            <ActivityRow key={`${activeDay}-${i}`} activity={a} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

function ActivityRow({ activity, index }: { activity: ItineraryActivity; index: number }) {
  const TimeIcon = timeIcons[activity.time] || Sun;
  const gradient = timeColors[activity.time] || 'from-gray-400 to-gray-500';
  const badge = categoryBadges[activity.category || 'activity'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative flex gap-3 group"
    >
      {/* Time marker */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-sm`}>
          <TimeIcon className="h-5 w-5" />
        </div>
        {index < 2 && <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-transparent mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{timeLabels[activity.time]}</span>
          {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.color}`}>{badge.label}</span>}
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><Clock className="h-3 w-3" />{activity.duration}</span>
          {activity.estimatedCost !== undefined && activity.estimatedCost > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-primary-600"><Euro className="h-3 w-3" />{activity.estimatedCost}€</span>
          )}
        </div>
        <h5 className="font-bold text-gray-900 leading-tight">{activity.title}</h5>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{activity.description}</p>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
          <MapPin className="h-3 w-3" />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-600 hover:underline"
          >
            {activity.location}
          </a>
          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.div>
  );
}
