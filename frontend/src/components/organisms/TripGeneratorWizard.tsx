'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Car, Train, Bike, Shuffle, Check } from 'lucide-react';
import Button from '@/components/atoms/Button';

export type TripGeneratorOptions = {
  activitiesPerDay?: number;
  tripPace?: 'relaxed' | 'balanced' | 'packed';
  tripStyle?: 'cultural' | 'adventure' | 'romantic' | 'family' | 'nightlife' | 'wellness' | 'gastronomic';
  interests?: string[];
  hasChildren?: boolean;
  hasAccessibilityNeeds?: boolean;
  dietaryPreferences?: string[];
  transportPreference?: 'car' | 'public' | 'mixed' | 'walk_bike';
  budgetLevel?: 'budget' | 'moderate' | 'premium' | 'luxury';
  avoidList?: string;
  mustSeeList?: string;
};

interface Props {
  open: boolean;
  destination: string;
  onClose: () => void;
  onGenerate: (options: TripGeneratorOptions) => Promise<void>;
}

const STYLES = [
  { value: 'cultural',     label: 'Culturel',      emoji: '🏛️', desc: 'Musées, sites historiques' },
  { value: 'adventure',    label: 'Aventure',      emoji: '🧗', desc: 'Sport, sensations, nature' },
  { value: 'romantic',     label: 'Romantique',    emoji: '💕', desc: 'Coucher de soleil, dîners' },
  { value: 'family',       label: 'Famille',       emoji: '👨‍👩‍👧', desc: 'Activités enfants-friendly' },
  { value: 'nightlife',    label: 'Nightlife',     emoji: '🍸', desc: 'Bars, clubs, soirées' },
  { value: 'wellness',     label: 'Bien-être',     emoji: '🧘', desc: 'Spa, yoga, déconnexion' },
  { value: 'gastronomic',  label: 'Gastronomie',   emoji: '🍽️', desc: 'Restos, food tours' },
] as const;

const PACES = [
  { value: 'relaxed',  label: 'Tranquille',  desc: '2-3 activités/jour' },
  { value: 'balanced', label: 'Équilibré',   desc: '3-4 activités/jour' },
  { value: 'packed',   label: 'Intense',     desc: '5+ activités/jour' },
] as const;

const TRANSPORTS = [
  { value: 'car',        label: 'Voiture',      Icon: Car      },
  { value: 'public',     label: 'Transports',   Icon: Train    },
  { value: 'mixed',      label: 'Mixte',        Icon: Shuffle  },
  { value: 'walk_bike',  label: 'Marche/vélo',  Icon: Bike     },
] as const;

const BUDGET_LEVELS = [
  { value: 'budget',   label: 'Économique',  emoji: '💰' },
  { value: 'moderate', label: 'Confort',     emoji: '💳' },
  { value: 'premium',  label: 'Premium',     emoji: '✨' },
  { value: 'luxury',   label: 'Luxe',        emoji: '👑' },
] as const;

const DIETARY = [
  { value: 'vegetarian',  label: 'Végétarien' },
  { value: 'vegan',       label: 'Vegan' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'halal',       label: 'Halal' },
  { value: 'kosher',      label: 'Casher' },
];

const INTERESTS = ['culture', 'nature', 'plage', 'gastronomie', 'nightlife', 'shopping', 'sport', 'bien-être', 'photo', 'histoire'];

const STEPS_TOTAL = 7;

export default function TripGeneratorWizard({ open, destination, onClose, onGenerate }: Props) {
  const [step, setStep] = useState(0);
  const [opts, setOpts] = useState<TripGeneratorOptions>({});
  const [generating, setGenerating] = useState(false);

  const update = <K extends keyof TripGeneratorOptions>(k: K, v: TripGeneratorOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const toggleInArray = (key: 'interests' | 'dietaryPreferences', value: string) => {
    const current = (opts[key] as string[]) || [];
    update(key, (current.includes(value) ? current.filter((x) => x !== value) : [...current, value]) as any);
  };

  const handleClose = () => {
    setStep(0);
    setOpts({});
    onClose();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate(opts);
      handleClose();
    } finally {
      setGenerating(false);
    }
  };

  const next = () => setStep((s) => Math.min(STEPS_TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="bg-sand-50 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col h-[92vh] sm:max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors ${
                      i === step ? 'bg-primary-700' : i < step ? 'bg-primary-300' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-500 min-w-[2.5rem] text-right">{step + 1}/{STEPS_TOTAL}</span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {step === 0 && (
                    <Section title="Quel style de voyage ?" desc={`On adaptera ton itinéraire à ${destination}.`}>
                      <div className="grid grid-cols-2 gap-3">
                        {STYLES.map((s) => (
                          <BigCard
                            key={s.value}
                            active={opts.tripStyle === s.value}
                            onClick={() => update('tripStyle', opts.tripStyle === s.value ? undefined : s.value)}
                          >
                            <div className="text-3xl">{s.emoji}</div>
                            <div className="font-bold mt-2">{s.label}</div>
                            <div className="text-xs opacity-80 mt-1">{s.desc}</div>
                          </BigCard>
                        ))}
                      </div>
                    </Section>
                  )}

                  {step === 1 && (
                    <Section title="À quel rythme ?" desc="Combien d'activités tu veux par jour.">
                      <div className="space-y-2">
                        {PACES.map((p) => {
                          const active = opts.tripPace === p.value;
                          return (
                            <button
                              key={p.value}
                              onClick={() => update('tripPace', active ? undefined : p.value)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                active
                                  ? 'bg-primary-700 border-primary-700 text-white'
                                  : 'bg-white border-gray-200 text-gray-900 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-bold">{p.label}</div>
                                <div className={`text-xs mt-0.5 ${active ? 'text-primary-100' : 'text-gray-500'}`}>{p.desc}</div>
                              </div>
                              {active && <Check className="h-5 w-5" />}
                            </button>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {step === 2 && (
                    <Section title="Ton budget" desc="On adaptera les recommandations à ton niveau de dépense.">
                      <div className="grid grid-cols-2 gap-3">
                        {BUDGET_LEVELS.map((b) => (
                          <BigCard
                            key={b.value}
                            active={opts.budgetLevel === b.value}
                            onClick={() => update('budgetLevel', opts.budgetLevel === b.value ? undefined : b.value)}
                          >
                            <div className="text-3xl">{b.emoji}</div>
                            <div className="font-bold mt-2">{b.label}</div>
                          </BigCard>
                        ))}
                      </div>
                    </Section>
                  )}

                  {step === 3 && (
                    <Section title="Centres d'intérêt" desc="Sélectionne ce qui te fait vibrer (autant que tu veux).">
                      <div className="flex flex-wrap gap-2">
                        {INTERESTS.map((i) => {
                          const active = (opts.interests || []).includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleInArray('interests', i)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                active
                                  ? 'bg-primary-700 text-white'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {step === 4 && (
                    <Section title="Transport sur place" desc="Comment tu préfères te déplacer ?">
                      <div className="grid grid-cols-2 gap-3">
                        {TRANSPORTS.map((t) => {
                          const active = opts.transportPreference === t.value;
                          return (
                            <BigCard
                              key={t.value}
                              active={active}
                              onClick={() => update('transportPreference', active ? undefined : t.value)}
                            >
                              <t.Icon className="h-7 w-7" />
                              <div className="font-bold mt-2">{t.label}</div>
                            </BigCard>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {step === 5 && (
                    <Section title="Régime & particularités" desc="Pour qu'on filtre les restaurants et adapte les activités.">
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Régime alimentaire</div>
                        <div className="flex flex-wrap gap-2">
                          {DIETARY.map((d) => {
                            const active = (opts.dietaryPreferences || []).includes(d.value);
                            return (
                              <button
                                key={d.value}
                                onClick={() => toggleInArray('dietaryPreferences', d.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                  active
                                    ? 'bg-primary-700 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <ToggleRow
                        label="Voyage avec enfants"
                        value={!!opts.hasChildren}
                        onChange={(v) => update('hasChildren', v)}
                      />
                      <ToggleRow
                        label="Besoins d'accessibilité"
                        value={!!opts.hasAccessibilityNeeds}
                        onChange={(v) => update('hasAccessibilityNeeds', v)}
                      />
                    </Section>
                  )}

                  {step === 6 && (
                    <Section title="Personnalisation" desc="Tu peux ajouter des indications spécifiques (optionnel).">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">À voir absolument</label>
                        <textarea
                          value={opts.mustSeeList || ''}
                          onChange={(e) => update('mustSeeList', e.target.value)}
                          placeholder="ex: Tour Eiffel, restaurant La Mère Brazier..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">À éviter</label>
                        <textarea
                          value={opts.avoidList || ''}
                          onChange={(e) => update('avoidList', e.target.value)}
                          placeholder="ex: foule, attractions touristiques..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                          rows={3}
                        />
                      </div>
                    </Section>
                  )}

                  {step === STEPS_TOTAL && (
                    <Section title="Tout est prêt 🎉" desc="On génère ton itinéraire jour par jour.">
                      <div className="space-y-2">
                        <Recap label="Style" value={STYLES.find(s => s.value === opts.tripStyle)?.label} />
                        <Recap label="Rythme" value={PACES.find(p => p.value === opts.tripPace)?.label} />
                        <Recap label="Budget" value={BUDGET_LEVELS.find(b => b.value === opts.budgetLevel)?.label} />
                        <Recap label="Intérêts" value={(opts.interests || []).join(', ')} />
                        <Recap label="Transport" value={TRANSPORTS.find(t => t.value === opts.transportPreference)?.label} />
                        <Recap label="Régime" value={(opts.dietaryPreferences || []).map(d => DIETARY.find(x => x.value === d)?.label).filter(Boolean).join(', ')} />
                        <Recap label="Avec enfants" value={opts.hasChildren ? 'Oui' : undefined} />
                        <Recap label="Accessibilité" value={opts.hasAccessibilityNeeds ? 'Oui' : undefined} />
                        <Recap label="À voir" value={opts.mustSeeList} />
                        <Recap label="À éviter" value={opts.avoidList} />
                      </div>
                    </Section>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-white">
              {step > 0 && (
                <Button onClick={back} variant="outline" className="flex-1">
                  <ChevronLeft className="h-4 w-4" /> Précédent
                </Button>
              )}
              {step < STEPS_TOTAL && (
                <>
                  <Button onClick={next} variant="ghost" className="flex-1">Passer</Button>
                  <Button onClick={next} className="flex-[2]">
                    Suivant <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {step === STEPS_TOTAL && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-[2]"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? 'Génération...' : 'Générer mon itinéraire'}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, desc, children }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-gray-900">{title}</h2>
        {desc && <p className="text-sm text-gray-500 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function BigCard({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all text-center min-h-[120px] flex flex-col items-center justify-center ${
        active ? 'bg-primary-700 border-primary-700 text-white' : 'bg-white border-gray-200 text-gray-900 hover:border-primary-300'
      }`}
    >
      {children}
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full p-0.5 transition-colors ${value ? 'bg-primary-700' : 'bg-gray-300'}`}
      >
        <div className={`w-6 h-6 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function Recap({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
      <div className="text-sm text-gray-500 font-medium min-w-[5.5rem]">{label}</div>
      <div className="text-sm text-gray-900 font-semibold flex-1 text-right">{value}</div>
    </div>
  );
}
