'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Sparkles, TrendingUp, Compass } from 'lucide-react';

const STAGES = [
  { icon: Compass, label: 'On prépare la boussole…', sub: 'Identification des aéroports, analyse de la destination' },
  { icon: Plane, label: 'Recherche des vols réels…', sub: 'SerpApi, Amadeus, Kiwi — en parallèle' },
  { icon: Hotel, label: 'Comparaison des hôtels…', sub: 'Meilleurs quartiers, meilleurs prix/nuit' },
  { icon: TrendingUp, label: 'Calcul du budget total…', sub: 'Vols, hébergement, resto, transport, activités' },
  { icon: Sparkles, label: 'Conseils IA & itinéraire…', sub: 'Astuces économies et plan jour par jour' },
];

interface SimulationLoadingOverlayProps {
  open: boolean;
}

export default function SimulationLoadingOverlay({ open }: SimulationLoadingOverlayProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!open) {
      setStage(0);
      return;
    }
    const interval = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary-900/70 via-primary-800/60 to-accent-700/50 backdrop-blur-xl"
        >
          {/* Drifting blurred blobs for atmosphere */}
          <motion.div
            className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary-400/30 blur-3xl"
            animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent-400/30 blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative w-[92%] max-w-md rounded-3xl bg-white/95 backdrop-blur-sm shadow-2xl p-6 sm:p-8 overflow-hidden"
          >
            {/* Globe-like rotating gradient ring */}
            <div className="relative mx-auto w-36 h-36 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-500 via-accent-400 to-primary-700 opacity-90"
              />
              <div className="absolute inset-1.5 rounded-full bg-white" />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-full border-2 border-dashed border-primary-200"
              />

              {/* Plane orbiting */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <div className="absolute left-1/2 -translate-x-1/2 -top-1">
                  <div className="p-2 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg">
                    <Plane className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>

              {/* Center stage icon swap */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {STAGES.map((s, i) => {
                    if (i !== stage) return null;
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.4, opacity: 0, rotate: 20 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 220 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 text-primary-700 shadow-sm"
                      >
                        <Icon className="h-7 w-7" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Current stage text */}
            <div className="text-center min-h-[60px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <h3 className="font-display text-lg font-bold text-gray-900">{STAGES[stage].label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{STAGES[stage].sub}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Stage pips */}
            <div className="flex justify-center gap-2 mt-6">
              {STAGES.map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    width: i === stage ? 28 : 8,
                    backgroundColor: i <= stage ? '#2a6f97' : '#e5e7eb',
                  }}
                  transition={{ duration: 0.35 }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-1 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 via-accent-400 to-primary-700"
                initial={{ width: '0%' }}
                animate={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
