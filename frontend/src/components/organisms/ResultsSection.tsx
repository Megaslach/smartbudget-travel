'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { BudgetEstimate, ItineraryDay } from '@/types';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ResultsSectionProps {
  simulationId: string;
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
}

export default function ResultsSection({ simulationId, budget, destination, duration, people }: ResultsSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTrip = async () => {
    if (!user?.isPremium) {
      toast.error('Fonctionnalité premium requise');
      router.push('/pricing');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await api.generateTrip(simulationId);
      setItinerary(data.itinerary);
      toast.success('Itinéraire généré avec succès !');
    } catch {
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <BudgetResultCard budget={budget} destination={destination} duration={duration} people={people} />

      <div className="text-center">
        {!itinerary && !isGenerating && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Envie d&apos;un itinéraire détaillé jour par jour ?
            </p>
            <Button onClick={handleGenerateTrip} size="lg" variant={user?.isPremium ? 'primary' : 'outline'}>
              {user?.isPremium ? (
                <><Sparkles className="h-5 w-5" /> Générer mon itinéraire IA</>
              ) : (
                <><Lock className="h-5 w-5" /> Débloquer l&apos;itinéraire (Premium)</>
              )}
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="py-12">
            <Loader size="lg" text="L'IA génère votre itinéraire personnalisé..." />
          </div>
        )}
      </div>

      {itinerary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <h3 className="text-2xl font-bold text-gray-900">Votre itinéraire</h3>
          {itinerary.map((day) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: day.day * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
            >
              <h4 className="text-lg font-bold text-primary-600 mb-1">Jour {day.day}</h4>
              <p className="text-gray-500 text-sm mb-4">{day.title}</p>
              <div className="space-y-3">
                {day.activities.map((act, i) => (
                  <div key={i} className="flex gap-4 items-start pl-4 border-l-2 border-primary-200">
                    <span className="text-xs font-mono text-primary-500 mt-0.5 min-w-[45px]">{act.time}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{act.activity}</p>
                      <p className="text-sm text-gray-500">{act.location}</p>
                      <p className="text-xs text-gray-400 mt-1">{act.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-600 whitespace-nowrap">{act.estimatedCost}€</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
