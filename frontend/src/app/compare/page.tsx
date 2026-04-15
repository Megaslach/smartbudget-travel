'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Crown, Plane, Hotel, Utensils, Ticket, Scale, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import Loader from '@/components/atoms/Loader';
import Badge from '@/components/atoms/Badge';
import DateRangePicker from '@/components/molecules/DateRangePicker';
import DestinationAutocomplete from '@/components/molecules/DestinationAutocomplete';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CompareResponse } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = [
  { key: 'flights', label: 'Vols', icon: Plane, color: 'text-sky-600' },
  { key: 'accommodation', label: 'Hôtel', icon: Hotel, color: 'text-indigo-600' },
  { key: 'food', label: 'Repas', icon: Utensils, color: 'text-orange-600' },
  { key: 'activities', label: 'Activités', icon: Ticket, color: 'text-purple-600' },
] as const;

export default function ComparePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [destinations, setDestinations] = useState<string[]>(['', '']);
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  const updateDestination = (i: number, value: string) => {
    setDestinations((prev) => prev.map((d, idx) => (idx === i ? value : d)));
  };

  const addDestination = () => {
    if (destinations.length < 4) setDestinations((prev) => [...prev, '']);
  };

  const removeDestination = (i: number) => {
    if (destinations.length > 2) setDestinations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleCompare = async () => {
    const cleaned = destinations.map((d) => d.trim()).filter((d) => d.length >= 2);
    if (cleaned.length < 2) {
      toast.error('Renseigne au moins 2 destinations');
      return;
    }
    if (!departureCity || !startDate || !endDate) {
      toast.error('Remplis tous les champs');
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.compareDestinations({
        destinations: cleaned,
        departureCity,
        startDate,
        endDate,
        people,
      });
      setResult(data);
    } catch {
      toast.error('Erreur lors de la comparaison');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute winners per category
  const winners: Record<string, number | null> = {};
  if (result) {
    const cats = ['total', 'flights', 'accommodation', 'food', 'activities'];
    cats.forEach((cat) => {
      let minVal = Infinity;
      let minIdx: number | null = null;
      result.results.forEach((r, i) => {
        if (!r.budget) return;
        let v = 0;
        if (cat === 'total') v = r.budget.total;
        else if (cat === 'flights') v = r.budget.flights.avgPrice * result.people;
        else if (cat === 'accommodation') v = r.budget.accommodation.total;
        else if (cat === 'food') v = r.budget.food;
        else if (cat === 'activities') {
          v = typeof r.budget.activities === 'object' ? r.budget.activities.total : r.budget.activities;
        }
        if (v < minVal) { minVal = v; minIdx = i; }
      });
      winners[cat] = minIdx;
    });
  }

  return (
    <DashboardLayout title="Comparateur de destinations" description="Compare plusieurs destinations côte à côte pour choisir la meilleure option.">
      {/* Form */}
      <Card className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Paramètres du voyage</h3>
            <p className="text-xs text-gray-500">Dates, départ et nombre de voyageurs — identiques pour toutes les destinations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DestinationAutocomplete
            mode="airport"
            label="Ville de départ"
            value={departureCity}
            onChange={setDepartureCity}
          />
          <div>
            <Label>Nombre de voyageurs</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="mb-4">
          <Label>Dates du voyage</Label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          />
        </div>

        <div className="space-y-3">
          <Label>Destinations à comparer ({destinations.length}/4)</Label>
          {destinations.map((d, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <DestinationAutocomplete
                  mode="destination"
                  label=""
                  placeholder={`Destination ${i + 1} (ex: Rome, Italie)`}
                  value={d}
                  onChange={(v) => updateDestination(i, v)}
                />
              </div>
              {destinations.length > 2 && (
                <button
                  onClick={() => removeDestination(i)}
                  className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors mt-1"
                  title="Retirer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {destinations.length < 4 && (
            <button
              onClick={addDestination}
              className="w-full p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Ajouter une destination
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="primary" size="lg" onClick={handleCompare} disabled={isLoading}>
            {isLoading ? 'Comparaison en cours...' : <>Comparer <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </Card>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <Loader size="lg" text="Estimation des budgets en parallèle..." />
        </div>
      )}

      {result && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header row */}
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Résultats</h3>
            <p className="text-sm text-gray-500">{result.duration}j · {result.people} pers. · depuis {result.departureCity}</p>
          </div>

          {/* Comparison grid */}
          <div className={`grid gap-4 ${result.results.length === 2 ? 'md:grid-cols-2' : result.results.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
            {result.results.map((r, i) => {
              const isWinner = winners.total === i;
              if (!r.budget) {
                return (
                  <Card key={i} className="opacity-60">
                    <h4 className="font-bold text-gray-900 mb-2">{r.destination}</h4>
                    <p className="text-sm text-red-600">{r.error || 'Erreur'}</p>
                  </Card>
                );
              }
              const activitiesTotal = typeof r.budget.activities === 'object' ? r.budget.activities.total : r.budget.activities;
              const flightsTotal = r.budget.flights.avgPrice * result.people;
              return (
                <Card key={i} className={`relative ${isWinner ? 'ring-2 ring-emerald-400' : ''}`}>
                  {isWinner && (
                    <Badge variant="success" className="absolute -top-3 left-4">
                      <Crown className="h-3 w-3 inline mr-1" /> Moins cher
                    </Badge>
                  )}
                  <h4 className="font-display text-xl font-bold text-gray-900 mb-1">{r.destination}</h4>
                  <p className="font-display text-3xl font-bold text-primary-600 mb-4">{Math.round(r.budget.total).toLocaleString()}€</p>

                  <div className="space-y-2">
                    {CATEGORY_ICONS.map((cat) => {
                      const Icon = cat.icon;
                      const val = cat.key === 'flights' ? flightsTotal
                        : cat.key === 'accommodation' ? r.budget!.accommodation.total
                        : cat.key === 'food' ? r.budget!.food
                        : activitiesTotal;
                      const catWinner = winners[cat.key] === i;
                      return (
                        <div key={cat.key} className={`flex items-center justify-between p-2 rounded-lg ${catWinner ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            <span className="text-sm text-gray-700">{cat.label}</span>
                          </div>
                          <span className={`text-sm font-semibold ${catWinner ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {Math.round(val).toLocaleString()}€
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100">
                    <p className="text-xs text-primary-700 font-semibold mb-1">Fiabilité : {r.budget.confidence === 'high' ? 'haute' : r.budget.confidence === 'medium' ? 'moyenne' : 'approximative'}</p>
                    <p className="text-xs text-gray-600 line-clamp-3">{r.budget.summary}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
