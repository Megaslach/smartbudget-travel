import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { getDestinationImage } from '../../lib/destinationImages';
import type { Simulation, BudgetEstimate } from '@smartbudget/shared';
import { formatCurrency, formatShortDate } from '@smartbudget/shared';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

type Tab = 'voyages' | 'activites' | 'hebergements';

export default function FavorisScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('voyages');
  const [trips, setTrips] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { simulations } = await api.getUserSimulations();
      setTrips(simulations);
    } catch {}
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favoris</Text>
      </View>

      <View style={styles.tabs}>
        <TabBtn label="Voyages"     active={tab === 'voyages'}     onPress={() => setTab('voyages')} />
        <TabBtn label="Activités"   active={tab === 'activites'}   onPress={() => setTab('activites')} />
        <TabBtn label="Hébergements" active={tab === 'hebergements'} onPress={() => setTab('hebergements')} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary[500]} /></View>
      ) : tab !== 'voyages' ? (
        <ComingSoon label={tab === 'activites' ? 'tes activités favorites' : 'tes hébergements favoris'} />
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Aucun voyage encore</Text>
          <Text style={styles.emptyDesc}>Lance ta première simulation depuis l&apos;Explorer.</Text>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.cta}>
            <Text style={styles.ctaText}>Explorer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary[500]} />}
        >
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} onPress={() => router.push(`/simulation/${t.id}` as any)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TabBtn({ label, active, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <Ionicons name="time-outline" size={48} color={colors.text.muted} />
      <Text style={styles.emptyTitle}>Bientôt disponible</Text>
      <Text style={styles.emptyDesc}>Tu retrouveras ici {label}.</Text>
    </View>
  );
}

function TripCard({ trip, onPress }: { trip: Simulation; onPress: () => void }) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => { getDestinationImage(trip.destination).then(setImage); }, [trip.destination]);
  const total = typeof trip.budget === 'number' ? trip.budget : (trip.budget as BudgetEstimate)?.total ?? 0;

  return (
    <Pressable onPress={onPress} style={styles.tripCard}>
      <ImageBackground source={image ? { uri: image } : undefined} style={styles.tripImage} imageStyle={{ borderRadius: radius.xl }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          locations={[0.4, 1]}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xl }]}
        />
        <View style={styles.tripContent}>
          <View>
            <Text style={styles.tripDest}>{trip.destination}</Text>
            <Text style={styles.tripMeta}>
              {formatShortDate(trip.startDate)} → {formatShortDate(trip.endDate)} · {trip.duration}j · {trip.people} pers
            </Text>
          </View>
          <View style={styles.heartBtn}>
            <Ionicons name="heart" size={18} color={colors.primary[500]} />
          </View>
        </View>
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{formatCurrency(total)}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  tabBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.full, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  tabBtnText: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
  tabBtnTextActive: { color: colors.white },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: spacing.md },
  emptyDesc: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
  cta: { backgroundColor: colors.primary[500], paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, marginTop: spacing.md },
  ctaText: { color: colors.white, fontWeight: '700' },

  list: { padding: spacing.lg, paddingTop: spacing.lg, gap: spacing.md, paddingBottom: spacing['2xl'] },
  tripCard: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.bgElevated },
  tripImage: { height: 180, justifyContent: 'space-between' },
  tripContent: { flex: 1, padding: spacing.lg, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end' },
  tripDest: { color: colors.white, fontSize: fontSize['2xl'], fontWeight: '800' },
  tripMeta: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.xs, marginTop: 2 },
  heartBtn: { backgroundColor: 'rgba(0,0,0,0.4)', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  priceBadge: { position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: colors.primary[500], paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  priceText: { color: colors.white, fontWeight: '800', fontSize: fontSize.sm },
});
