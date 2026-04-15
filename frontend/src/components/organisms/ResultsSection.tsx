'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import { BudgetEstimate, Itinerary, AiTipsResult } from '@/types';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import AiTipsCard from '@/components/molecules/AiTipsCard';
import ItineraryCard from '@/components/molecules/ItineraryCard';
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
  aiTips?: AiTipsResult;
}

export default function ResultsSection({ simulationId, budget, destination, duration, people, aiTips }: ResultsSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
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

      {aiTips && <AiTipsCard tips={aiTips} simulationId={simulationId} />}

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

      {itinerary && <ItineraryCard itinerary={itinerary} />}
    </motion.div>
  );
}
