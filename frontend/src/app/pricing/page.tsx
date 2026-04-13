'use client';

import { motion } from 'framer-motion';
import LandingLayout from '@/components/templates/LandingLayout';
import PricingSection from '@/components/organisms/PricingSection';

export default function PricingPage() {
  return (
    <LandingLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900">
            Voyagez plus, <span className="gradient-text italic">dépensez mieux</span>
          </h1>
          <p className="text-gray-400 mt-4 text-lg max-w-lg mx-auto">
            Commencez gratuitement, débloquez l&apos;IA quand vous êtes prêt.
          </p>
        </motion.div>
        <PricingSection />
      </section>
    </LandingLayout>
  );
}
