'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Clock, ArrowLeft, Share2, Trash2 } from 'lucide-react';
import { Simulation } from '@/types';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Card from '@/components/atoms/Card';
import Loader from '@/components/atoms/Loader';
import Button from '@/components/atoms/Button';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import AiTipsCard from '@/components/molecules/AiTipsCard';
import ItineraryCard from '@/components/molecules/ItineraryCard';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function SimulationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const id = params?.id as string;
  const [sim, setSim] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRefresh = async (category: 'flights' | 'hotels' | 'activities', keepNames: string[]) => {
    if (!sim) return;
    try {
      const { simulation } = await api.regenerateOptions(sim.id, category, keepNames);
      setSim(simulation);
      toast.success(
        category === 'flights' ? 'Vols mis à jour'
          : category === 'hotels' ? 'Hôtels mis à jour'
          : 'Activités mises à jour'
      );
    } catch (e: any) {
      toast.error(e?.error || 'Erreur de rafraîchissement');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!id || !user) return;
    api.getSimulationDetail(id)
      .then((data) => setSim(data.simulation))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [id, user, authLoading, router]);

  const handleShare = async () => {
    if (!sim) return;
    setSharing(true);
    try {
      const { token } = await api.createInvite(sim.id);
      const url = `${window.location.origin}/invite/${token}`;
      if (navigator.share) {
        await navigator.share({ title: `Mon voyage à ${sim.destination}`, url }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié !');
      }
    } catch (e: any) {
      toast.error(e?.error || 'Erreur de partage');
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!sim) return;
    if (!window.confirm('Supprimer cette simulation ?')) return;
    setDeleting(true);
    try {
      await api.deleteSimulation(sim.id);
      toast.success('Simulation supprimée');
      router.replace('/dashboard');
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
      setDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Chargement de la simulation..." />
      </div>
    );
  }

  if (error || !sim) {
    return (
      <DashboardLayout title="Simulation introuvable">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">Cette simulation n&apos;existe plus ou tu n&apos;y as plus accès.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Retour au dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const budget = typeof sim.budget === 'number' ? sim.budget : sim.budget.total;
  const perPerson = Math.round(budget / Math.max(1, sim.people));

  return (
    <DashboardLayout title={`Voyage à ${sim.destination}`} description={`${sim.startDate} → ${sim.endDate} · ${sim.duration} jours · ${sim.people} pers.`}>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />Retour
        </button>

        {/* Meta */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                  {perPerson.toLocaleString()}€ par personne
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleShare} isLoading={sharing} className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                  <Share2 className="h-4 w-4" /> Partager
                </Button>
                <Button variant="outline" onClick={handleDelete} isLoading={deleting} className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed budget */}
        {sim.budgetData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <BudgetResultCard
              budget={sim.budgetData}
              destination={sim.destination}
              duration={sim.duration}
              people={sim.people}
              onRefresh={handleRefresh}
            />
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
            <ItineraryCard itinerary={sim.itinerary} destination={sim.destination} />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
