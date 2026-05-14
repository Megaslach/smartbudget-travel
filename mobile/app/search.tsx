import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Autocomplete from '../components/Autocomplete';
import DateField from '../components/DateField';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { colors, fontSize, radius, spacing } from '../lib/theme';

const TRIP_TYPES = [
  { value: 'couple',  label: 'En couple',   icon: 'heart-outline'        as const },
  { value: 'friends', label: 'Entre amis',  icon: 'people-outline'        as const },
  { value: 'family',  label: 'En famille',  icon: 'happy-outline'         as const },
  { value: 'solo',    label: 'Solo',        icon: 'person-outline'        as const },
];

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ destination?: string }>();
  const [destination, setDestination] = useState(params.destination || '');
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState(2);
  const [budget, setBudget] = useState(800);
  const [tripType, setTripType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const handleSubmit = async () => {
    setError(null);
    if (!destination || !departureCity || !startDate || !endDate) {
      setError('Tous les champs sont requis'); return;
    }
    if (new Date(endDate) <= new Date(startDate)) { setError('Retour après le départ'); return; }
    setLoading(true);
    try {
      const result = await api.simulate({ destination, departureCity, startDate, endDate, people });
      router.push(`/simulation/${result.simulation.id}` as any);
    } catch (err: any) {
      setError(err?.error || 'Erreur lors de la recherche');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.title}>Rechercher</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Autocomplete
              mode="destination"
              placeholder="Destination"
              value={destination}
              onChange={setDestination}
            />
            <Autocomplete
              mode="airport"
              placeholder="Ville de départ"
              value={departureCity}
              onChange={setDepartureCity}
            />

            <Card label="Dates du séjour">
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 6 }}>
                <View style={{ flex: 1 }}>
                  <DateField label="" value={startDate} onChange={setStartDate} minDate={today} placeholder="Départ" />
                </View>
                <View style={{ flex: 1 }}>
                  <DateField label="" value={endDate} onChange={setEndDate} minDate={startDate ? new Date(startDate) : today} placeholder="Retour" />
                </View>
              </View>
            </Card>

            <Card label="Voyageurs">
              <View style={styles.counterRow}>
                <Pressable onPress={() => setPeople(Math.max(1, people - 1))} style={styles.counterBtn}>
                  <Ionicons name="remove" size={18} color={colors.text.primary} />
                </Pressable>
                <Text style={styles.counterValue}>{people} adulte{people > 1 ? 's' : ''}</Text>
                <Pressable onPress={() => setPeople(Math.min(10, people + 1))} style={styles.counterBtn}>
                  <Ionicons name="add" size={18} color={colors.text.primary} />
                </Pressable>
              </View>
            </Card>

            <Card label="Budget souhaité" right={`${budget} €`}>
              <View style={styles.sliderContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingTop: 8 }}
                >
                  {[300, 500, 800, 1200, 2000, 3000, 5000].map((b) => (
                    <Pressable
                      key={b}
                      onPress={() => setBudget(b)}
                      style={[styles.budgetChip, budget === b && styles.budgetChipActive]}
                    >
                      <Text style={[styles.budgetChipText, budget === b && { color: colors.white }]}>{b}€</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </Card>

            <Card label="Type de voyage">
              <View style={styles.tripTypes}>
                {TRIP_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setTripType(tripType === t.value ? null : t.value)}
                    style={[styles.tripTypeBtn, tripType === t.value && styles.tripTypeBtnActive]}
                  >
                    <Ionicons name={t.icon} size={20} color={tripType === t.value ? colors.white : colors.text.secondary} />
                    <Text style={[styles.tripTypeLabel, tripType === t.value && { color: colors.white }]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button onPress={handleSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.md }}>
              Rechercher
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({ label, right, children }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label}</Text>
        {right && <Text style={styles.cardRight}>{right}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },

  card: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
  cardRight: { fontSize: fontSize.base, color: colors.primary[500], fontWeight: '700' },

  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  counterValue: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: '700' },

  sliderContainer: { marginTop: spacing.sm },
  budgetChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bgSubtle },
  budgetChipActive: { backgroundColor: colors.primary[500] },
  budgetChipText: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '700' },

  tripTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  tripTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.full, backgroundColor: colors.bgSubtle,
    flexBasis: '47%', flexGrow: 1, justifyContent: 'center',
  },
  tripTypeBtnActive: { backgroundColor: colors.primary[500] },
  tripTypeLabel: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '600' },

  errorText: { color: colors.red[400], fontSize: fontSize.sm, textAlign: 'center' },
});
