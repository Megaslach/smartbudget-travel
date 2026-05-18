'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Users, MapPin, Calendar, Sparkles, Plane, Hotel,
  Utensils, Ticket, Bus, AlertCircle, CheckCircle2, Lightbulb,
} from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { getDestinationImage } from '@/lib/images';
import type { TripProposal } from '@/types';
import toast from 'react-hot-toast';

export default function ProposePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [budgetTotal, setBudgetTotal] = useState('1500');
  const [people, setPeople] = useState('2');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [usePerPerson, setUsePerPerson] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    proposals: TripProposal[];
    feasibility?: 'ok' | 'tight' | 'impossible';
    advice?: string;
    alternatives?: TripProposal[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const budget = parseInt(budgetTotal);
    if (!budget || budget < 100) {
      toast.error('Budget minimum 100€');
      return;
    }
    const peopleNum = parseInt(people) || 1;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.proposeTrips({
        ...(usePerPerson ? { budgetPerPerson: budget } : { budgetTotal: budget }),
        people: peopleNum,
        destination: destination.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        durationDays: !startDate && !endDate ? parseInt(durationDays) || undefined : undefined,
      });
      setResult(res);
      if (res.feasibility === 'impossible' && res.proposals.length === 0) {
        toast.error('Voyage non réalisable avec ce budget');
      }
    } catch (e: any) {
      toast.error(e?.error || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>;
  }

  return (
    <DashboardLayout title="Trouver un voyage" description="Entrez un budget — on vous propose des destinations qui rentrent dedans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6"
        >
          {/* Budget toggle */}
          <div className="flex items-center justify-center gap-2 bg-sand-50 rounded-full p-1 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setUsePerPerson(false)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
                !usePerPerson ? 'bg-primary-700 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Budget total
            </button>
            <button
              type="button"
              onClick={() => setUsePerPerson(true)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
                usePerPerson ? 'bg-primary-700 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Par personne
            </button>
          </div>

          {/* Budget + People */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Wallet className="inline h-4 w-4 mr-1 text-primary-500" />
                {usePerPerson ? 'Budget par personne (€)' : 'Budget total (€)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="50"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                placeholder="1500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50 text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Users className="inline h-4 w-4 mr-1 text-primary-500" />Nombre de voyageurs
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Optional filters */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Filtres optionnels — plus tu en mets, plus la recherche se précise
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />Destination souhaitée (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Tokyo, Bali, Marrakech…"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50"
              />
              <p className="text-[11px] text-gray-400 mt-1">Si possible avec ton budget, on confirme. Sinon on propose des alternatives.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />Date départ
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />Date retour
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ou durée (jours)
                </label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  disabled={!!startDate && !!endDate}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            <Sparkles className="h-4 w-4" />Trouver des voyages
          </Button>
        </motion.form>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Advice banner */}
              {result.advice && (
                <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  result.feasibility === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : result.feasibility === 'tight'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  {result.feasibility === 'ok' ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : result.feasibility === 'tight' ? (
                    <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{result.advice}</p>
                </div>
              )}

              {/* Specific destination proposal */}
              {result.proposals.length > 0 && destination && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Ta destination
                  </h2>
                  {result.proposals.map((p) => (
                    <ProposalCard key={`pri-${p.destination}`} proposal={p} primary />
                  ))}
                </div>
              )}

              {/* Generic proposals */}
              {result.proposals.length > 0 && !destination && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    {result.proposals.length} destinations qui rentrent dans ton budget
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.proposals.map((p) => (
                      <ProposalCard key={p.destination} proposal={p} />
                    ))}
                  </div>
                </div>
              )}

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    Alternatives recommandées
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.alternatives.map((p) => (
                      <ProposalCard key={`alt-${p.destination}`} proposal={p} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function ProposalCard({ proposal, primary = false }: { proposal: TripProposal; primary?: boolean }) {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    getDestinationImage(proposal.destination).then(setImage).catch(() => {});
  }, [proposal.destination]);

  const handleSimulate = () => {
    router.push(`/simulation?destination=${encodeURIComponent(proposal.destination)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
        primary ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'
      }`}
    >
      <div className="relative h-40 bg-sand-100">
        {image && <img src={image} alt={proposal.destination} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3">
          {proposal.fitsBudget ? (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">✓ Rentre dans le budget</span>
          ) : (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Dépasse le budget</span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-2xl">{proposal.emoji}</p>
          <p className="font-bold text-xl drop-shadow">{proposal.destination}</p>
          <p className="text-xs text-white/80 drop-shadow">{proposal.country}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">{proposal.estimatedTotal.toLocaleString()}€</p>
            <p className="text-xs text-gray-500">{proposal.perPerson.toLocaleString()}€ / pers · {proposal.durationDays}j · {proposal.people} pers</p>
          </div>
        </div>

        <div className="space-y-1.5 mb-4 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Plane className="h-3 w-3 text-sky-500" />Vols</span>
            <span className="font-semibold">{proposal.breakdown.flights}€</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Hotel className="h-3 w-3 text-violet-500" />Hébergement</span>
            <span className="font-semibold">{proposal.breakdown.accommodation}€</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Utensils className="h-3 w-3 text-amber-500" />Repas</span>
            <span className="font-semibold">{proposal.breakdown.food}€</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Ticket className="h-3 w-3 text-purple-500" />Activités</span>
            <span className="font-semibold">{proposal.breakdown.activities}€</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Bus className="h-3 w-3 text-emerald-500" />Transports locaux</span>
            <span className="font-semibold">{proposal.breakdown.transport}€</span>
          </div>
        </div>

        {proposal.bestMonths && proposal.bestMonths.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Meilleurs mois</p>
            <div className="flex flex-wrap gap-1">
              {proposal.bestMonths.map((m) => (
                <span key={m} className="text-[10px] bg-sand-50 text-gray-600 px-2 py-0.5 rounded font-medium">{m}</span>
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" size="md" className="w-full" onClick={handleSimulate}>
          Simuler ce voyage
        </Button>
      </div>
    </motion.div>
  );
}
