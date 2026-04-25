import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { getDestinationImage } from '../../lib/destinationImages';
import type { Simulation, BudgetEstimate } from '@smartbudget/shared';
import { formatCurrency, formatShortDate } from '@smartbudget/shared';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { simulations } = await api.getUserSimulations();
      setTrips(simulations);
      setError(null);
    } catch (err: any) {
      setError(err?.error || 'Erreur lors du chargement');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes voyages</Text>
        <Pressable onPress={() => router.push('/(tabs)/simulate')} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[700]} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={load} variant="outline" style={{ marginTop: spacing.md }}>
            Réessayer
          </Button>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="airplane-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>Aucun voyage encore</Text>
          <Text style={styles.emptyDesc}>Lance ta première simulation pour commencer.</Text>
          <Button onPress={() => router.push('/(tabs)/simulate')} style={{ marginTop: spacing.lg }}>
            Simuler un voyage
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {trips.map((t) => <TripCard key={t.id} trip={t} onPress={() => router.push(`/simulation/${t.id}`)} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TripCard({ trip, onPress }: { trip: Simulation; onPress: () => void }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDestinationImage(trip.destination).then((img) => {
      if (!cancelled) setImage(img);
    });
    return () => { cancelled = true; };
  }, [trip.destination]);

  const total = typeof trip.budget === 'number'
    ? trip.budget
    : (trip.budget as BudgetEstimate)?.total ?? 0;

  return (
    <Pressable onPress={onPress}>
      <View style={styles.tripCard}>
        <ImageBackground
          source={image ? { uri: image } : undefined}
          style={styles.tripImage}
          imageStyle={{ borderRadius: radius['2xl'] }}
        >
          <View style={styles.tripOverlay}>
            <View style={styles.tripHead}>
              <Text style={styles.tripDest}>{trip.destination}</Text>
              {trip.role === 'editor' && (
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedText}>Partagé</Text>
                </View>
              )}
            </View>
            <Text style={styles.tripMeta}>
              {formatShortDate(trip.startDate)} → {formatShortDate(trip.endDate)}
              {'  ·  '}{trip.duration}j · {trip.people} pers
            </Text>
            <View style={styles.tripFoot}>
              <Text style={styles.tripPrice}>{formatCurrency(total)}</Text>
              <View style={styles.openBadge}>
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.gray[900] },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary[700],
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  errorText: { color: colors.red[500], textAlign: 'center' },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[700], marginTop: spacing.md },
  emptyDesc: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center' },

  tripCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tripImage: { height: 170, justifyContent: 'flex-end' },
  tripOverlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: spacing.lg,
    gap: 4,
  },
  tripHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripDest: { fontSize: fontSize.xl, fontWeight: '800', color: colors.white, flex: 1 },
  tripMeta: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)' },
  tripFoot: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8,
  },
  tripPrice: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.white },
  openBadge: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  sharedBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, marginLeft: 8 },
  sharedText: { fontSize: fontSize.xs, color: colors.white, fontWeight: '600' },
});
