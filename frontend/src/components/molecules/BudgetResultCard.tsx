'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BudgetEstimate } from '@/types';
import Card from '@/components/atoms/Card';
import { Plane, Hotel, Utensils, Bus, Ticket, TrendingUp, ExternalLink, Star, Clock, CheckCircle2, AlertTriangle, Car, Train, MapPin } from 'lucide-react';

interface BudgetResultCardProps {
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
}

const confidenceColors = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-red-100 text-red-700' };
const confidenceLabels = { high: 'Fiabilité haute', medium: 'Fiabilité moyenne', low: 'Estimation approximative' };

export default function BudgetResultCard({ budget, destination, duration, people }: BudgetResultCardProps) {
  const [transportMode, setTransportMode] = useState<'public' | 'car'>('public');
  const [selectedCarIndex, setSelectedCarIndex] = useState<number>(0);

  const flightsTotal = budget.flights.avgPrice * people;
  const activitiesTotal = typeof budget.activities === 'object' ? budget.activities.total : budget.activities;
  const allAiEstimated = !budget.flights.isRealData && !budget.accommodation.isRealData;
  const perPerson = (total: number) => (people > 0 ? Math.round(total / people) : total);

  const carOptions = budget.localTransport?.carRentals.options || [];
  const selectedCar = transportMode === 'car' && carOptions.length > 0 ? carOptions[Math.min(selectedCarIndex, carOptions.length - 1)] : null;
  const effectiveTransport = selectedCar ? selectedCar.totalPrice : budget.transport;
  const effectiveTotal = budget.total - budget.transport + effectiveTransport;
  const totalPerPerson = perPerson(effectiveTotal);

  const summaryCategories = [
    { label: 'Vols A/R', value: flightsTotal, perPerson: budget.flights.avgPrice, icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50', hint: `${budget.flights.avgPrice.toLocaleString()}€/pers × ${people}` },
    { label: 'Hébergement', value: budget.accommodation.total, perPerson: perPerson(budget.accommodation.total), icon: Hotel, color: 'text-indigo-500', bg: 'bg-indigo-50', hint: `${budget.accommodation.avgPerNight}€/nuit × ${duration} nuit${duration > 1 ? 's' : ''}` },
    { label: 'Restauration', value: budget.food, perPerson: perPerson(budget.food), icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', hint: `groupe de ${people}` },
    {
      label: 'Transport',
      value: effectiveTransport,
      perPerson: perPerson(effectiveTransport),
      icon: selectedCar ? Car : Bus,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      hint: selectedCar ? `${selectedCar.provider} · ${selectedCar.category}` : 'transports en commun',
    },
    { label: 'Activités', value: activitiesTotal, perPerson: perPerson(activitiesTotal), icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50', hint: `pour ${people} pers` },
  ];

  return (
    <div className="space-y-6">
      {allAiEstimated && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 items-start p-4 rounded-xl bg-amber-50 border border-amber-200"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Prix indicatifs générés par IA</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Les vrais prix en temps réel ne sont pas disponibles (API non configurée ou quota épuisé).
              Les montants affichés sont des estimations basées sur les données historiques. Vérifiez le prix final avant de réserver.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="gradient-primary text-white p-6 -m-6 mb-6 relative overflow-hidden">
          {/* Drifting sparkle accents */}
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="absolute text-white/20 select-none text-xs"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: [0, 0.6, 0], y: [40, -20] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
              style={{ left: `${15 + i * 22}%`, bottom: 0 }}
            >
              ✦
            </motion.span>
          ))}
          <div className="relative flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">Budget estimé</h3>
              <p className="text-white/70 text-sm mt-1">{destination} — {duration} nuit{duration > 1 ? 's' : ''} — {people} voyageur{people > 1 ? 's' : ''}</p>
            </div>
            <motion.span
              initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 240, delay: 0.15 }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${confidenceColors[budget.confidence]}`}
            >
              {confidenceLabels[budget.confidence]}
            </motion.span>
          </div>
          <div className="relative mt-4 flex flex-wrap items-end gap-x-4 gap-y-1">
            <div className="flex items-end gap-2">
              <motion.span
                key={effectiveTotal}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-4xl font-extrabold"
              >
                {Math.round(effectiveTotal).toLocaleString()}€
              </motion.span>
              <span className="text-white/60 text-sm pb-1">total groupe</span>
            </div>
            {people > 1 && (
              <div className="flex items-end gap-2 text-white/80">
                <span className="text-2xl font-bold">{totalPerPerson.toLocaleString()}€</span>
                <span className="text-white/60 text-sm pb-0.5">/personne</span>
              </div>
            )}
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
                  <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700">{cat.label}</span>
                      <span className="text-[10px] text-gray-400">{cat.hint}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{cat.value.toLocaleString()}€</span>
                      {people > 1 && (
                        <span className="block text-[10px] text-gray-400 font-normal">{cat.perPerson.toLocaleString()}€/pers</span>
                      )}
                    </div>
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
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Plane className="h-5 w-5 text-sky-500" /> Vols</h4>
                {budget.flights.isRealData ? (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1" title={budget.flights.source}><CheckCircle2 className="h-3 w-3" />Prix réels</span>
                ) : (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1" title="Estimation IA basée sur données historiques — vérifier le prix final sur Skyscanner"><AlertTriangle className="h-3 w-3" />Prix indicatif</span>
                )}
              </div>
              <a href={budget.flights.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">{budget.flights.isRealData ? 'Réserver' : 'Voir sur Skyscanner'} <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="grid gap-3">
              {budget.flights.options.map((f, i) => {
                const depTime = f.departureAt ? new Date(f.departureAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
                const arrTime = f.arrivalAt ? new Date(f.arrivalAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
                return (
                  <a key={i} href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-gradient-to-r from-sky-50/50 to-white rounded-xl border border-sky-100 p-4 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all group">
                    <div className="p-2 rounded-lg bg-sky-100 group-hover:bg-sky-200 transition-colors"><Plane className="h-5 w-5 text-sky-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{f.airline}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span>{f.type}</span>
                        {depTime && arrTime && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{depTime} → {arrTime}</span>
                        )}
                        {f.duration && <span>{f.duration}</span>}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-bold text-gray-900">{f.price.toLocaleString()}€<span className="text-xs text-gray-400 font-normal">/pers</span></p>
                      {people > 1 && (
                        <p className="text-[10px] text-gray-400">total {(f.price * people).toLocaleString()}€ ({people} pers)</p>
                      )}
                      <span className="text-[10px] text-primary-500 group-hover:underline">Réserver →</span>
                    </div>
                  </a>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">{budget.flights.note}</p>
          </Card>
        </motion.div>
      )}

      {/* Hébergement */}
      {budget.accommodation.options && budget.accommodation.options.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Hotel className="h-5 w-5 text-indigo-500" /> Hébergement</h4>
                {budget.accommodation.isRealData ? (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1" title={budget.accommodation.source}><CheckCircle2 className="h-3 w-3" />Prix réels</span>
                ) : (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1" title="Estimation IA — vérifier le prix final sur Booking"><AlertTriangle className="h-3 w-3" />Prix indicatif</span>
                )}
              </div>
              <a href={budget.accommodation.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">Voir sur Booking <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="grid gap-3">
              {budget.accommodation.options.map((h, i) => (
                <a key={i} href={h.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-stretch gap-0 bg-white rounded-xl border border-indigo-100 overflow-hidden hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group">
                  <div className="relative w-24 sm:w-32 flex-shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-50 overflow-hidden">
                    {h.imageUrl ? (
                      <img src={h.imageUrl} alt={h.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Hotel className="h-8 w-8 text-indigo-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-3 p-4 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{h.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">{h.type}</span>
                        {h.rating ? (
                          <span className="text-xs text-amber-500 flex items-center gap-0.5 font-semibold"><Star className="h-3 w-3 fill-amber-400" />{h.rating}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="font-bold text-gray-900">{h.pricePerNight}€<span className="text-xs text-gray-400 font-normal">/nuit</span></p>
                      <p className="text-[10px] text-gray-400">total {(h.pricePerNight * duration).toLocaleString()}€ ({duration}n)</p>
                      <span className="text-[10px] text-primary-500 group-hover:underline">Réserver →</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">{budget.accommodation.note}</p>
          </Card>
        </motion.div>
      )}

      {/* Transport sur place */}
      {budget.localTransport && (budget.localTransport.carRentals.options.length > 0 || budget.localTransport.publicTransport.options.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-500" /> Transport sur place
              </h4>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                {selectedCar ? `Voiture : ${selectedCar.totalPrice.toLocaleString()}€` : `Transports : ${budget.transport.toLocaleString()}€`}
              </span>
            </div>

            {carOptions.length > 0 && (
              <div className="mb-4 p-1 inline-flex bg-sand-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTransportMode('public')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    transportMode === 'public'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Train className="h-4 w-4" /> Transports en commun
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('car')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    transportMode === 'car'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Car className="h-4 w-4" /> Louer une voiture
                </button>
              </div>
            )}

            {selectedCar && (
              <div className="mb-4 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-emerald-900">
                  <span className="font-semibold">{selectedCar.provider} {selectedCar.category}</span> sélectionné · {selectedCar.pricePerDay}€/jour × {duration}j = {selectedCar.totalPrice.toLocaleString()}€ (remplace les transports en commun dans le total).
                </p>
              </div>
            )}

            {budget.localTransport.recommendation && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-900 leading-relaxed">{budget.localTransport.recommendation}</p>
              </div>
            )}

            {budget.localTransport.carRentals.options.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
                    <Car className="h-4 w-4 text-emerald-500" /> Location de voiture
                  </h5>
                  <a href={budget.localTransport.carRentals.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    Comparer sur Kayak <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {budget.localTransport.carRentals.options.map((c, i) => {
                    const isSelected = transportMode === 'car' && i === selectedCarIndex;
                    return (
                      <div
                        key={i}
                        onClick={() => { setTransportMode('car'); setSelectedCarIndex(i); }}
                        className={`flex flex-col bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                            : 'border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/10'
                        }`}
                      >
                        <div className="relative h-28 bg-gradient-to-br from-emerald-100 to-emerald-50 overflow-hidden">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.category} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-10 w-10 text-emerald-300" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                            <p className="font-bold text-sm text-gray-900">{c.pricePerDay}€<span className="text-[10px] text-gray-400 font-normal">/jour</span></p>
                          </div>
                          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                            {c.provider}
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-500/10 flex items-end justify-end p-2">
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <CheckCircle2 className="h-3 w-3" /> Sélectionné
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-gray-900 text-sm">{c.category}</p>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {c.location}</p>
                          {c.features.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.features.slice(0, 3).map((f, fi) => (
                                <span key={fi} className="text-[10px] px-1.5 py-0.5 bg-sand-100 text-gray-600 rounded">{f}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-sand-100">
                            <p className="text-[11px] text-gray-400">total {c.totalPrice.toLocaleString()}€ ({duration}j)</p>
                            <a
                              href={c.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] font-semibold text-primary-500 hover:underline whitespace-nowrap"
                            >
                              Réserver →
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {budget.localTransport.publicTransport.options.length > 0 && (
              <div>
                <h5 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5 mb-3">
                  <Train className="h-4 w-4 text-emerald-500" /> Transports & taxi
                </h5>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {budget.localTransport.publicTransport.options.map((t, i) => {
                    const typeLabel: Record<string, { label: string; icon: typeof Train; color: string }> = {
                      single: { label: 'Unitaire', icon: Train, color: 'text-sky-500' },
                      day_pass: { label: 'Pass 24h', icon: Train, color: 'text-indigo-500' },
                      multi_day: { label: 'Pass multi-jours', icon: Train, color: 'text-violet-500' },
                      taxi: { label: 'Taxi', icon: Car, color: 'text-amber-500' },
                      uber: { label: 'Uber/VTC', icon: Car, color: 'text-gray-700' },
                      airport_transfer: { label: 'Navette', icon: Bus, color: 'text-orange-500' },
                      bike: { label: 'Vélo', icon: Bus, color: 'text-emerald-500' },
                    };
                    const meta = typeLabel[t.type] || typeLabel.single;
                    const Icon = meta.icon;
                    return (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white border border-emerald-100 hover:border-emerald-200 transition-colors">
                        <div className={`p-1.5 rounded-lg bg-sand-50 ${meta.color} flex-shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                            <p className="font-bold text-sm text-gray-900 whitespace-nowrap">{t.price}€</p>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{meta.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Activités */}
      {typeof budget.activities === 'object' && budget.activities.options && budget.activities.options.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2"><Ticket className="h-5 w-5 text-purple-500" /> Activités incontournables</h4>
              <a href={budget.activities.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">GetYourGuide <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {budget.activities.options.map((a, i) => (
                <a key={i} href={a.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col bg-white rounded-xl border border-purple-100 overflow-hidden hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
                  <div className="relative h-32 bg-gradient-to-br from-purple-100 to-purple-50 overflow-hidden">
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ticket className="h-10 w-10 text-purple-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                      <p className="font-bold text-sm text-gray-900">{a.price}€<span className="text-[10px] text-gray-400 font-normal">/pers</span></p>
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{a.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{a.duration}</p>
                        {people > 1 && (
                          <p className="text-[10px] text-gray-400">· {(a.price * people).toLocaleString()}€ total</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-primary-500 group-hover:underline whitespace-nowrap">Réserver →</span>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
