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
import TripGeneratorWizard, { TripGeneratorOptions } from '@/components/organisms/TripGeneratorWizard';
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
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleOpenWizard = () => {
    if (!user?.isPremium) {
      toast.error('Fonctionnalité premium requise');
      router.push('/pricing');
      return;
    }
    setWizardOpen(true);
  };

  const handleGenerateTrip = async (opts: TripGeneratorOptions) => {
    setIsGenerating(true);
    try {
      const data = await api.generateTrip(simulationId, opts);
      setItinerary(data.itinerary);
      toast.success('Itinéraire généré avec succès !');
    } catch {
      toast.error('Erreur lors de la génération');
      throw new Error('Generation failed');
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

      <div>
        {!itinerary && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Itinéraire personnalisé</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Configure ton voyage à {destination} étape par étape : style, rythme, intérêts, transport… On génère ensuite un plan jour par jour sur mesure.
            </p>
            <Button
              onClick={handleOpenWizard}
              size="lg"
              variant={user?.isPremium ? 'primary' : 'outline'}
              className="mt-6"
            >
              {user?.isPremium ? (
                <><Sparkles className="h-5 w-5" /> Configurer mon itinéraire</>
              ) : (
                <><Lock className="h-5 w-5" /> Débloquer l&apos;itinéraire (Premium)</>
              )}
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="py-12 text-center">
            <Loader size="lg" text={`Préparation de votre itinéraire pour ${duration}j à ${destination}...`} />
          </div>
        )}
      </div>

      {itinerary && <ItineraryCard itinerary={itinerary} destination={destination} />}

      <TripGeneratorWizard
        open={wizardOpen}
        destination={destination}
        onClose={() => setWizardOpen(false)}
        onGenerate={handleGenerateTrip}
      />
    </motion.div>
  );
}
