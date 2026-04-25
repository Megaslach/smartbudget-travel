import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable,
  Linking, Image, Alert, Share, ImageBackground,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { getDestinationImage, getActivityImage } from '../../lib/destinationImages';
import type {
  Simulation, BudgetEstimate, FlightOption, HotelOption,
  ActivityOption, CarRentalOption, PublicTransportOption,
  AddonOption,
} from '@smartbudget/shared';
import { formatCurrency, formatShortDate } from '@smartbudget/shared';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ItineraryView from '../../components/ItineraryView';
import AiTipsView from '../../components/AiTipsView';
import PriceAlertView from '../../components/PriceAlertView';
import FlexibleDatesView from '../../components/FlexibleDatesView';
import CollabView from '../../components/CollabView';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const WEB_BASE = 'https://smartbudget-travel.netlify.app';

export default function SimulationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (sim?.destination) {
      getDestinationImage(sim.destination).then(setHeroImage);
    }
  }, [sim?.destination]);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.getSimulationDetail(id)
      .then(({ simulation }) => setSim(simulation))
      .catch((e) => setError(e?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const budget: BudgetEstimate | null = sim?.budgetData
    || (typeof sim?.budget === 'object' ? (sim.budget as BudgetEstimate) : null);

  const handleShare = async () => {
    if (!sim) return;
    const url = `${WEB_BASE}/shared/${sim.id}`;
    try {
      await Share.share({
        message: `Regarde ma simulation pour ${sim.destination} sur SmartBudget : ${url}`,
        url,
      });
    } catch {}
  };

  const handleGenerateItinerary = async () => {
    if (!sim) return;
    if (!user?.isPremium) {
      Alert.alert(
        'Premium requis',
        'La génération d’itinéraire est une fonctionnalité Premium. Passe Premium depuis ton profil.',
      );
      return;
    }
    setGenerating(true);
    try {
      const { itinerary } = await api.generateTrip(sim.id);
      setSim({ ...sim, itinerary });
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible de générer l’itinéraire');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{
        title: sim?.destination || 'Voyage',
        headerRight: () => sim ? (
          <Pressable onPress={handleShare} hitSlop={10} style={{ marginRight: 8 }}>
            <Ionicons name="share-outline" size={22} color={colors.primary[700]} />
          </Pressable>
        ) : null,
      }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[700]} />
        </View>
      ) : error || !sim ? (
        <View style={styles.center}>
          <Text style={{ color: colors.red[500] }}>{error || 'Voyage introuvable'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ImageBackground
            source={heroImage ? { uri: heroImage } : undefined}
            style={styles.hero}
            imageStyle={{ borderRadius: radius['2xl'] }}
          >
            <View style={styles.heroOverlay}>
              <Text style={styles.heroDest}>{sim.destination}</Text>
              <Text style={styles.heroMeta}>
                {formatShortDate(sim.startDate)} → {formatShortDate(sim.endDate)} · {sim.duration}j · {sim.people} pers
              </Text>
            </View>
          </ImageBackground>

          {budget && (
            <>
              {/* Total budget hero */}
              <Card style={styles.totalCard}>
                <Text style={styles.totalLabel}>Budget total estimé</Text>
                <Text style={styles.totalValue}>{formatCurrency(budget.total)}</Text>
                <Text style={styles.totalPerPerson}>
                  {formatCurrency(Math.round(budget.total / sim.people))} / personne
                </Text>
                <ConfidenceBadge confidence={budget.confidence} />
                {!!budget.summary && (
                  <Text style={styles.totalSummary}>{budget.summary}</Text>
                )}
              </Card>

              {/* Flights */}
              {budget.flights?.options?.length > 0 && (
                <Section title="Vols" icon="airplane" badge={budget.flights.isRealData ? 'Prix réels' : 'Prix indicatif'} badgeOk={budget.flights.isRealData}>
                  {budget.flights.options.map((f, i) => <FlightRow key={i} flight={f} people={sim.people} />)}
                  {!!budget.flights.searchUrl && (
                    <Pressable onPress={() => Linking.openURL(budget.flights.searchUrl)} style={styles.searchLink}>
                      <Text style={styles.searchLinkText}>
                        {budget.flights.isRealData ? 'Voir tous les vols' : 'Comparer sur Skyscanner'} →
                      </Text>
                    </Pressable>
                  )}
                </Section>
              )}

              {/* Hotels */}
              {budget.accommodation?.options?.length > 0 && (
                <Section title="Hébergement" icon="bed" badge={budget.accommodation.isRealData ? 'Prix réels' : 'Prix indicatif'} badgeOk={budget.accommodation.isRealData}>
                  {budget.accommodation.options.map((h, i) => <HotelRow key={i} hotel={h} duration={sim.duration} />)}
                  {!!budget.accommodation.searchUrl && (
                    <Pressable onPress={() => Linking.openURL(budget.accommodation.searchUrl)} style={styles.searchLink}>
                      <Text style={styles.searchLinkText}>Voir tous les hôtels →</Text>
                    </Pressable>
                  )}
                </Section>
              )}

              {/* Activities */}
              {budget.activities?.options?.length > 0 && (
                <Section title="Activités" icon="ticket-outline">
                  {budget.activities.options.map((a, i) => (
                    <ActivityCard key={i} activity={a} people={sim.people} destination={sim.destination} />
                  ))}
                </Section>
              )}

              {/* Local transport */}
              {budget.localTransport && (
                <Section title="Transport sur place" icon="car">
                  {!!budget.localTransport.recommendation && (
                    <View style={styles.recoBox}>
                      <Text style={styles.recoText}>{budget.localTransport.recommendation}</Text>
                    </View>
                  )}
                  {budget.localTransport.publicTransport.options.length > 0 && (
                    <>
                      <Text style={styles.subHeader}>Transports en commun</Text>
                      {budget.localTransport.publicTransport.options.map((t, i) => <PublicTransportRow key={i} transport={t} />)}
                    </>
                  )}
                  {budget.localTransport.carRentals.options.length > 0 && (
                    <>
                      <Text style={styles.subHeader}>Location de voiture</Text>
                      {budget.localTransport.carRentals.options.map((c, i) => <CarRentalRow key={i} car={c} />)}
                    </>
                  )}
                </Section>
              )}

              {/* Add-ons */}
              {budget.addons && budget.addons.length > 0 && (
                <Section title="Add-ons" icon="add-circle-outline">
                  {budget.addons.map((a) => <AddonRow key={a.id} addon={a} />)}
                </Section>
              )}

              {/* Other budget breakdown */}
              <Section title="Autres postes" icon="wallet">
                <BreakdownRow icon="restaurant-outline" label="Nourriture" value={budget.food} />
                <BreakdownRow icon="bus-outline" label="Transport sur place" value={budget.transport} />
                <BreakdownRow icon="ticket-outline" label="Activités totales" value={budget.activities.total} />
              </Section>
            </>
          )}

          {/* AI Tips */}
          {sim.aiTips && <AiTipsView tips={sim.aiTips} />}

          {/* Price alerts */}
          {sim.role !== 'editor' && (
            <PriceAlertView
              simulationId={sim.id}
              initialEnabled={sim.priceAlertEnabled}
              initialThreshold={sim.priceAlertThreshold}
            />
          )}

          {/* Flexible dates */}
          <FlexibleDatesView simulationId={sim.id} isPremium={!!user?.isPremium} />

          {/* Collab */}
          <CollabView
            simulationId={sim.id}
            isOwner={sim.role !== 'editor'}
            currentUserId={user?.id}
          />

          {/* Itinerary */}
          {sim.itinerary ? (
            <ItineraryView itinerary={sim.itinerary} />
          ) : (
            <Card style={styles.itineraryEmpty}>
              <Ionicons name="map-outline" size={28} color={colors.primary[700]} />
              <Text style={styles.itineraryEmptyTitle}>Itinéraire jour par jour</Text>
              <Text style={styles.itineraryEmptyDesc}>
                Génère un itinéraire personnalisé par IA avec des activités, des restaurants et des bons plans pour chaque jour.
              </Text>
              <Button onPress={handleGenerateItinerary} loading={generating} fullWidth style={{ marginTop: spacing.md }}>
                {user?.isPremium ? 'Générer mon itinéraire' : 'Disponible avec Premium'}
              </Button>
            </Card>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* --- Sub-components --- */

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const map = {
    high:   { label: 'Précision élevée', color: colors.emerald[500], bg: '#D1FAE5' },
    medium: { label: 'Précision moyenne', color: colors.amber[500],   bg: colors.amber[100] },
    low:    { label: 'Estimation IA',     color: colors.gray[500],    bg: colors.gray[100] },
  }[confidence];
  return (
    <View style={[styles.confBadge, { backgroundColor: map.bg }]}>
      <Text style={[styles.confText, { color: map.color }]}>{map.label}</Text>
    </View>
  );
}

function Section({ title, icon, children, badge, badgeOk }: any) {
  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={18} color={colors.primary[700]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge && (
          <View style={[styles.miniBadge, { backgroundColor: badgeOk ? '#D1FAE5' : colors.amber[100] }]}>
            <Text style={[styles.miniBadgeText, { color: badgeOk ? colors.emerald[600] : colors.amber[500] }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function FlightRow({ flight, people }: { flight: FlightOption; people: number }) {
  const dep = flight.departureAt ? new Date(flight.departureAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
  const arr = flight.arrivalAt ? new Date(flight.arrivalAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <Pressable onPress={() => flight.bookingUrl && Linking.openURL(flight.bookingUrl)}>
      <Card style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: colors.sky[100] }]}>
          <Ionicons name="airplane" size={18} color={colors.sky[600]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{flight.airline}</Text>
          <Text style={styles.rowMeta}>
            {flight.type}
            {dep && arr ? ` · ${dep} → ${arr}` : ''}
            {flight.duration ? ` · ${flight.duration}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowPrice}>{formatCurrency(flight.price)}</Text>
          {people > 1 && <Text style={styles.rowSub}>× {people}</Text>}
        </View>
      </Card>
    </Pressable>
  );
}

function HotelRow({ hotel, duration }: { hotel: HotelOption; duration: number }) {
  return (
    <Pressable onPress={() => hotel.bookingUrl && Linking.openURL(hotel.bookingUrl)}>
      <Card noPadding style={{ flexDirection: 'row', overflow: 'hidden', alignItems: 'stretch' }}>
        <View style={styles.hotelImageBox}>
          {hotel.imageUrl ? (
            <Image source={{ uri: hotel.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Ionicons name="bed" size={28} color={colors.indigo[500]} />
          )}
        </View>
        <View style={styles.hotelBody}>
          <Text style={styles.rowTitle} numberOfLines={1}>{hotel.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={styles.rowMeta}>{hotel.type}</Text>
            {!!hotel.rating && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="star" size={12} color={colors.amber[400]} />
                <Text style={[styles.rowMeta, { color: colors.amber[500], fontWeight: '600' }]}>{hotel.rating}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 }}>
            <Text style={styles.rowSub}>{duration}n · {formatCurrency(hotel.pricePerNight * duration)}</Text>
            <Text style={styles.rowPrice}>{formatCurrency(hotel.pricePerNight)}<Text style={styles.rowSub}>/nuit</Text></Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function ActivityCard({ activity, people, destination }: { activity: ActivityOption; people: number; destination: string }) {
  const [resolvedImage, setResolvedImage] = useState<string | null>(activity.imageUrl ?? null);

  useEffect(() => {
    if (activity.imageUrl) {
      setResolvedImage(activity.imageUrl);
      return;
    }
    let cancelled = false;
    getActivityImage(activity.name, destination).then((img) => {
      if (!cancelled) setResolvedImage(img);
    });
    return () => { cancelled = true; };
  }, [activity.imageUrl, activity.name, destination]);

  return (
    <Pressable onPress={() => activity.bookingUrl && Linking.openURL(activity.bookingUrl)}>
      <Card noPadding style={{ overflow: 'hidden' }}>
        <View style={styles.activityImageBox}>
          {resolvedImage ? (
            <Image source={{ uri: resolvedImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={28} color={colors.gray[300]} />
            </View>
          )}
          <View style={styles.activityPriceBadge}>
            <Text style={styles.activityPriceText}>{formatCurrency(activity.price)}/pers</Text>
          </View>
        </View>
        <View style={{ padding: spacing.md }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{activity.name}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.rowMeta}>{activity.duration}</Text>
            {people > 1 && <Text style={styles.rowSub}>{formatCurrency(activity.price * people)} / groupe</Text>}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function CarRentalRow({ car }: { car: CarRentalOption }) {
  return (
    <Pressable onPress={() => car.bookingUrl && Linking.openURL(car.bookingUrl)}>
      <Card style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: colors.emerald[400] + '30' }]}>
          <Ionicons name="car-sport-outline" size={20} color={colors.emerald[600]} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{car.category}</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>{car.provider} · {car.location}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowPrice}>{formatCurrency(car.pricePerDay)}<Text style={styles.rowSub}>/j</Text></Text>
          <Text style={styles.rowSub}>total {formatCurrency(car.totalPrice)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

function PublicTransportRow({ transport }: { transport: PublicTransportOption }) {
  const iconMap: Record<PublicTransportOption['type'], keyof typeof Ionicons.glyphMap> = {
    single: 'subway-outline',
    day_pass: 'card-outline',
    multi_day: 'card-outline',
    taxi: 'car-outline',
    uber: 'phone-portrait-outline',
    airport_transfer: 'airplane-outline',
    bike: 'bicycle-outline',
  };
  return (
    <Card style={styles.row}>
      <View style={[styles.iconBubble, { backgroundColor: colors.sand[100] }]}>
        <Ionicons name={iconMap[transport.type] || 'bus-outline'} size={20} color={colors.sand[700]} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{transport.name}</Text>
        <Text style={styles.rowMeta} numberOfLines={2}>{transport.description}</Text>
      </View>
      <Text style={styles.rowPrice}>{formatCurrency(transport.price)}</Text>
    </Card>
  );
}

function AddonRow({ addon }: { addon: AddonOption }) {
  return (
    <Pressable onPress={() => addon.bookingUrl && Linking.openURL(addon.bookingUrl)}>
      <Card style={styles.row}>
        <Text style={{ fontSize: 26 }}>{addon.icon}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{addon.name}</Text>
          <Text style={styles.rowMeta} numberOfLines={2}>{addon.description}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowPrice}>{addon.price === 0 ? 'Inclus' : formatCurrency(addon.price)}</Text>
          {!!addon.priceLabel && <Text style={styles.rowSub}>{addon.priceLabel}</Text>}
        </View>
      </Card>
    </Pressable>
  );
}

function BreakdownRow({ icon, label, value }: any) {
  return (
    <Card style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.gray[500]} />
      <Text style={[styles.rowTitle, { flex: 1 }]}>{label}</Text>
      <Text style={styles.rowPrice}>{formatCurrency(value)}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 4 },
  dest: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.gray[900] },
  meta: { fontSize: fontSize.sm, color: colors.gray[500] },

  hero: {
    height: 180,
    justifyContent: 'flex-end',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    padding: spacing.lg,
    gap: 4,
  },
  heroDest: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.white },
  heroMeta: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.85)' },

  totalCard: { backgroundColor: colors.primary[700], borderColor: 'transparent', alignItems: 'center', gap: 4 },
  totalLabel: { fontSize: fontSize.sm, color: colors.primary[100], fontWeight: '600' },
  totalValue: { fontSize: fontSize['5xl'], fontWeight: '800', color: colors.white, marginVertical: 2 },
  totalPerPerson: { fontSize: fontSize.sm, color: colors.primary[100] },
  totalSummary: { fontSize: fontSize.sm, color: colors.primary[100], textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  confBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full, marginTop: spacing.sm },
  confText: { fontSize: fontSize.xs, fontWeight: '700' },

  sectionTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[800], flex: 1 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  miniBadgeText: { fontSize: 9, fontWeight: '700' },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBubble: { width: 36, height: 36, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  rowMeta: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 1 },
  rowPrice: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  rowSub: { fontSize: fontSize.xs, color: colors.gray[400] },

  hotelImageBox: {
    width: 100,
    height: 100,
    backgroundColor: colors.indigo[100],
    alignItems: 'center', justifyContent: 'center',
  },
  hotelBody: { flex: 1, padding: spacing.md, minWidth: 0, justifyContent: 'center' },

  activityImageBox: { height: 130, backgroundColor: colors.gray[100], position: 'relative' },
  activityPriceBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full,
  },
  activityPriceText: { color: colors.white, fontSize: 11, fontWeight: '700' },

  searchLink: { paddingVertical: 8, alignItems: 'center' },
  searchLinkText: { color: colors.primary[700], fontSize: fontSize.sm, fontWeight: '600' },
  recoBox: { backgroundColor: colors.sand[100], padding: spacing.md, borderRadius: radius.lg, marginBottom: 4 },
  recoText: { fontSize: fontSize.sm, color: colors.sand[700], lineHeight: 18 },
  subHeader: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[600], marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },

  itineraryEmpty: { alignItems: 'center', gap: 6 },
  itineraryEmptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  itineraryEmptyDesc: { fontSize: fontSize.sm, color: colors.gray[600], textAlign: 'center', lineHeight: 20 },
});
