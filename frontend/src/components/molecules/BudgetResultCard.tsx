'use client';

import { motion } from 'framer-motion';
import { BudgetEstimate } from '@/types';
import Card from '@/components/atoms/Card';
import { Wallet, Utensils, Bus, Sparkles } from 'lucide-react';

interface BudgetResultCardProps {
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
}

const categories = [
  { key: 'accommodation' as const, label: 'Hébergement', icon: Wallet, color: 'text-blue-500' },
  { key: 'food' as const, label: 'Restauration', icon: Utensils, color: 'text-orange-500' },
  { key: 'transport' as const, label: 'Transport', icon: Bus, color: 'text-green-500' },
  { key: 'activities' as const, label: 'Activités', icon: Sparkles, color: 'text-purple-500' },
];

export default function BudgetResultCard({ budget, destination, duration, people }: BudgetResultCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="gradient-primary text-white p-6 -m-6 mb-6">
        <h3 className="text-xl font-bold">Budget estimé</h3>
        <p className="text-white/80 text-sm mt-1">
          {destination} — {duration} jours — {people} personne{people > 1 ? 's' : ''}
        </p>
        <div className="mt-4">
          <span className="text-4xl font-extrabold">{budget.total.toLocaleString()}€</span>
          <span className="text-white/70 ml-2 text-sm">total estimé</span>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          const value = budget[cat.key];
          const percentage = Math.round((value / budget.total) * 100);

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`p-2 rounded-lg bg-gray-50 ${cat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <span className="font-semibold">{value.toLocaleString()}€</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
