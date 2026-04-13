'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, TrendingUp } from 'lucide-react';
import { Simulation } from '@/types';
import { api } from '@/lib/api';
import Card from '@/components/atoms/Card';
import Loader from '@/components/atoms/Loader';
import Badge from '@/components/atoms/Badge';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPanel() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Simulations</p>
              <p className="text-2xl font-bold">{simulations.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget total simulé</p>
              <p className="text-2xl font-bold">{totalBudget.toLocaleString()}€</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent-50 text-accent-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <Badge variant={user?.isPremium ? 'premium' : 'default'}>
                {user?.isPremium ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Historique des simulations</h3>
        {simulations.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Aucune simulation pour le moment.</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre première simulation de budget !</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {simulations.map((sim, i) => {
              const budget = typeof sim.budget === 'number' ? sim.budget : sim.budget.total;
              return (
                <motion.div
                  key={sim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card hover className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{sim.destination}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" /> {sim.duration} jours
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" /> {sim.people} pers.
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">{budget.toLocaleString()}€</p>
                        <p className="text-xs text-gray-400">
                          {new Date(sim.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {sim.itinerary && (
                      <Badge variant="success" className="mt-3">Itinéraire généré</Badge>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
