'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AiTipsResult, FlexibleDatesScanResponse } from '@/types';
import Card from '@/components/atoms/Card';
import { Sparkles, Lock, TrendingUp, TrendingDown, Minus, Calendar, Search, Loader2, TrendingUp as TrendUpIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface AiTipsCardProps {
  tips: AiTipsResult;
  simulationId?: string;
}

const outlookConfig = {
  rising: { icon: TrendingUp, color: 'text-red-600 bg-red-50', label: 'Prix en hausse' },
  stable: { icon: Minus, color: 'text-amber-600 bg-amber-50', label: 'Prix stables' },
  falling: { icon: TrendingDown, color: 'text-emerald-600 bg-emerald-50', label: 'Prix en baisse' },
};

export default function AiTipsCard({ tips, simulationId }: AiTipsCardProps) {
  const { user } = useAuth();
  const isPremium = user?.isPremium ?? false;
  const [scan, setScan] = useState<FlexibleDatesScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);

  const outlook = outlookConfig[tips.priceOutlook] || outlookConfig.stable;
  const OutlookIcon = outlook.icon;

  const handleScan = async () => {
    if (!simulationId) return;
    setScanning(true);
    try {
      const res = await api.scanFlexibleDates(simulationId);
      setScan(res);
      if (res.results.length === 0) {
        toast('Aucune date moins chère trouvée sur ±7 jours', { icon: '📅' });
      } else {
        toast.success(`${res.results.length} date${res.results.length > 1 ? 's' : ''} moins chère${res.results.length > 1 ? 's' : ''} trouvée${res.results.length > 1 ? 's' : ''}`);
      }
    } catch {
      toast.error('Impossible de scanner les dates');
    } finally {
      setScanning(false);
    }
  };

  const fmtDate = (iso: string) => {
    try {
      return format(new Date(iso), 'EEE d MMM', { locale: fr });
    } catch {
      return iso;
    }
  };

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

        {/* Flexible dates — real price scan */}
        {simulationId && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-500" />
                Dates alternatives moins chères
              </h4>
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center gap-1.5 transition-colors"
              >
                {scanning ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scan en cours…</>
                ) : (
                  <><Search className="h-3.5 w-3.5" /> {scan ? 'Relancer le scan' : 'Scanner ±7 jours (prix réels)'}</>
                )}
              </button>
            </div>

            {!scan && !scanning && tips.flexibleDates && tips.flexibleDates.length > 0 && (
              <>
                <p className="text-[11px] text-gray-400 mb-2">Estimations IA — cliquez pour comparer les vrais prix de vol jour par jour.</p>
                <div className="grid gap-2">
                  {tips.flexibleDates.map((fd, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-violet-50/50 border border-violet-100">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{fd.label}</p>
                        <p className="text-xs text-gray-500">{fd.startDate} → {fd.endDate}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">~-{fd.estimatedSaving}€</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {scan && (
              <>
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <TrendUpIcon className="h-3.5 w-3.5 text-emerald-500" />
                  Prix vol de référence : <span className="font-bold text-gray-900">{scan.basePricePerPerson}€/pers</span>
                  {scan.people > 1 && <span>· {scan.basePriceGroup}€ groupe</span>}
                </div>
                {scan.results.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
                    Les dates choisies sont déjà les moins chères dans une fenêtre de ±7 jours.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {scan.results.map((r) => {
                      const pct = Math.max(5, Math.min(100, r.savingPercent));
                      return (
                        <div key={r.offsetDays} className="p-3 rounded-xl bg-white border border-violet-100 hover:border-violet-300 transition-colors">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {r.label}
                                <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">{r.offsetDays > 0 ? '+' : ''}{r.offsetDays}j</span>
                              </p>
                              <p className="text-xs text-gray-500">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="text-sm font-bold text-gray-900">{r.pricePerPerson}€<span className="text-[10px] text-gray-400 font-normal">/pers</span></p>
                              <p className="text-[10px] text-gray-400">total {r.pricePerGroup}€</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">−{r.savingPerPerson}€/pers · −{r.savingPercent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-2">Source : {Array.from(new Set(scan.results.map(r => r.source))).join(', ') || 'aucune'} · scan {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
