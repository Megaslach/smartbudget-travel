'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import PricingCard from '@/components/molecules/PricingCard';
import toast from 'react-hot-toast';

const FREE_FEATURES = [
  'Simulation de budget illimitée',
  'Suggestions de vols, hôtels & activités',
  'Liens de réservation directs (Booking, Skyscanner, GetYourGuide)',
  'Historique des simulations',
  '1 itinéraire IA par mois',
];

const PREMIUM_FEATURES = [
  'Tout le plan gratuit',
  'Itinéraires IA illimités avec filtres avancés',
  'Choix du quartier / type d\'hébergement / classe de vol',
  'Style de restauration + centres d\'intérêt personnalisés',
  'Budget max avec optimisation IA',
  'Alertes prix automatiques',
  'Export PDF de l\'itinéraire',
  'Comparateur de destinations',
];

export default function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<'oneshot' | 'annual' | null>(null);

  const handleFreeCta = () => {
    if (user) {
      router.push('/simulation');
    } else {
      router.push('/register');
    }
  };

  const handleCheckout = async (plan: 'oneshot' | 'annual') => {
    if (!user) {
      router.push('/register');
      return;
    }

    setLoadingPlan(plan);
    try {
      const { url } = await api.createCheckoutSession(plan);
      if (url) window.location.href = url;
    } catch {
      toast.error('Erreur lors de la redirection vers le paiement');
    } finally {
      setLoadingPlan(null);
    }
  };

  const isActivePremium = Boolean(user?.isPremium);
  const isAnnual = user?.premiumPlan === 'annual';

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      <PricingCard
        title="Gratuit"
        price="0€"
        subtitle="Pour découvrir l'outil"
        features={FREE_FEATURES}
        ctaLabel={user ? 'Commencer' : 'S\'inscrire'}
        onCtaClick={handleFreeCta}
      />

      <PricingCard
        title="Pro · 1 voyage"
        price="4,99€"
        subtitle="Accès premium pendant 30 jours"
        features={PREMIUM_FEATURES}
        ctaLabel={isActivePremium ? 'Déjà premium' : 'Débloquer pour 4,99€'}
        onCtaClick={() => handleCheckout('oneshot')}
        isLoading={loadingPlan === 'oneshot'}
        disabled={isActivePremium}
      />

      <PricingCard
        title="Pro · Annuel"
        price="29€"
        period="an"
        subtitle="Soit 2,42€/mois · voyageurs fréquents"
        badge="Meilleur prix"
        features={[...PREMIUM_FEATURES, 'Support prioritaire']}
        isPremium
        ctaLabel={isAnnual ? 'Abonnement actif' : 'Choisir l\'annuel'}
        onCtaClick={() => handleCheckout('annual')}
        isLoading={loadingPlan === 'annual'}
        disabled={isAnnual}
      />
    </div>
  );
}
