'use client';

import { motion } from 'framer-motion';
import { AiTipsResult } from '@/types';
import Card from '@/components/atoms/Card';
import { Sparkles, Lock, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface AiTipsCardProps {
  tips: AiTipsResult;
}

const outlookConfig = {
  rising: { icon: TrendingUp, color: 'text-red-600 bg-red-50', label: 'Prix en hausse' },
  stable: { icon: Minus, color: 'text-amber-600 bg-amber-50', label: 'Prix stables' },
  falling: { icon: TrendingDown, color: 'text-emerald-600 bg-emerald-50', label: 'Prix en baisse' },
};

export default function AiTipsCard({ tips }: AiTipsCardProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;

  const outlook = outlookConfig[tips.priceOutlook] || outlookConfig.stable;
  const OutlookIcon = outlook.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-violet-100">
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-gray-900">Conseils IA</h3>
            <p className="text-xs text-gray-400">Analyse intelligente de votre voyage</p>
          </div>
        </div>

        {/* Price outlook */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-gray-50">
          <div className={`p-2 rounded-lg ${outlook.color}`}>
            <OutlookIcon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{outlook.label}</p>
            <p className="text-xs text-gray-500">{tips.priceOutlookNote}</p>
          </div>
        </div>

        {/* Booking window */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-primary-50/50">
          <Calendar className="h-4 w-4 text-primary-600" />
          <p className="text-sm text-primary-800">{tips.bestBookingWindow}</p>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          {tips.tips.map((tip, i) => {
            const isLocked = tip.isPremium && !isPremium;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`relative p-3 rounded-xl border ${isLocked ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'}`}
              >
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl backdrop-blur-sm z-10">
                    <Link href="/pricing" className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                      <Lock className="h-4 w-4" />
                      Débloquer avec Premium
                    </Link>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-lg">{tip.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tip.description}</p>
                  </div>
                  {tip.potentialSaving && tip.potentialSaving > 0 && (
                    <span className="shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      -{tip.potentialSaving}€
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Flexible dates (premium) */}
        {tips.flexibleDates && tips.flexibleDates.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              Dates alternatives moins chères
            </h4>
            <div className="grid gap-2">
              {tips.flexibleDates.map((fd, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-violet-50/50 border border-violet-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fd.label}</p>
                    <p className="text-xs text-gray-500">{fd.startDate} → {fd.endDate}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">-{fd.estimatedSaving}€</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
