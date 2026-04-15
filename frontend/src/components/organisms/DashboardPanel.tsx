'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, TrendingUp, Sparkles, Eye, RefreshCw, Clock, Plane, Hotel, TrendingDown, Minus, Share2, Link2, Check } from 'lucide-react';
import { Simulation, PriceCheckResponse } from '@/types';
import { api } from '@/lib/api';
import Card from '@/components/atoms/Card';
import Loader from '@/components/atoms/Loader';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import AiTipsCard from '@/components/molecules/AiTipsCard';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Simulation | null>(null);
  const [priceCheck, setPriceCheck] = useState<PriceCheckResponse | null>(null);
  const [isCheckingPrice, setIsCheckingPrice] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const data = await api.getUserSimulations();
        setSimulations(data.simulations);
      } catch {
        console.error('Failed to fetch simulations');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSimulations();
  }, []);

  const handleSelect = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); setDetail(null); setPriceCheck(null); return; }
    setSelectedId(id);
    setDetail(null);
    setPriceCheck(null);
    setIsLoadingDetail(true);
    try {
      const data = await api.getSimulationDetail(id);
      setDetail(data.simulation);
    } catch { toast.error('Erreur chargement détails'); }
    finally { setIsLoadingDetail(false); }
  };

  const handlePriceCheck = async (id: string) => {
    setIsCheckingPrice(true);
    try {
      const data = await api.priceCheck(id);
      setPriceCheck(data);
      toast.success('Prix actuels récupérés !');
    } catch { toast.error('Erreur vérification prix'); }
    finally { setIsCheckingPrice(false); }
  };

  const handleShare = async (simId: string) => {
    const url = `${window.location.origin}/shared/${simId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(simId);
      toast.success('Lien copié !');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="lg" text="Chargement du dashboard..." />
      </div>
    );
  }

  const totalBudget = simulations.reduce((sum, s) => {
    const budget = typeof s.budget === 'number' ? s.budget : s.budget.total;
    return sum + budget;
  }, 0);
  const avgBudget = simulations.length > 0 ? Math.round(totalBudget / simulations.length) : 0;

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><MapPin className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500">Simulations</p>
              <p className="text-2xl font-bold">{simulations.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500">Budget total simulé</p>
              <p className="text-2xl font-bold">{totalBudget.toLocaleString()}€</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500">Budget moyen</p>
              <p className="text-2xl font-bold">{avgBudget.toLocaleString()}€</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-50 text-accent-600"><Calendar className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <Badge variant={user?.isPremium ? 'premium' : 'default'}>
                {user?.isPremium ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Simulation history with detail expand */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Historique des simulations</h3>
        {simulations.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Aucune simulation pour le moment.</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre première simulation de budget !</p>
            <Button variant="primary" className="mt-4" onClick={() => router.push('/simulation')}>Créer une simulation</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {simulations.map((sim, i) => {
              const budget = typeof sim.budget === 'number' ? sim.budget : sim.budget.total;
              const isSelected = selectedId === sim.id;

              return (
                <motion.div key={sim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card hover className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''}`} onClick={() => handleSelect(sim.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><MapPin className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{sim.destination}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                            {sim.departureCity && <span>De : {sim.departureCity}</span>}
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{sim.startDate} → {sim.endDate}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sim.people} pers.</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.duration}j</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-lg font-bold text-primary-600">{budget.toLocaleString()}€</p>
                          <p className="text-[10px] text-gray-400">{new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShare(sim.id); }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Partager"
                        >
                          {copiedId === sim.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                        </button>
                        <Eye className={`h-4 w-4 transition-transform ${isSelected ? 'text-primary-600' : 'text-gray-300'}`} />
                      </div>
                    </div>
                    {sim.itinerary && <Badge variant="success" className="mt-3">Itinéraire généré</Badge>}
                  </Card>

                  {/* Expanded detail */}
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-4">
                      {isLoadingDetail ? (
                        <div className="py-8 flex justify-center"><Loader size="md" text="Chargement des détails..." /></div>
                      ) : detail?.budgetData ? (
                        <>
                          <BudgetResultCard budget={detail.budgetData} destination={detail.destination} duration={detail.duration} people={detail.people} />
                          {detail.aiTips && <AiTipsCard tips={detail.aiTips} />}

                          {/* Price check section */}
                          <Card>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 text-primary-600" /> Évolution des prix
                                </h4>
                                <p className="text-xs text-gray-500">Comparer avec les prix actuels</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handlePriceCheck(sim.id)} disabled={isCheckingPrice}>
                                {isCheckingPrice ? <><RefreshCw className="h-4 w-4 animate-spin" /> Vérification...</> : 'Vérifier les prix actuels'}
                              </Button>
                            </div>
                            {priceCheck && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <div className={`p-4 rounded-xl ${priceCheck.comparison.trend === 'up' ? 'bg-red-50 border border-red-100' : priceCheck.comparison.trend === 'down' ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'}`}>
                                  <div className="flex items-center gap-3">
                                    {priceCheck.comparison.trend === 'up' ? <TrendingUp className="h-6 w-6 text-red-600" /> : priceCheck.comparison.trend === 'down' ? <TrendingDown className="h-6 w-6 text-emerald-600" /> : <Minus className="h-6 w-6 text-gray-500" />}
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {priceCheck.comparison.totalDiff > 0 ? '+' : ''}{priceCheck.comparison.totalDiff}€ ({priceCheck.comparison.totalDiffPercent > 0 ? '+' : ''}{priceCheck.comparison.totalDiffPercent}%)
                                      </p>
                                      <p className="text-sm text-gray-600">{priceCheck.comparison.advice}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                                    <div className="flex items-center gap-2 mb-1"><Plane className="h-4 w-4 text-sky-600" /><span className="text-xs font-medium text-gray-900">Vols /pers</span></div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-sm text-gray-400 line-through">{priceCheck.original.flights.avgPrice}€</span>
                                      <span className="text-lg font-bold text-gray-900">{priceCheck.current.flights.avgPrice}€</span>
                                      <span className={`text-xs font-bold ${priceCheck.comparison.flightDiffPerPerson > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {priceCheck.comparison.flightDiffPerPerson > 0 ? '+' : ''}{priceCheck.comparison.flightDiffPerPerson}€
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-1"><Hotel className="h-4 w-4 text-indigo-600" /><span className="text-xs font-medium text-gray-900">Hôtels /nuit</span></div>
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-sm text-gray-400 line-through">{priceCheck.original.accommodation.avgPerNight}€</span>
                                      <span className="text-lg font-bold text-gray-900">{priceCheck.current.accommodation.avgPerNight}€</span>
                                      <span className={`text-xs font-bold ${priceCheck.comparison.hotelDiffPerNight > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {priceCheck.comparison.hotelDiffPerNight > 0 ? '+' : ''}{priceCheck.comparison.hotelDiffPerNight}€
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                  <span className="text-sm text-gray-600">Budget initial</span>
                                  <span className="font-bold text-gray-400 line-through">{priceCheck.original.total.toLocaleString()}€</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50">
                                  <span className="text-sm font-medium text-primary-900">Budget actuel</span>
                                  <span className="text-lg font-bold text-primary-700">{priceCheck.current.total.toLocaleString()}€</span>
                                </div>
                              </motion.div>
                            )}
                          </Card>
                        </>
                      ) : (
                        <Card className="text-center py-6">
                          <p className="text-gray-500 text-sm">Détails non disponibles pour cette ancienne simulation.</p>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
