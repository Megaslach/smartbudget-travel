import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable,
  Linking, Image, Alert, Share, ImageBackground, RefreshControl,
} from 'react-native';
import { useCallback } from 'react';
import { useLocalSearchParams, Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { getDestinationImage, getActivityImage, getOgImageFromUrl } from '../../lib/destinationImages';
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
import TripGeneratorWizard, { TripGeneratorOptions } from '../../components/TripGeneratorWizard';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const WEB_BASE = 'https://smartbudget-travel.netlify.app';

export default function SimulationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    if (sim?.destination) {
      getDestinationImage(sim.destination).then(setHeroImage);
    }
  }, [sim?.destination]);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { simulation } = await api.getSimulationDetail(id);
      setSim(simulation);
      setError(null);
    } catch (e: any) {
      setError(e?.error || 'Erreur de chargement');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Auto-refresh on focus (so collab comments / new itinerary appear)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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

  const handleOpenWizard = () => {
    if (!sim) return;
    if (!user?.isPremium) {
      Alert.alert(
        'Premium requis',
        'La génération d’itinéraire est une fonctionnalité Premium.',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Voir Premium', onPress: () => router.push('/subscription' as any) },
        ],
      );
      return;
    }
    setWizardOpen(true);
  };

  const handleGenerateItinerary = async (options: TripGeneratorOptions) => {
    if (!sim) return;
    setGenerating(true);
    try {
      const { itinerary } = await api.generateTrip(sim.id, options);
      setSim({ ...sim, itinerary });
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible de générer l’itinéraire');
      throw e;
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
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
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={{ color: colors.red[500], marginTop: 12, textAlign: 'center' }}>{error || 'Voyage introuvable'}</Text>
          <Button onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }} variant="outline" style={{ marginTop: 16 }}>
            Réessayer
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[700]} />}
        >
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

              {/* Host stay toggle */}
              <HostStayToggle
                simulationId={sim.id}
                value={!!sim.hostStay}
                onChange={(v) => {
                  setSim((s) => s ? { ...s, hostStay: v } : s);
                  load();
                }}
              />

              {/* Multi-stop info */}
              {sim.stops && sim.stops.length > 0 && (
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500] + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="map-outline" size={20} color={colors.primary[500]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: fontSize.sm }}>
                      Voyage multi-villes
                    </Text>
                    <Text style={{ color: colors.text.secondary, fontSize: fontSize.xs, marginTop: 2 }}>
                      {sim.destination} → {sim.stops.map(s => s.name).join(' → ')}
                    </Text>
                  </View>
                </Card>
              )}

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
              {!sim.hostStay && budget.accommodation?.options?.length > 0 && (
                <Section
                  title="Hébergement"
                  icon="bed"
                  badge={budget.accommodation.isRealData ? 'Prix réels' : 'Prix indicatif'}
                  badgeOk={budget.accommodation.isRealData}
                  onRefresh={async (kept: string[]) => {
                    const { simulation } = await api.regenerateOptions(sim.id, 'hotels', kept);
                    setSim((s) => s ? { ...s, ...simulation } : simulation as any);
                  }}
                  items={budget.accommodation.options.map((h) => h.name)}
                >
                  {(pinned: string[], togglePin: (n: string) => void) =>
                    budget.accommodation.options.map((h, i) => (
                      <HotelRow key={`${h.name}-${i}`} hotel={h} duration={sim.duration} pinned={pinned.includes(h.name)} onTogglePin={() => togglePin(h.name)} />
                    ))
                  }
                </Section>
              )}

              {/* Activities */}
              {budget.activities?.options?.length > 0 && (
                <Section
                  title="Activités"
                  icon="ticket-outline"
                  onRefresh={async (kept: string[]) => {
                    const { simulation } = await api.regenerateOptions(sim.id, 'activities', kept);
                    setSim((s) => s ? { ...s, ...simulation } : simulation as any);
                  }}
                  items={budget.activities.options.map((a) => a.name)}
                >
                  {(pinned: string[], togglePin: (n: string) => void) =>
                    budget.activities.options.map((a, i) => (
                      <ActivityCard key={`${a.name}-${i}`} activity={a} people={sim.people} destination={sim.destination} pinned={pinned.includes(a.name)} onTogglePin={() => togglePin(a.name)} />
                    ))
                  }
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
                Génère un itinéraire personnalisé avec des activités, des restaurants et des bons plans pour chaque jour.
              </Text>
              <Button onPress={handleOpenWizard} loading={generating} fullWidth style={{ marginTop: spacing.md }}>
                {user?.isPremium ? 'Générer mon itinéraire' : 'Disponible avec Premium'}
              </Button>
            </Card>
          )}
        </ScrollView>
      )}

      <TripGeneratorWizard
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onGenerate={handleGenerateItinerary}
      />
    </SafeAreaView>
  );
}

/* --- Sub-components --- */

function HostStayToggle({ simulationId, value, onChange }: { simulationId: string; value: boolean; onChange: (v: boolean) => void }) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      await api.updateHostStay(simulationId, !value);
      onChange(!value);
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible de mettre à jour');
    } finally { setBusy(false); }
  };

  return (
    <Pressable onPress={toggle} disabled={busy} style={[styles.hostStay, value && styles.hostStayActive]}>
      <View style={[styles.hostStayIcon, value && { backgroundColor: colors.primary[500] }]}>
        <Ionicons name="home-outline" size={20} color={value ? colors.white : colors.primary[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.hostStayTitle}>Loger chez quelqu&apos;un</Text>
        <Text style={styles.hostStayDesc}>
          {value
            ? '✅ Hébergement gratuit appliqué — économie incluse'
            : 'Active si tu es logé par un proche : on enlève les coûts d\u2019hébergement.'}
        </Text>
      </View>
      <View style={[styles.toggleTrack, value && { backgroundColor: colors.primary[500] }]}>
        <View style={[styles.toggleKnob, value && { alignSelf: 'flex-end' }]} />
      </View>
    </Pressable>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const map = {
    high:   { label: 'Précision élevée', color: colors.emerald[500], bg: '#D1FAE5' },
    medium: { label: 'Précision moyenne', color: colors.amber[500],   bg: colors.amber[100] },
    low:    { label: 'Estimation',     color: colors.gray[500],    bg: colors.gray[100] },
  }[confidence];
  return (
    <View style={[styles.confBadge, { backgroundColor: map.bg }]}>
      <Text style={[styles.confText, { color: map.color }]}>{map.label}</Text>
    </View>
  );
}

function Section({ title, icon, children, badge, badgeOk, onRefresh, items }: any) {
  const [pinned, setPinned] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const togglePin = (name: string) => {
    setPinned((p) => p.includes(name) ? p.filter(n => n !== name) : [...p, name]);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try { await onRefresh(pinned); }
    catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible de rafraîchir'); }
    finally { setRefreshing(false); }
  };

  // Use children as render-prop if it's a function, else render directly
  const renderedChildren = typeof children === 'function'
    ? children(pinned, togglePin)
    : children;

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
        {onRefresh && (
          <Pressable onPress={handleRefresh} disabled={refreshing} hitSlop={8} style={styles.refreshBtn}>
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            ) : (
              <>
                <Ionicons name="refresh" size={14} color={colors.primary[500]} />
                <Text style={styles.refreshText}>{pinned.length > 0 ? `Garder ${pinned.length} • Renouveler` : 'Renouveler'}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      {renderedChildren}
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

function HotelRow({ hotel, duration, pinned, onTogglePin }: { hotel: HotelOption; duration: number; pinned?: boolean; onTogglePin?: () => void }) {
  const [resolvedImage, setResolvedImage] = useState<string | null>(hotel.imageUrl ?? null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (hotel.imageUrl) { setResolvedImage(hotel.imageUrl); return; }
    if (!hotel.bookingUrl) return;
    let cancelled = false;
    getOgImageFromUrl(hotel.bookingUrl).then((img) => {
      if (!cancelled && img) setResolvedImage(img);
    });
    return () => { cancelled = true; };
  }, [hotel.imageUrl, hotel.bookingUrl]);

  return (
    <Pressable onPress={() => hotel.bookingUrl && Linking.openURL(hotel.bookingUrl)}>
      <Card noPadding style={[{ flexDirection: 'row', overflow: 'hidden', alignItems: 'stretch' }, pinned && { borderColor: colors.primary[500], borderWidth: 2 }]}>
        <View style={styles.hotelImageBox}>
          {resolvedImage && !errored ? (
            <Image
              source={{ uri: resolvedImage }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setErrored(true)}
            />
          ) : (
            <Ionicons name="bed" size={28} color={colors.indigo[500]} />
          )}
          {onTogglePin && (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onTogglePin(); }}
              hitSlop={8}
              style={[styles.pinBtn, { top: 6, right: 6 }]}
            >
              <Ionicons name={pinned ? 'heart' : 'heart-outline'} size={16} color={pinned ? colors.primary[500] : colors.white} />
            </Pressable>
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

function ActivityCard({ activity, people, destination, pinned, onTogglePin }: { activity: ActivityOption; people: number; destination: string; pinned?: boolean; onTogglePin?: () => void }) {
  const fallbackUrl = 'https://images.pexels.com/photos/2245436/pexels-photo-2245436.jpeg?auto=compress&w=940';
  const [resolvedImage, setResolvedImage] = useState<string>(activity.imageUrl || fallbackUrl);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (activity.imageUrl) {
      setResolvedImage(activity.imageUrl);
      return;
    }
    let cancelled = false;
    getActivityImage(activity.name, destination, activity.bookingUrl).then((img) => {
      if (!cancelled && img) setResolvedImage(img);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activity.imageUrl, activity.name, activity.bookingUrl, destination]);

  const handleImageError = () => {
    if (!errored) {
      setErrored(true);
      setResolvedImage(fallbackUrl);
    }
  };

  return (
    <Pressable onPress={() => activity.bookingUrl && Linking.openURL(activity.bookingUrl)}>
      <Card noPadding style={[{ overflow: 'hidden' }, pinned && { borderColor: colors.primary[500], borderWidth: 2 }]}>
        <View style={styles.activityImageBox}>
          <Image
            source={{ uri: resolvedImage }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={handleImageError}
          />
          <View style={styles.activityPriceBadge}>
            <Text style={styles.activityPriceText}>{formatCurrency(activity.price)}/pers</Text>
          </View>
          {onTogglePin && (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); onTogglePin(); }}
              hitSlop={8}
              style={styles.pinBtn}
            >
              <Ionicons name={pinned ? 'heart' : 'heart-outline'} size={18} color={pinned ? colors.primary[500] : colors.white} />
            </Pressable>
          )}
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
  pinBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    backgroundColor: colors.primary[500] + '15',
    borderRadius: radius.full,
  },
  refreshText: { fontSize: 11, fontWeight: '700', color: colors.primary[500] },

  searchLink: { paddingVertical: 8, alignItems: 'center' },
  searchLinkText: { color: colors.primary[700], fontSize: fontSize.sm, fontWeight: '600' },
  recoBox: { backgroundColor: colors.sand[100], padding: spacing.md, borderRadius: radius.lg, marginBottom: 4 },
  recoText: { fontSize: fontSize.sm, color: colors.sand[700], lineHeight: 18 },
  subHeader: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[600], marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },

  itineraryEmpty: { alignItems: 'center', gap: 6 },

  hostStay: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border },
  hostStayActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[500] + '15' },
  hostStayIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500] + '20', alignItems: 'center', justifyContent: 'center' },
  hostStayTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary },
  hostStayDesc: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2, lineHeight: 16 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.bgSubtle, padding: 2 },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  itineraryEmptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  itineraryEmptyDesc: { fontSize: fontSize.sm, color: colors.gray[600], textAlign: 'center', lineHeight: 20 },
});
