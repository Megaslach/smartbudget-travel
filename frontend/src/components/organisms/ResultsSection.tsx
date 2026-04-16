'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock, ChevronDown, ChevronUp, Baby, Accessibility, MapPin, Ban } from 'lucide-react';
import { BudgetEstimate, Itinerary, AiTipsResult } from '@/types';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import BudgetResultCard from '@/components/molecules/BudgetResultCard';
import AiTipsCard from '@/components/molecules/AiTipsCard';
import ItineraryCard from '@/components/molecules/ItineraryCard';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ResultsSectionProps {
  simulationId: string;
  budget: BudgetEstimate;
  destination: string;
  duration: number;
  people: number;
  aiTips?: AiTipsResult;
}

const TRIP_STYLES = [
  { value: 'cultural', label: '🏛️ Culturel' },
  { value: 'adventure', label: '🏔️ Aventure' },
  { value: 'romantic', label: '💕 Romantique' },
  { value: 'family', label: '👨‍👩‍👧 Famille' },
  { value: 'nightlife', label: '🎉 Festif' },
  { value: 'wellness', label: '🧘 Bien-être' },
  { value: 'gastronomic', label: '🍽️ Gastro' },
] as const;

const INTERESTS = [
  'Musées', 'Plages', 'Randonnée', 'Shopping', 'Photographie',
  'Architecture', 'Street art', 'Marchés locaux', 'Vie nocturne', 'Nature',
  'Sport', 'Histoire', 'Gastronomie', 'Vignobles', 'Temples',
];

export default function ResultsSection({ simulationId, budget, destination, duration, people, aiTips }: ResultsSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const [activitiesPerDay, setActivitiesPerDay] = useState(3);
  const [tripPace, setTripPace] = useState<'relaxed' | 'balanced' | 'packed'>('balanced');
  const [tripStyle, setTripStyle] = useState<typeof TRIP_STYLES[number]['value'] | undefined>();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<'budget' | 'moderate' | 'premium' | 'luxury'>('moderate');
  const [transportPref, setTransportPref] = useState<'car' | 'public' | 'mixed' | 'walk_bike'>('mixed');
  const [hasChildren, setHasChildren] = useState(false);
  const [hasAccessibility, setHasAccessibility] = useState(false);
  const [mustSee, setMustSee] = useState('');
  const [avoidList, setAvoidList] = useState('');

  const toggleInterest = (i: string) => {
    setSelectedInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleGenerateTrip = async () => {
    if (!user?.isPremium) {
      toast.error('Fonctionnalité premium requise');
      router.push('/pricing');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await api.generateTrip(simulationId, {
        activitiesPerDay,
        tripPace,
        tripStyle,
        interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        hasChildren: hasChildren || undefined,
        hasAccessibilityNeeds: hasAccessibility || undefined,
        transportPreference: transportPref,
        budgetLevel,
        avoidList: avoidList.trim() || undefined,
        mustSeeList: mustSee.trim() || undefined,
      });
      setItinerary(data.itinerary);
      toast.success('Itinéraire généré avec succès !');
    } catch {
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <BudgetResultCard budget={budget} destination={destination} duration={duration} people={people} />

      {aiTips && <AiTipsCard tips={aiTips} simulationId={simulationId} />}

      <div>
        {!itinerary && !isGenerating && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Itinéraire IA personnalisé</h3>
              <p className="text-gray-500">Configurez votre itinéraire jour par jour pour {destination}</p>
            </div>

            {/* Activities per day */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activités par jour
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setActivitiesPerDay(n)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activitiesPerDay === n
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activitiesPerDay <= 2 ? 'Tranquille — temps libre pour explorer' : activitiesPerDay <= 3 ? 'Équilibré — idéal pour la plupart' : 'Intensif — journées bien remplies'}
              </p>
            </div>

            {/* Trip Pace */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rythme du voyage</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'relaxed', label: '🌴 Détendu', desc: 'Repos & découverte' },
                  { value: 'balanced', label: '⚖️ Équilibré', desc: 'Mix idéal' },
                  { value: 'packed', label: '⚡ Intensif', desc: 'Tout voir' },
                ] as const).map(p => (
                  <button
                    key={p.value}
                    onClick={() => setTripPace(p.value)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      tripPace === p.value
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg">{p.label.split(' ')[0]}</div>
                    <div className="text-xs font-medium">{p.label.split(' ')[1]}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Style */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Style de voyage</label>
              <div className="flex flex-wrap gap-2">
                {TRIP_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setTripStyle(tripStyle === s.value ? undefined : s.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      tripStyle === s.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau de budget activités</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'budget', label: '💰', desc: 'Éco' },
                  { value: 'moderate', label: '💳', desc: 'Modéré' },
                  { value: 'premium', label: '💎', desc: 'Premium' },
                  { value: 'luxury', label: '👑', desc: 'Luxe' },
                ] as const).map(b => (
                  <button
                    key={b.value}
                    onClick={() => setBudgetLevel(b.value)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      budgetLevel === b.value
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-lg">{b.label}</div>
                    <div className="text-xs font-medium text-gray-600">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced options toggle */}
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              {showOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showOptions ? 'Masquer les options avancées' : 'Plus d\'options'}
            </button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Interests */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Centres d&apos;intérêt</label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map(i => (
                        <button
                          key={i}
                          onClick={() => toggleInterest(i)}
                          className={`px-3 py-1 rounded-full text-xs transition-all ${
                            selectedInterests.includes(i)
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transport */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Déplacements préférés</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { value: 'walk_bike', label: '🚶 À pied' },
                        { value: 'public', label: '🚇 Transport' },
                        { value: 'mixed', label: '🔄 Mixte' },
                        { value: 'car', label: '🚗 Voiture' },
                      ] as const).map(t => (
                        <button
                          key={t.value}
                          onClick={() => setTransportPref(t.value)}
                          className={`p-2 rounded-lg text-center text-xs transition-all ${
                            transportPref === t.value
                              ? 'bg-blue-50 border-2 border-blue-500 font-medium'
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={hasChildren} onChange={e => setHasChildren(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                      <Baby className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Avec enfants</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={hasAccessibility} onChange={e => setHasAccessibility(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                      <Accessibility className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Accessibilité PMR</span>
                    </label>
                  </div>

                  {/* Must See / Avoid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <MapPin className="h-4 w-4 text-green-500" /> À voir absolument
                      </label>
                      <input
                        type="text"
                        value={mustSee}
                        onChange={e => setMustSee(e.target.value)}
                        placeholder="Ex: Sagrada Familia, Park Güell..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                        <Ban className="h-4 w-4 text-red-400" /> À éviter
                      </label>
                      <input
                        type="text"
                        value={avoidList}
                        onChange={e => setAvoidList(e.target.value)}
                        placeholder="Ex: quartiers touristiques, musées..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate button */}
            <div className="pt-2">
              <Button onClick={handleGenerateTrip} size="lg" variant={user?.isPremium ? 'primary' : 'outline'} className="w-full">
                {user?.isPremium ? (
                  <><Sparkles className="h-5 w-5" /> Générer mon itinéraire sur mesure</>
                ) : (
                  <><Lock className="h-5 w-5" /> Débloquer l&apos;itinéraire (Premium)</>
                )}
              </Button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="py-12 text-center">
            <Loader size="lg" text={`L'IA génère votre itinéraire ${duration}j × ${activitiesPerDay} activités...`} />
          </div>
        )}
      </div>

      {itinerary && <ItineraryCard itinerary={itinerary} />}
    </motion.div>
  );
}
