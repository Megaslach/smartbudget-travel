'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import PricingCard from '@/components/molecules/PricingCard';
import toast from 'react-hot-toast';

const FREE_FEATURES = [
  'Simulation de budget basique',
  'Suggestions de vols, hôtels & activités',
  'Liens de réservation Skyscanner, Booking, Airbnb',
  'Historique des simulations',
];

const PREMIUM_FEATURES = [
  'Tout le plan gratuit',
  'Choix du quartier / zone d\'hébergement',
  'Filtre type de logement (hôtel, Airbnb, auberge, luxe)',
  'Classe de vol (éco, business, première)',
  'Style de restauration personnalisé',
  'Centres d\'intérêt pour activités sur mesure',
  'Budget maximum avec optimisation IA',
  'Itinéraire IA jour par jour',
  'Export PDF de l\'itinéraire',
  'Support prioritaire',
];

export default function PricingSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleFreeCta = () => {
    if (user) {
      router.push('/simulation');
    } else {
      router.push('/register');
    }
  };

  const handlePremiumCta = async () => {
    if (!user) {
      router.push('/register');
      return;
    }

    if (user.isPremium) {
      toast.success('Vous êtes déjà premium !');
      router.push('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const { url } = await api.createCheckoutSession();
      if (url) window.location.href = url;
    } catch {
      toast.error('Erreur lors de la redirection vers le paiement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <PricingCard
        title="Gratuit"
        price="0€"
        features={FREE_FEATURES}
        ctaLabel={user ? 'Commencer' : 'S\'inscrire'}
        onCtaClick={handleFreeCta}
      />
      <PricingCard
        title="Premium"
        price="9.99€"
        period="mois"
        features={PREMIUM_FEATURES}
        isPremium
        ctaLabel={user?.isPremium ? 'Déjà premium' : 'Passer Premium'}
        onCtaClick={handlePremiumCta}
        isLoading={isLoading}
      />
    </div>
  );
}
