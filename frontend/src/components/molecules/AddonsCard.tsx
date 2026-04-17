'use client';

import { motion } from 'framer-motion';
import { Check, ExternalLink, Plus, Sparkles } from 'lucide-react';
import { AddonOption, AddonCategory } from '@/types';
import Card from '@/components/atoms/Card';

interface AddonsCardProps {
  addons: AddonOption[];
  selectedIds: Set<string>;
  onToggle: (id: string, category: AddonCategory) => void;
}

const CATEGORY_META: Record<AddonCategory, { label: string; accent: string; bg: string; ring: string }> = {
  esim: { label: 'eSIM & data mobile', accent: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-500/40' },
  insurance: { label: 'Assurance voyage', accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-500/40' },
  transfer: { label: 'Transfert aéroport', accent: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-500/40' },
  fork: { label: 'Réservations restaurants', accent: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-500/40' },
};

export default function AddonsCard({ addons, selectedIds, onToggle }: AddonsCardProps) {
  if (!addons || addons.length === 0) return null;

  const grouped = addons.reduce<Record<AddonCategory, AddonOption[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a);
    return acc;
  }, {} as Record<AddonCategory, AddonOption[]>);

  const order: AddonCategory[] = ['esim', 'insurance', 'transfer', 'fork'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h4 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" /> Optimise ton voyage
          </h4>
          <span className="text-xs text-gray-400">
            {selectedIds.size > 0 ? `${selectedIds.size} option${selectedIds.size > 1 ? 's' : ''} ajoutée${selectedIds.size > 1 ? 's' : ''}` : 'Ajoute ce dont tu as besoin'}
          </span>
        </div>

        <div className="space-y-6">
          {order.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            const meta = CATEGORY_META[cat];
            const isSingleChoice = cat === 'esim' || cat === 'insurance';

            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className={`font-semibold text-sm ${meta.accent}`}>{meta.label}</h5>
                  {isSingleChoice && (
                    <span className="text-[10px] text-gray-400">Un seul choix</span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((addon) => {
                    const isSelected = selectedIds.has(addon.id);
                    const isFree = addon.price === 0;

                    return (
                      <div
                        key={addon.id}
                        onClick={() => !isFree && onToggle(addon.id, addon.category)}
                        className={`relative flex flex-col bg-white rounded-xl border overflow-hidden transition-all group ${
                          isFree ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isSelected
                            ? `border-transparent ring-2 ${meta.ring} shadow-lg`
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        {addon.recommended && !isSelected && (
                          <div className="absolute top-2 right-2 z-10 bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Recommandé
                          </div>
                        )}
                        {isSelected && (
                          <div className={`absolute top-2 right-2 z-10 ${meta.bg} ${meta.accent} rounded-full p-1 shadow-sm`}>
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-2xl leading-none">{addon.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-tight">{addon.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{addon.provider}</p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-600 leading-snug mb-3">{addon.description}</p>

                          {addon.features.length > 0 && (
                            <ul className="space-y-1 mb-3">
                              {addon.features.slice(0, 3).map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                                  <Check className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div>
                              {isFree ? (
                                <span className="text-xs text-gray-500">{addon.priceLabel || 'Inclus'}</span>
                              ) : (
                                <>
                                  <p className="font-bold text-sm text-gray-900">+{addon.price.toLocaleString()}€</p>
                                  {addon.priceLabel && (
                                    <p className="text-[10px] text-gray-400 leading-tight">{addon.priceLabel}</p>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={addon.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] font-semibold text-primary-500 hover:underline flex items-center gap-0.5"
                              >
                                Voir <ExternalLink className="h-3 w-3" />
                              </a>
                              {!isFree && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onToggle(addon.id, addon.category); }}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                                    isSelected
                                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                                      : 'bg-primary-500 text-white hover:bg-primary-600'
                                  }`}
                                >
                                  {isSelected ? 'Retirer' : <span className="flex items-center gap-0.5"><Plus className="h-3 w-3" />Ajouter</span>}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
