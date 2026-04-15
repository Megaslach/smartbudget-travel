'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Clock, Share2, Sparkles, ArrowRight } from 'lucide-react';
import { Simulation } from '@/types';
import { api } from '@/lib/api';
import LandingLayout from '@/components/templates/LandingLayout';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Loader from '@/components/atoms/Loader';
import Button from '@/components/atoms/Button';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import AiTipsCard from '@/components/molecules/AiTipsCard';
import ItineraryCard from '@/components/molecules/ItineraryCard';
import toast from 'react-hot-toast';

type SharedSim = Simulation & { sharedBy: string };

export default function SharedSimulationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [sim, setSim] = useState<SharedSim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchSim = async () => {
      try {
        const data = await api.getSharedSimulation(id);
        setSim(data.simulation);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSim();
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  if (isLoading) {
    return (
      <LandingLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader size="lg" text="Chargement de l'itinéraire partagé..." />
        </div>
      </LandingLayout>
    );
  }

  if (error || !sim) {
    return (
      <LandingLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Itinéraire introuvable</h2>
            <p className="text-gray-500 mb-6">Ce lien de partage n&apos;est plus valide ou a été supprimé.</p>
            <Button variant="primary" onClick={() => router.push('/')}>Retour à l&apos;accueil</Button>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  const budget = typeof sim.budget === 'number' ? sim.budget : sim.budget.total;

  return (
    <LandingLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Badge variant="success" className="mb-3">
            <Share2 className="h-3 w-3 inline mr-1" /> Itinéraire partagé par {sim.sharedBy}
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Voyage à <span className="text-primary-600">{sim.destination}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
            {sim.departureCity && (
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />Depuis {sim.departureCity}</span>
            )}
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{sim.startDate} → {sim.endDate}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{sim.duration} jours</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{sim.people} pers.</span>
          </div>
        </motion.div>

        {/* Budget summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="mb-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-primary-100 text-sm font-medium">Budget total estimé</p>
                <p className="font-display text-4xl sm:text-5xl font-bold mt-1">{budget.toLocaleString()}€</p>
                <p className="text-primary-200 text-sm mt-1">
                  {Math.round(budget / sim.people).toLocaleString()}€ par personne
                </p>
              </div>
              <Button variant="outline" onClick={handleCopyLink} className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                <Share2 className="h-4 w-4" /> Copier le lien
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Detailed budget */}
        {sim.budgetData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <BudgetResultCard budget={sim.budgetData} destination={sim.destination} duration={sim.duration} people={sim.people} />
          </motion.div>
        )}

        {/* AI tips */}
        {sim.aiTips && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <AiTipsCard tips={sim.aiTips} />
          </motion.div>
        )}

        {/* Day-by-day itinerary */}
        {sim.itinerary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-6">
            <ItineraryCard itinerary={sim.itinerary} />
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-center">
            <Sparkles className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">Cet itinéraire te plaît ?</h3>
            <p className="text-gray-600 mb-5">Crée le tien avec SmartBudget et reçois une estimation personnalisée en quelques secondes.</p>
            <Button variant="primary" onClick={() => router.push('/register')}>
              Créer mon itinéraire <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </motion.div>
      </div>
    </LandingLayout>
  );
}
