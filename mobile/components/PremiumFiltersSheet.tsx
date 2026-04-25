import { useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PremiumFilters } from '@smartbudget/shared';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props {
  visible: boolean;
  initial?: PremiumFilters;
  onClose: () => void;
  onApply: (filters: PremiumFilters) => void;
}

const TRIP_STYLES: { value: NonNullable<PremiumFilters['tripStyle']>; label: string; emoji: string }[] = [
  { value: 'cultural', label: 'Culturel', emoji: '🏛️' },
  { value: 'adventure', label: 'Aventure', emoji: '🧗' },
  { value: 'romantic', label: 'Romantique', emoji: '💕' },
  { value: 'family', label: 'Famille', emoji: '👨‍👩‍👧' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🍸' },
  { value: 'wellness', label: 'Bien-être', emoji: '🧘' },
  { value: 'gastronomic', label: 'Gastronomie', emoji: '🍽️' },
];

const PACES: { value: NonNullable<PremiumFilters['tripPace']>; label: string }[] = [
  { value: 'relaxed', label: 'Tranquille' },
  { value: 'balanced', label: 'Équilibré' },
  { value: 'packed', label: 'Intense' },
];

const ACCO_TYPES: { value: NonNullable<PremiumFilters['accommodationType']>; label: string }[] = [
  { value: 'hostel', label: 'Auberge' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'bnb', label: 'B&B' },
  { value: 'hotel', label: 'Hôtel 3-4★' },
  { value: 'luxury', label: 'Luxe 5★' },
];

const FLIGHT_CLASSES: { value: NonNullable<PremiumFilters['flightClass']>; label: string }[] = [
  { value: 'economy', label: 'Éco' },
  { value: 'premium_economy', label: 'Premium' },
  { value: 'business', label: 'Affaires' },
  { value: 'first', label: 'Première' },
];

const TRANSPORTS: { value: NonNullable<PremiumFilters['transportPreference']>; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'car', label: 'Voiture', icon: 'car-outline' },
  { value: 'public', label: 'Transports', icon: 'subway-outline' },
  { value: 'mixed', label: 'Mixte', icon: 'options-outline' },
  { value: 'walk_bike', label: 'Marche/vélo', icon: 'bicycle-outline' },
];

const DIETARY: { value: 'vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'kosher'; label: string }[] = [
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Sans gluten' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Casher' },
];

const INTERESTS = ['culture', 'nature', 'plage', 'gastronomie', 'nightlife', 'shopping', 'sport', 'bien-être', 'photo', 'histoire'];

export default function PremiumFiltersSheet({ visible, initial = {}, onClose, onApply }: Props) {
  const [filters, setFilters] = useState<PremiumFilters>(initial);

  const update = <K extends keyof PremiumFilters>(key: K, value: PremiumFilters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const toggleInArray = <K extends 'dietaryPreferences' | 'interests'>(key: K, value: string) => {
    const current = (filters[key] as string[]) || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update(key, next as any);
  };

  const reset = () => setFilters({});

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="star" size={18} color={colors.amber[500]} />
              <Text style={styles.title}>Filtres Premium</Text>
            </View>
            <Pressable onPress={reset}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: spacing['2xl'] }} showsVerticalScrollIndicator={false}>
            <Group title="Style de voyage">
              <ChipsRow
                options={TRIP_STYLES}
                value={filters.tripStyle}
                onChange={(v: any) => update('tripStyle', v)}
                renderChip={(opt, active) => (
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && { color: colors.white }]}>{opt.emoji} {opt.label}</Text>
                  </View>
                )}
              />
            </Group>

            <Group title="Rythme">
              <SegmentRow
                options={PACES}
                value={filters.tripPace}
                onChange={(v: any) => update('tripPace', v)}
              />
            </Group>

            <Group title="Hébergement">
              <ChipsRow
                options={ACCO_TYPES}
                value={filters.accommodationType}
                onChange={(v: any) => update('accommodationType', v)}
                renderChip={(opt, active) => (
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && { color: colors.white }]}>{opt.label}</Text>
                  </View>
                )}
              />
              <View style={{ marginTop: 8 }}>
                <Text style={styles.fieldLabel}>Quartier souhaité (optionnel)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="ex: Shibuya, Trastevere..."
                  placeholderTextColor={colors.gray[400]}
                  value={filters.accommodationArea || ''}
                  onChangeText={(t) => update('accommodationArea', t)}
                />
              </View>
            </Group>

            <Group title="Vol">
              <ChipsRow
                options={FLIGHT_CLASSES}
                value={filters.flightClass}
                onChange={(v: any) => update('flightClass', v)}
                renderChip={(opt, active) => (
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && { color: colors.white }]}>{opt.label}</Text>
                  </View>
                )}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <Text style={styles.fieldLabel}>Vol direct uniquement</Text>
                <Toggle value={!!filters.directFlightOnly} onChange={(v) => update('directFlightOnly', v)} />
              </View>
            </Group>

            <Group title="Transport sur place">
              <ChipsRow
                options={TRANSPORTS}
                value={filters.transportPreference}
                onChange={(v: any) => update('transportPreference', v)}
                renderChip={(opt, active) => (
                  <View style={[styles.chip, active && styles.chipActive]}>
                    <Ionicons name={opt.icon} size={14} color={active ? colors.white : colors.gray[700]} />
                    <Text style={[styles.chipText, active && { color: colors.white }, { marginLeft: 4 }]}>{opt.label}</Text>
                  </View>
                )}
              />
            </Group>

            <Group title="Régime alimentaire">
              <View style={styles.chipsWrap}>
                {DIETARY.map(d => {
                  const active = (filters.dietaryPreferences || []).includes(d.value);
                  return (
                    <Pressable key={d.value} onPress={() => toggleInArray('dietaryPreferences', d.value)}>
                      <View style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && { color: colors.white }]}>{d.label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Group>

            <Group title="Centres d'intérêt">
              <View style={styles.chipsWrap}>
                {INTERESTS.map(i => {
                  const active = (filters.interests || []).includes(i);
                  return (
                    <Pressable key={i} onPress={() => toggleInArray('interests', i)}>
                      <View style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && { color: colors.white }]}>{i}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Group>

            <Group title="Particularités">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.fieldLabel}>Voyage avec enfants</Text>
                <Toggle value={!!filters.hasChildren} onChange={(v) => update('hasChildren', v)} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.fieldLabel}>Besoins d&apos;accessibilité</Text>
                <Toggle value={!!filters.hasAccessibilityNeeds} onChange={(v) => update('hasAccessibilityNeeds', v)} />
              </View>
            </Group>

            <Group title="Liste personnalisée">
              <Text style={styles.fieldLabel}>À voir absolument</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                multiline
                placeholder="ex: Tour Eiffel, restaurant La Mère Brazier..."
                placeholderTextColor={colors.gray[400]}
                value={filters.mustSeeList || ''}
                onChangeText={(t) => update('mustSeeList', t)}
              />
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>À éviter</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 60 }]}
                multiline
                placeholder="ex: foule, attractions touristiques..."
                placeholderTextColor={colors.gray[400]}
                value={filters.avoidList || ''}
                onChangeText={(t) => update('avoidList', t)}
              />
            </Group>
          </ScrollView>

          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Button onPress={onClose} variant="outline" fullWidth>Annuler</Button>
            </View>
            <View style={{ flex: 2 }}>
              <Button onPress={() => { onApply(filters); onClose(); }} fullWidth>Appliquer</Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Group({ title, children }: any) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChipsRow<T extends { value: any; label: string }>({
  options, value, onChange, renderChip,
}: {
  options: T[];
  value: any;
  onChange: (v: any) => void;
  renderChip: (opt: T, active: boolean) => React.ReactNode;
}) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(active ? undefined : opt.value)}>
            {renderChip(opt, active)}
          </Pressable>
        );
      })}
    </View>
  );
}

function SegmentRow<T extends { value: any; label: string }>({ options, value, onChange }: any) {
  return (
    <View style={styles.segment}>
      {options.map((opt: T) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(active ? undefined : opt.value)}
            style={[styles.segmentBtn, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && { color: colors.white }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
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

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.sand[50], borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray[300], alignSelf: 'center', marginBottom: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  resetText: { fontSize: fontSize.sm, color: colors.primary[700], fontWeight: '600' },
  group: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  groupTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  fieldLabel: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '600' },
  textInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: fontSize.sm, color: colors.gray[900], marginTop: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full },
  chipActive: { backgroundColor: colors.primary[700], borderColor: colors.primary[700] },
  chipText: { fontSize: fontSize.sm, color: colors.gray[700], fontWeight: '600' },
  segment: { flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.lg, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md },
  segmentActive: { backgroundColor: colors.primary[700] },
  segmentText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[700] },
  toggleBtn: { width: 46, height: 26, borderRadius: 13, padding: 2 },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  footer: { flexDirection: 'row', gap: 8, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100] },
});
