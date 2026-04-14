'use client';

import { motion } from 'framer-motion';
import { BudgetEstimate } from '@/types';
import Card from '@/components/atoms/Card';
import { Plane, Hotel, Utensils, Bus, Ticket, Info, TrendingUp } from 'lucide-react';

interface BudgetResultCardProps {
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
}

const confidenceColors = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
};

const confidenceLabels = {
  high: 'Fiabilité haute',
  medium: 'Fiabilité moyenne',
  low: 'Estimation approximative',
};

export default function BudgetResultCard({ budget, destination, duration, people }: BudgetResultCardProps) {
  const flightsTotal = budget.flights.avgPrice * people;
  const categories = [
    { label: 'Vols A/R', value: flightsTotal, icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50', detail: `${budget.flights.avgPrice.toLocaleString()}€/pers` },
    { label: 'Hébergement', value: budget.accommodation.total, icon: Hotel, color: 'text-indigo-500', bg: 'bg-indigo-50', detail: `${budget.accommodation.avgPerNight.toLocaleString()}€/nuit` },
    { label: 'Restauration', value: budget.food, icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', detail: `${Math.round(budget.food / duration / people)}€/jour/pers` },
    { label: 'Transport local', value: budget.transport, icon: Bus, color: 'text-emerald-500', bg: 'bg-emerald-50', detail: `${Math.round(budget.transport / duration / people)}€/jour/pers` },
    { label: 'Activités', value: budget.activities, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50', detail: `${Math.round(budget.activities / duration / people)}€/jour/pers` },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="gradient-primary text-white p-6 -m-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold">Budget estimé</h3>
            <p className="text-white/70 text-sm mt-1">
              {destination} — {duration} nuit{duration > 1 ? 's' : ''} — {people} voyageur{people > 1 ? 's' : ''}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${confidenceColors[budget.confidence]}`}>
            {confidenceLabels[budget.confidence]}
          </span>
        </div>
        <div className="mt-4 flex items-end gap-3">
          <span className="text-4xl font-extrabold">{budget.total.toLocaleString()}€</span>
          <span className="text-white/50 text-sm pb-1">total estimé</span>
        </div>
      </div>

      {budget.summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100 mb-6 mt-2"
        >
          <TrendingUp className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary-800">{budget.summary}</p>
        </motion.div>
      )}

      <div className="space-y-3 mt-4">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          const percentage = Math.round((cat.value / budget.total) * 100);

          return (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${cat.bg} ${cat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{cat.label}</span>
                      <span className="text-xs text-gray-400">{cat.detail}</span>
                    </div>
                    <span className="font-bold text-gray-900">{cat.value.toLocaleString()}€</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full gradient-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sources */}
      <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <div>
            <p><strong>Vols :</strong> {budget.flights.source} — {budget.flights.note}</p>
            <p><strong>Hébergement :</strong> {budget.accommodation.source} — {budget.accommodation.note}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
