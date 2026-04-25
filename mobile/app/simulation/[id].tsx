import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import type { Simulation, BudgetEstimate, FlightOption, HotelOption } from '@smartbudget/shared';
import { formatCurrency, formatShortDate } from '@smartbudget/shared';
import Card from '../../components/Card';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function SimulationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getSimulationDetail(id)
      .then(({ simulation }) => setSim(simulation))
      .catch((e) => setError(e?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [id]);

  const budget: BudgetEstimate | null = sim?.budgetData || (typeof sim?.budget === 'object' ? sim.budget as BudgetEstimate : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: sim?.destination || 'Voyage' }} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary[700]} /></View>
      ) : error || !sim ? (
        <View style={styles.center}><Text style={{ color: colors.red[500] }}>{error || 'Voyage introuvable'}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.dest}>{sim.destination}</Text>
            <Text style={styles.meta}>
              {formatShortDate(sim.startDate)} → {formatShortDate(sim.endDate)} · {sim.duration} jours · {sim.people} pers
            </Text>
          </View>

          {budget && (
            <>
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Budget total estimé</Text>
                <Text style={styles.totalValue}>{formatCurrency(budget.total)}</Text>
                <Text style={styles.totalPerPerson}>
                  {formatCurrency(Math.round(budget.total / sim.people))} / personne
                </Text>
                <ConfidenceBadge confidence={budget.confidence} />
              </Card>

              {budget.flights?.options?.length > 0 && (
                <Section title="Vols" icon="airplane">
                  {budget.flights.options.slice(0, 3).map((f, i) => <FlightRow key={i} flight={f} people={sim.people} />)}
                </Section>
              )}

              {budget.accommodation?.options?.length > 0 && (
                <Section title="Hébergement" icon="bed">
                  {budget.accommodation.options.slice(0, 3).map((h, i) => <HotelRow key={i} hotel={h} duration={sim.duration} />)}
                </Section>
              )}

              <Section title="Autres postes" icon="wallet">
                <BreakdownRow label="🍽 Nourriture" value={budget.food} />
                <BreakdownRow label="🚗 Transport sur place" value={budget.transport} />
                <BreakdownRow label="🎭 Activités" value={budget.activities.total} />
              </Section>

              {budget.summary && (
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Résumé IA</Text>
                  <Text style={styles.summaryText}>{budget.summary}</Text>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const map = {
    high: { label: 'Précision élevée', color: colors.emerald[500], bg: '#D1FAE5' },
    medium: { label: 'Précision moyenne', color: colors.amber[500], bg: colors.amber[100] },
    low: { label: 'Estimation IA', color: colors.gray[500], bg: colors.gray[100] },
  }[confidence];
  return (
    <View style={[styles.confBadge, { backgroundColor: map.bg }]}>
      <Text style={[styles.confText, { color: map.color }]}>{map.label}</Text>
    </View>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.primary[700]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function FlightRow({ flight, people }: { flight: FlightOption; people: number }) {
  return (
    <Pressable onPress={() => flight.bookingUrl && Linking.openURL(flight.bookingUrl)}>
      <Card style={styles.flightCard}>
        <View style={styles.flightIcon}>
          <Ionicons name="airplane" size={18} color={colors.sky[600]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{flight.airline}</Text>
          <Text style={styles.itemMeta}>{flight.type}{flight.duration ? ` · ${flight.duration}` : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.itemPrice}>{formatCurrency(flight.price)}</Text>
          {people > 1 && <Text style={styles.itemSub}>× {people}</Text>}
        </View>
      </Card>
    </Pressable>
  );
}

function HotelRow({ hotel, duration }: { hotel: HotelOption; duration: number }) {
  return (
    <Pressable onPress={() => hotel.bookingUrl && Linking.openURL(hotel.bookingUrl)}>
      <Card style={styles.flightCard}>
        <View style={[styles.flightIcon, { backgroundColor: colors.indigo[100] }]}>
          <Ionicons name="bed" size={18} color={colors.indigo[600]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{hotel.name}</Text>
          <Text style={styles.itemMeta}>
            {hotel.type}{hotel.rating ? ` · ★ ${hotel.rating}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.itemPrice}>{formatCurrency(hotel.pricePerNight)}<Text style={styles.itemSub}>/nuit</Text></Text>
          <Text style={styles.itemSub}>{duration}n · {formatCurrency(hotel.pricePerNight * duration)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 4 },
  dest: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.gray[900] },
  meta: { fontSize: fontSize.sm, color: colors.gray[500] },
  totalCard: { backgroundColor: colors.primary[700], borderColor: 'transparent', alignItems: 'center', gap: 4 },
  totalLabel: { fontSize: fontSize.sm, color: colors.primary[100], fontWeight: '600' },
  totalValue: { fontSize: fontSize['5xl'], fontWeight: '800', color: colors.white, marginVertical: 2 },
  totalPerPerson: { fontSize: fontSize.sm, color: colors.primary[100] },
  confBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full, marginTop: spacing.sm },
  confText: { fontSize: fontSize.xs, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[800] },
  flightCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flightIcon: {
    width: 36, height: 36, borderRadius: radius.lg,
    backgroundColor: colors.sky[100],
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  itemMeta: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  itemPrice: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  itemSub: { fontSize: fontSize.xs, color: colors.gray[400] },
  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, padding: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray[100],
  },
  breakdownLabel: { fontSize: fontSize.base, color: colors.gray[700] },
  breakdownValue: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  summaryCard: { backgroundColor: colors.sand[100], borderColor: colors.sand[200], marginTop: spacing.md },
  summaryTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.sand[700], marginBottom: 6 },
  summaryText: { fontSize: fontSize.sm, color: colors.gray[700], lineHeight: 20 },
});
