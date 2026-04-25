import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Autocomplete from '../../components/Autocomplete';
import DateField from '../../components/DateField';
import { api } from '../../lib/api';
import type { CompareResponse, BudgetEstimate } from '@smartbudget/shared';
import { formatCurrency } from '@smartbudget/shared';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function CompareScreen() {
  const [departureCity, setDepartureCity] = useState('');
  const [destinations, setDestinations] = useState<string[]>(['', '']);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const updateDestination = (i: number, value: string) => {
    const next = [...destinations];
    next[i] = value;
    setDestinations(next);
  };

  const addDestination = () => {
    if (destinations.length < 4) setDestinations([...destinations, '']);
  };

  const removeDestination = (i: number) => {
    if (destinations.length <= 2) return;
    setDestinations(destinations.filter((_, idx) => idx !== i));
  };

  const handleCompare = async () => {
    setError(null);
    setResult(null);
    const cleaned = destinations.map(d => d.trim()).filter(d => d.length >= 2);
    if (cleaned.length < 2) {
      setError('Au moins 2 destinations requises');
      return;
    }
    if (!departureCity || !startDate || !endDate) {
      setError('Tous les champs sont requis');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('La date de retour doit être après la date de départ');
      return;
    }

    setLoading(true);
    try {
      const r = await api.compareDestinations({
        destinations: cleaned, departureCity, startDate, endDate, people,
      });
      setResult(r);
    } catch (e: any) {
      setError(e?.error || 'Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Comparer des destinations</Text>
          <Text style={styles.subtitle}>Compare jusqu&apos;à 4 destinations en parallèle.</Text>

          <Card style={styles.formCard}>
            <Autocomplete
              mode="airport"
              label="Ville de départ"
              placeholder="ex: Paris, Marseille"
              required
              value={departureCity}
              onChange={setDepartureCity}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <DateField label="Départ" required value={startDate} onChange={setStartDate} minDate={today} placeholder="Choisir" />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="Retour" required value={endDate} onChange={setEndDate} minDate={startDate ? new Date(startDate) : today} placeholder="Choisir" />
              </View>
            </View>

            <View style={styles.peopleRow}>
              <Text style={styles.peopleLabel}>Voyageurs</Text>
              <View style={styles.peopleControl}>
                <Pressable onPress={() => setPeople(Math.max(1, people - 1))} style={styles.peopleBtn}>
                  <Ionicons name="remove" size={20} color={colors.gray[700]} />
                </Pressable>
                <Text style={styles.peopleValue}>{people}</Text>
                <Pressable onPress={() => setPeople(Math.min(10, people + 1))} style={styles.peopleBtn}>
                  <Ionicons name="add" size={20} color={colors.gray[700]} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.destLabel}>Destinations à comparer</Text>
            {destinations.map((d, i) => (
              <View key={i} style={styles.destRow}>
                <View style={{ flex: 1 }}>
                  <Autocomplete
                    mode="destination"
                    placeholder={`Destination ${i + 1}`}
                    value={d}
                    onChange={(v) => updateDestination(i, v)}
                  />
                </View>
                {destinations.length > 2 && (
                  <Pressable onPress={() => removeDestination(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                  </Pressable>
                )}
              </View>
            ))}

            {destinations.length < 4 && (
              <Pressable onPress={addDestination} style={styles.addDestBtn}>
                <Ionicons name="add" size={18} color={colors.primary[700]} />
                <Text style={styles.addDestText}>Ajouter une destination</Text>
              </Pressable>
            )}

            {error && <Text style={styles.errorBox}>{error}</Text>}

            <Button onPress={handleCompare} loading={loading} fullWidth size="lg">
              <Ionicons name="git-compare-outline" size={18} color={colors.white} />
              {'  '}Comparer
            </Button>
          </Card>

          {result && <ComparatorResults result={result} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ComparatorResults({ result }: { result: CompareResponse }) {
  const validResults = result.results.filter(r => r.budget !== null);
  const cheapestTotal = validResults.length > 0
    ? Math.min(...validResults.map(r => r.budget!.total))
    : 0;

  return (
    <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <View>
        <Text style={styles.resultsTitle}>Résultats</Text>
        <Text style={styles.resultsMeta}>
          {result.duration}j · {result.people} pers · depuis {result.departureCity}
        </Text>
      </View>

      {result.results.map((r, idx) => (
        <DestinationResultCard
          key={idx}
          destination={r.destination}
          budget={r.budget}
          error={r.error}
          isCheapest={r.budget?.total === cheapestTotal}
          people={result.people}
          duration={result.duration}
        />
      ))}
    </View>
  );
}

function DestinationResultCard({ destination, budget, error, isCheapest, people, duration }: {
  destination: string;
  budget: BudgetEstimate | null;
  error: string | null;
  isCheapest: boolean;
  people: number;
  duration: number;
}) {
  if (error || !budget) {
    return (
      <Card>
        <Text style={styles.rowTitle}>{destination}</Text>
        <Text style={styles.errorText}>{error || 'Pas de données disponibles'}</Text>
      </Card>
    );
  }

  return (
    <Card style={isCheapest ? styles.winnerCard : undefined}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.destName}>{destination}</Text>
        {isCheapest && (
          <View style={styles.crownBadge}>
            <Ionicons name="trophy" size={12} color={colors.amber[500]} />
            <Text style={styles.crownText}>Le moins cher</Text>
          </View>
        )}
      </View>
      <Text style={styles.destTotal}>{formatCurrency(budget.total)}</Text>
      <Text style={styles.destPerPerson}>
        {formatCurrency(Math.round(budget.total / people))} / personne
      </Text>

      <View style={{ gap: 6, marginTop: spacing.md }}>
        <BreakdownLine icon="airplane" label="Vols (groupe)" value={budget.flights.avgPrice * people} />
        <BreakdownLine icon="bed" label={`Hébergement (${duration}n)`} value={budget.accommodation.total} />
        <BreakdownLine icon="restaurant-outline" label="Nourriture" value={budget.food} />
        <BreakdownLine icon="ticket-outline" label="Activités" value={budget.activities.total} />
      </View>

      {!!budget.summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>
            Fiabilité : {budget.confidence === 'high' ? 'Élevée' : budget.confidence === 'medium' ? 'Moyenne' : 'Approximative'}
          </Text>
          <Text style={styles.summaryText} numberOfLines={4}>{budget.summary}</Text>
        </View>
      )}
    </Card>
  );
}

function BreakdownLine({ icon, label, value }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={14} color={colors.gray[500]} />
      <Text style={[styles.lineLabel, { flex: 1 }]}>{label}</Text>
      <Text style={styles.lineValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.gray[900], marginBottom: 4 },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], marginBottom: spacing.lg },
  formCard: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  peopleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  peopleLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  peopleControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.gray[100], borderRadius: radius.lg, padding: 4 },
  peopleBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  peopleValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900], minWidth: 24, textAlign: 'center' },
  destLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[700], marginTop: spacing.sm },
  destRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  removeBtn: {
    padding: spacing.md,
    backgroundColor: colors.red[400] + '20',
    borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
  },
  addDestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.md,
    borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.primary[300], borderRadius: radius.xl,
  },
  addDestText: { fontSize: fontSize.sm, color: colors.primary[700], fontWeight: '600' },
  errorBox: { backgroundColor: '#FEE2E2', color: colors.red[600], padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm },

  resultsTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.gray[900] },
  resultsMeta: { fontSize: fontSize.sm, color: colors.gray[500] },
  winnerCard: { borderColor: colors.emerald[400], borderWidth: 2 },
  destName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  destTotal: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.primary[700], marginTop: 4 },
  destPerPerson: { fontSize: fontSize.sm, color: colors.gray[500] },
  crownBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amber[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  crownText: { fontSize: fontSize.xs, color: colors.amber[500], fontWeight: '700' },
  lineLabel: { fontSize: fontSize.sm, color: colors.gray[600] },
  lineValue: { fontSize: fontSize.sm, color: colors.gray[900], fontWeight: '700' },
  summaryBox: {
    backgroundColor: colors.sky[100] + '60',
    padding: spacing.md, borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  summaryLabel: { fontSize: fontSize.xs, color: colors.sky[600], fontWeight: '700' },
  summaryText: { fontSize: fontSize.sm, color: colors.gray[700], marginTop: 4, lineHeight: 18 },
  rowTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  errorText: { color: colors.red[500], marginTop: 4, fontSize: fontSize.sm },
});
