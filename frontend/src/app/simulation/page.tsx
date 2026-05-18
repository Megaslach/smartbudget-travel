'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/templates/DashboardLayout';
import SimulationForm from '@/components/organisms/SimulationForm';
import ResultsSection from '@/components/organisms/ResultsSection';
import SimulationLoadingOverlay from '@/components/molecules/SimulationLoadingOverlay';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { BudgetEstimate, AiTipsResult } from '@/types';
import toast from 'react-hot-toast';

interface SimulationResult {
  id: string;
  budget: BudgetEstimate;
  destination: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  duration: number;
  people: number;
  aiTips?: AiTipsResult;
}

function SimulationContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDestination = searchParams.get('destination') ?? undefined;
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  const handleSimulate = async (data: {
    destination: string;
    departureCity: string;
    startDate: string;
    endDate: string;
    people: number;
    stops?: { name: string }[];
    hostStay?: boolean;
    searchRadiusKm?: number;
    premiumFilters?: import('@/types').PremiumFilters;
  }) => {
    setIsSimulating(true);
    try {
      const response = await api.simulate(data);
      setResult({
        id: response.simulation.id,
        budget: response.simulation.budget,
        destination: response.simulation.destination,
        departureCity: response.simulation.departureCity,
        startDate: response.simulation.startDate,
        endDate: response.simulation.endDate,
        duration: response.simulation.duration,
        people: response.simulation.people,
        aiTips: response.simulation.aiTips,
      });
      toast.success('Simulation terminée !');
    } catch (err: any) {
      toast.error(err?.error || 'Erreur lors de la simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <DashboardLayout title="Simulation de budget" description="Estimez le coût de votre prochain voyage">
      <SimulationLoadingOverlay open={isSimulating} />
      <div className="max-w-2xl mx-auto space-y-10">
        <SimulationForm onSubmit={handleSimulate} isLoading={isSimulating} initialDestination={initialDestination} />
        {result && (
          <ResultsSection
            simulationId={result.id}
            budget={result.budget}
            destination={result.destination}
            duration={result.duration}
            people={result.people}
            aiTips={result.aiTips}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>}>
      <SimulationContent />
    </Suspense>
  );
}
