'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, Compass, Sun, Palmtree, Star, ChevronRight } from 'lucide-react';
import LandingLayout from '@/components/templates/LandingLayout';
import Button from '@/components/atoms/Button';

const destinations = [
  { name: 'Bali', emoji: '🌴', budget: '1 200€', days: '10 jours', color: 'from-emerald-400 to-teal-500' },
  { name: 'Tokyo', emoji: '🗼', budget: '2 100€', days: '7 jours', color: 'from-rose-400 to-pink-500' },
  { name: 'Marrakech', emoji: '🕌', budget: '650€', days: '5 jours', color: 'from-amber-400 to-orange-500' },
  { name: 'Islande', emoji: '🏔️', budget: '1 800€', days: '8 jours', color: 'from-sky-400 to-indigo-500' },
];

const steps = [
  { num: '01', title: 'Choisissez', desc: 'Entrez votre destination, durée et nombre de voyageurs.', icon: MapPin },
  { num: '02', title: 'Simulez', desc: 'Obtenez une estimation détaillée par catégorie en 2 secondes.', icon: Compass },
  { num: '03', title: 'Explorez', desc: 'Générez un itinéraire jour par jour avec notre IA.', icon: Sun },
];

export default function HomePage() {
  return (
    <LandingLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-primary-200/30 blob animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-200/20 blob" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-800 text-sm font-medium mb-8">
                <Palmtree className="h-4 w-4" />
                Votre prochain voyage commence ici
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Voyagez{' '}
                <span className="gradient-text italic">malin</span>,
                <br />
                pas cher.
              </h1>

              <p className="mt-8 text-lg text-gray-500 leading-relaxed max-w-lg">
                Simulez votre budget en un clic, découvrez un itinéraire sur-mesure
                généré par IA, et partez sans mauvaise surprise.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/simulation">
                  <Button size="lg">
                    Estimer mon budget <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="ghost" size="lg">
                    Découvrir les plans <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex -space-x-2">
                  {['🧑‍💼', '👩‍🎨', '🧑‍🍳', '👨‍✈️'].map((e, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base ring-2 ring-white">
                      {e}
                    </div>
                  ))}
                </div>
                <span>+2 400 voyageurs nous font confiance</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                {destinations.map((dest, i) => (
                  <motion.div
                    key={dest.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ y: -8, rotate: i % 2 === 0 ? 1 : -1 }}
                    className={`card-travel p-5 cursor-pointer group ${i === 0 ? 'mt-8' : ''} ${i === 3 ? 'mt-8' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${dest.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                      {dest.emoji}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{dest.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-400">{dest.days}</span>
                      <span className="text-sm font-bold text-primary-700">{dest.budget}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-gray-900">
              Simple comme <span className="gradient-text italic">bonjour</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-md mx-auto">
              Trois étapes pour transformer votre envie de voyage en plan concret.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative p-8 rounded-3xl bg-sand-50 border border-sand-200/50 group hover:bg-white hover:shadow-xl transition-all duration-500"
                >
                  <span className="text-6xl font-black text-primary-100 absolute top-4 right-6 group-hover:text-primary-200 transition-colors">
                    {step.num}
                  </span>
                  <div className="w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] gradient-primary p-12 sm:p-16 text-center text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blob" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blob" />
            <div className="relative z-10">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-300 text-amber-300" />
                ))}
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                Prêt à planifier le voyage
                <br />de vos rêves ?
              </h2>
              <p className="mt-4 text-white/70 text-lg max-w-lg mx-auto">
                Rejoignez des milliers de voyageurs qui économisent du temps et de l&apos;argent.
              </p>
              <div className="mt-8">
                <Link href="/register">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-800 hover:bg-gray-50 shadow-xl">
                    Commencer gratuitement <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </LandingLayout>
  );
}
