'use client';

import { motion } from 'framer-motion';
import { BudgetEstimate } from '@/types';
import Card from '@/components/atoms/Card';
import { Plane, Hotel, Utensils, Bus, Ticket, TrendingUp, ExternalLink, Star, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BudgetResultCardProps {
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
}

const confidenceColors = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-red-100 text-red-700' };
const confidenceLabels = { high: 'Fiabilité haute', medium: 'Fiabilité moyenne', low: 'Estimation approximative' };

export default function BudgetResultCard({ budget, destination, duration, people }: BudgetResultCardProps) {
  const flightsTotal = budget.flights.avgPrice * people;
  const activitiesTotal = typeof budget.activities === 'object' ? budget.activities.total : budget.activities;
  const summaryCategories = [
    { label: 'Vols A/R', value: flightsTotal, icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Hébergement', value: budget.accommodation.total, icon: Hotel, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Restauration', value: budget.food, icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Transport', value: budget.transport, icon: Bus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Activités', value: activitiesTotal, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="gradient-primary text-white p-6 -m-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">Budget estimé</h3>
              <p className="text-white/70 text-sm mt-1">{destination} — {duration} nuit{duration > 1 ? 's' : ''} — {people} voyageur{people > 1 ? 's' : ''}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${confidenceColors[budget.confidence]}`}>{confidenceLabels[budget.confidence]}</span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-extrabold">{budget.total.toLocaleString()}€</span>
            <span className="text-white/50 text-sm pb-1">total estimé</span>
          </div>
        </div>

        {budget.summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100 mb-4 mt-2">
            <TrendingUp className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary-800">{budget.summary}</p>
          </motion.div>
        )}

        <div className="space-y-2.5 mt-4">
          {summaryCategories.map((cat, i) => {
            const Icon = cat.icon;
            const pct = Math.round((cat.value / budget.total) * 100);
            return (
              <motion.div key={cat.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${cat.bg} ${cat.color}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cat.label}</span>
                    <span className="font-bold text-gray-900">{cat.value.toLocaleString()}€</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} className="h-full gradient-primary rounded-full" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Vols */}
      {budget.flights.options && budget.flights.options.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Plane className="h-5 w-5 text-sky-500" /> Vols</h4>
              {budget.flights.isRealData ? (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Prix réels</span>
              ) : (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Estimation IA</span>
              )}
            </div>
            <a href={budget.flights.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">Voir sur Skyscanner <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="grid gap-3">
            {budget.flights.options.map((f, i) => {
              const depTime = f.departureAt ? new Date(f.departureAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
              const arrTime = f.arrivalAt ? new Date(f.arrivalAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
              return (
                <a key={i} href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-sky-200 hover:shadow-md transition-all group">
                  <div className="p-2 rounded-lg bg-sky-50"><Plane className="h-5 w-5 text-sky-500" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{f.airline}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{f.type}</span>
                      {depTime && arrTime && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{depTime} → {arrTime}</span>
                      )}
                      {f.duration && <span>{f.duration}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{f.price.toLocaleString()}€<span className="text-xs text-gray-400 font-normal">/pers</span></p>
                    <span className="text-[10px] text-primary-500 group-hover:underline">Réserver →</span>
                  </div>
                </a>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">{budget.flights.note}</p>
        </motion.div>
      )}

      {/* Hébergement */}
      {budget.accommodation.options && budget.accommodation.options.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Hotel className="h-5 w-5 text-indigo-500" /> Hébergement</h4>
              {budget.accommodation.isRealData ? (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Prix réels</span>
              ) : (
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Estimation IA</span>
              )}
            </div>
            <a href={budget.accommodation.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">Voir sur Booking <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="grid gap-3">
            {budget.accommodation.options.map((h, i) => (
              <a key={i} href={h.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="p-2 rounded-lg bg-indigo-50"><Hotel className="h-5 w-5 text-indigo-500" /></div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{h.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{h.type}</span>
                    {h.rating && <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400" />{h.rating}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{h.pricePerNight}€<span className="text-xs text-gray-400 font-normal">/nuit</span></p>
                  <span className="text-[10px] text-primary-500 group-hover:underline">Réserver →</span>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{budget.accommodation.note}</p>
        </motion.div>
      )}

      {/* Activités */}
      {typeof budget.activities === 'object' && budget.activities.options && budget.activities.options.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Ticket className="h-5 w-5 text-purple-500" /> Activités incontournables</h4>
            <a href={budget.activities.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">GetYourGuide <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {budget.activities.options.map((a, i) => (
              <a key={i} href={a.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 hover:border-purple-200 hover:shadow-md transition-all group">
                <div className="p-2 rounded-lg bg-purple-50"><Ticket className="h-4 w-4 text-purple-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.duration}</p>
                </div>
                <span className="font-bold text-sm text-gray-900 whitespace-nowrap">{a.price}€</span>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
