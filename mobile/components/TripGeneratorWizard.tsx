import { useState } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

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
  visible: boolean;
  onClose: () => void;
  onGenerate: (options: TripGeneratorOptions) => Promise<void>;
}

const STYLES = [
  { value: 'cultural',     label: 'Culturel',      emoji: '🏛️', desc: 'Musées, sites historiques' },
  { value: 'adventure',    label: 'Aventure',      emoji: '🧗', desc: 'Sport, sensations, nature' },
  { value: 'romantic',     label: 'Romantique',    emoji: '💕', desc: 'Couché de soleil, dîners' },
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
  { value: 'car',        label: 'Voiture',         icon: 'car-outline'      as const },
  { value: 'public',     label: 'Transports',      icon: 'subway-outline'    as const },
  { value: 'mixed',      label: 'Mixte',           icon: 'options-outline'   as const },
  { value: 'walk_bike',  label: 'Marche/vélo',     icon: 'bicycle-outline'   as const },
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

export default function TripGeneratorWizard({ visible, onClose, onGenerate }: Props) {
  const [step, setStep] = useState(0);
  const [opts, setOpts] = useState<TripGeneratorOptions>({});
  const [generating, setGenerating] = useState(false);

  const update = <K extends keyof TripGeneratorOptions>(k: K, v: TripGeneratorOptions[K]) =>
    setOpts((o) => ({ ...o, [k]: v }));

  const toggleInArray = (key: 'interests' | 'dietaryPreferences', value: string) => {
    const current = (opts[key] as string[]) || [];
    update(key, current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
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
  const skip = () => next();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.gray[500]} />
            </Pressable>
            <View style={styles.progress}>
              {Array.from({ length: STEPS_TOTAL }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === step ? styles.dotActive : (i < step ? styles.dotDone : null),
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepCounter}>{step + 1}/{STEPS_TOTAL}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {step === 0 && (
              <Step
                title="Quel style de voyage ?"
                desc="On adaptera les activités à ton ambiance préférée."
              >
                <View style={styles.cardsGrid}>
                  {STYLES.map((s) => {
                    const active = opts.tripStyle === s.value;
                    return (
                      <Pressable
                        key={s.value}
                        onPress={() => update('tripStyle', active ? undefined : s.value)}
                        style={[styles.bigCard, active && styles.bigCardActive]}
                      >
                        <Text style={styles.bigEmoji}>{s.emoji}</Text>
                        <Text style={[styles.bigLabel, active && { color: colors.white }]}>{s.label}</Text>
                        <Text style={[styles.bigDesc, active && { color: colors.primary[100] }]}>{s.desc}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Step>
            )}

            {step === 1 && (
              <Step
                title="À quel rythme ?"
                desc="Combien d'activités tu veux par jour."
              >
                <View style={{ gap: 10 }}>
                  {PACES.map((p) => {
                    const active = opts.tripPace === p.value;
                    return (
                      <Pressable
                        key={p.value}
                        onPress={() => update('tripPace', active ? undefined : p.value)}
                        style={[styles.row, active && styles.rowActive]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowLabel, active && { color: colors.white }]}>{p.label}</Text>
                          <Text style={[styles.rowDesc, active && { color: colors.primary[100] }]}>{p.desc}</Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={22} color={colors.white} />}
                      </Pressable>
                    );
                  })}
                </View>
              </Step>
            )}

            {step === 2 && (
              <Step title="Ton budget" desc="On adaptera les recommandations à ton niveau de dépense.">
                <View style={styles.cardsGridSmall}>
                  {BUDGET_LEVELS.map((b) => {
                    const active = opts.budgetLevel === b.value;
                    return (
                      <Pressable
                        key={b.value}
                        onPress={() => update('budgetLevel', active ? undefined : b.value)}
                        style={[styles.smallCard, active && styles.smallCardActive]}
                      >
                        <Text style={styles.bigEmoji}>{b.emoji}</Text>
                        <Text style={[styles.smallLabel, active && { color: colors.white }]}>{b.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Step>
            )}

            {step === 3 && (
              <Step title="Centres d'intérêt" desc="Sélectionne ce qui te fait vibrer (autant que tu veux).">
                <View style={styles.chipsWrap}>
                  {INTERESTS.map((i) => {
                    const active = (opts.interests || []).includes(i);
                    return (
                      <Pressable key={i} onPress={() => toggleInArray('interests', i)}>
                        <View style={[styles.chip, active && styles.chipActive]}>
                          <Text style={[styles.chipText, active && { color: colors.white }]}>{i}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </Step>
            )}

            {step === 4 && (
              <Step title="Transport sur place" desc="Comment tu préfères te déplacer ?">
                <View style={styles.cardsGridSmall}>
                  {TRANSPORTS.map((t) => {
                    const active = opts.transportPreference === t.value;
                    return (
                      <Pressable
                        key={t.value}
                        onPress={() => update('transportPreference', active ? undefined : t.value)}
                        style={[styles.smallCard, active && styles.smallCardActive]}
                      >
                        <Ionicons name={t.icon} size={26} color={active ? colors.white : colors.primary[700]} />
                        <Text style={[styles.smallLabel, active && { color: colors.white }]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Step>
            )}

            {step === 5 && (
              <Step title="Régime & particularités" desc="Pour qu'on filtre les restaurants et adapte les activités.">
                <Text style={styles.label}>Régime alimentaire</Text>
                <View style={styles.chipsWrap}>
                  {DIETARY.map((d) => {
                    const active = (opts.dietaryPreferences || []).includes(d.value);
                    return (
                      <Pressable key={d.value} onPress={() => toggleInArray('dietaryPreferences', d.value)}>
                        <View style={[styles.chip, active && styles.chipActive]}>
                          <Text style={[styles.chipText, active && { color: colors.white }]}>{d.label}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={[styles.toggleRow, { marginTop: spacing.lg }]}>
                  <Text style={styles.label}>Voyage avec enfants</Text>
                  <Toggle value={!!opts.hasChildren} onChange={(v) => update('hasChildren', v)} />
                </View>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Besoins d'accessibilité</Text>
                  <Toggle value={!!opts.hasAccessibilityNeeds} onChange={(v) => update('hasAccessibilityNeeds', v)} />
                </View>
              </Step>
            )}

            {step === 6 && (
              <Step title="Personnalisation" desc="Tu peux ajouter des indications spécifiques (optionnel).">
                <Text style={styles.label}>À voir absolument</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="ex: Tour Eiffel, restaurant La Mère Brazier..."
                  placeholderTextColor={colors.gray[400]}
                  value={opts.mustSeeList || ''}
                  onChangeText={(t) => update('mustSeeList', t)}
                />
                <Text style={[styles.label, { marginTop: spacing.md }]}>À éviter</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  placeholder="ex: foule, attractions touristiques..."
                  placeholderTextColor={colors.gray[400]}
                  value={opts.avoidList || ''}
                  onChangeText={(t) => update('avoidList', t)}
                />
              </Step>
            )}

            {step === STEPS_TOTAL && (
              <Step title="Tout est prêt 🎉" desc="On génère ton itinéraire jour par jour.">
                <View style={{ gap: 8 }}>
                  <Recap label="Style"      value={STYLES.find(s => s.value === opts.tripStyle)?.label} />
                  <Recap label="Rythme"     value={PACES.find(p => p.value === opts.tripPace)?.label} />
                  <Recap label="Budget"     value={BUDGET_LEVELS.find(b => b.value === opts.budgetLevel)?.label} />
                  <Recap label="Intérêts"   value={(opts.interests || []).join(', ')} />
                  <Recap label="Transport"  value={TRANSPORTS.find(t => t.value === opts.transportPreference)?.label} />
                  <Recap label="Régime"     value={(opts.dietaryPreferences || []).map(d => DIETARY.find(x => x.value === d)?.label).filter(Boolean).join(', ')} />
                  <Recap label="Avec enfants"        value={opts.hasChildren ? 'Oui' : undefined} />
                  <Recap label="Accessibilité"       value={opts.hasAccessibilityNeeds ? 'Oui' : undefined} />
                  <Recap label="À voir"     value={opts.mustSeeList} />
                  <Recap label="À éviter"   value={opts.avoidList} />
                </View>
              </Step>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 && step <= STEPS_TOTAL && (
              <View style={{ flex: 1 }}>
                <Button onPress={back} variant="outline" fullWidth>Précédent</Button>
              </View>
            )}
            {step < STEPS_TOTAL && (
              <>
                <View style={{ flex: 1 }}>
                  <Button onPress={skip} variant="ghost" fullWidth>Passer</Button>
                </View>
                <View style={{ flex: 2 }}>
                  <Button onPress={next} fullWidth>Suivant →</Button>
                </View>
              </>
            )}
            {step === STEPS_TOTAL && (
              <View style={{ flex: 2 }}>
                <Button onPress={handleGenerate} loading={generating} fullWidth>
                  <Ionicons name="sparkles" size={16} color={colors.white} />
                  {'  '}Générer mon itinéraire
                </Button>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Step({ title, desc, children }: any) {
  return (
    <View style={{ gap: spacing.md }}>
      <View>
        <Text style={styles.stepTitle}>{title}</Text>
        {desc && <Text style={styles.stepDesc}>{desc}</Text>}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.toggleBtn, value ? { backgroundColor: colors.primary[700] } : { backgroundColor: colors.gray[300] }]}
    >
      <View style={[styles.toggleKnob, value ? { alignSelf: 'flex-end' } : null]} />
    </Pressable>
  );
}

function Recap({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.sand[50], borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], height: '92%' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.gray[200] },
  dotActive: { backgroundColor: colors.primary[700] },
  dotDone: { backgroundColor: colors.primary[300] },
  stepCounter: { fontSize: fontSize.xs, color: colors.gray[500], fontWeight: '700', minWidth: 32, textAlign: 'right' },

  body: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  stepTitle: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.gray[900] },
  stepDesc: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 4, lineHeight: 20 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardsGridSmall: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bigCard: {
    flexBasis: '48%', flexGrow: 1,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: radius.xl, padding: spacing.md,
    alignItems: 'center', minHeight: 110, justifyContent: 'center', gap: 4,
  },
  bigCardActive: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  bigEmoji: { fontSize: 30, marginBottom: 4 },
  bigLabel: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  bigDesc: { fontSize: fontSize.xs, color: colors.gray[500], textAlign: 'center' },

  smallCard: {
    flexBasis: '48%', flexGrow: 1,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: radius.xl, padding: spacing.md,
    alignItems: 'center', minHeight: 90, justifyContent: 'center', gap: 6,
  },
  smallCardActive: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  smallLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[900] },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    padding: spacing.lg, borderRadius: radius.xl,
  },
  rowActive: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  rowLabel: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  rowDesc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  chipActive: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  chipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },

  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[700] },
  textArea: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    borderRadius: radius.lg, padding: spacing.md, fontSize: fontSize.sm,
    minHeight: 70, color: colors.gray[900], marginTop: 4,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleBtn: { width: 46, height: 26, borderRadius: 13, padding: 2 },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },

  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg, gap: 12 },
  recapLabel: { fontSize: fontSize.sm, color: colors.gray[500], fontWeight: '600' },
  recapValue: { flex: 1, fontSize: fontSize.sm, color: colors.gray[900], fontWeight: '700', textAlign: 'right' },

  footer: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.gray[100],
    backgroundColor: colors.white,
  },
});
