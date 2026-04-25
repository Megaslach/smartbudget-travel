import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const PERKS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'sparkles-outline',     title: 'Itinéraire IA personnalisé',     desc: 'Jour par jour, adapté à ton style et ton budget' },
  { icon: 'options-outline',      title: 'Filtres avancés',                 desc: 'Style, rythme, hébergement, alimentation, transport…' },
  { icon: 'git-compare-outline',  title: 'Comparateur',                      desc: 'Compare jusqu\u00e0 4 destinations en parallèle' },
  { icon: 'notifications-outline',title: 'Alertes de prix',                  desc: 'On te prévient si le prix bouge' },
  { icon: 'calendar-clear-outline',title:'Dates flexibles',                  desc: 'Scanne ±7 jours pour trouver moins cher' },
  { icon: 'people-outline',       title: 'Collaboration',                    desc: 'Invite tes amis, commentez ensemble' },
];

const PLANS = [
  {
    id: 'oneshot' as const,
    title: 'One-shot',
    price: '4,99€',
    period: '30 jours',
    desc: 'Une simulation Premium pour ton prochain voyage',
    cta: 'Acheter — 4,99€',
    variant: 'outline' as const,
  },
  {
    id: 'annual' as const,
    title: 'Annuel',
    price: '29€',
    period: 'par an',
    desc: 'Accès illimité toute l\u2019année',
    cta: 'S\u2019abonner — 29€/an',
    variant: 'primary' as const,
    badge: 'Meilleur rapport',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const isPremium = user?.isPremium;
  const plan = user?.premiumPlan;
  const expiresAt = user?.premiumUntil ? new Date(user.premiumUntil) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleSubscribe = async (planId: 'oneshot' | 'annual') => {
    setBusy(planId);
    try {
      const { url } = await api.createCheckoutSession(planId);
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible d\u2019ouvrir le paiement');
    } finally {
      setBusy(null);
    }
  };

  const handleManage = async () => {
    setBusy('portal');
    try {
      const { url } = await api.createPortalSession();
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible d\u2019ouvrir le portail Stripe');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Mon abonnement' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isPremium ? (
          <>
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.crownBubble}>
                  <Ionicons name="star" size={22} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Tu es Premium</Text>
                  <Text style={styles.statusSub}>
                    {plan === 'annual' ? 'Abonnement annuel' : 'Pass one-shot'}
                  </Text>
                </View>
              </View>

              {expiresAt && (
                <View style={styles.expiryRow}>
                  <Ionicons name="time-outline" size={16} color={colors.amber[500]} />
                  <Text style={styles.expiryText}>
                    {plan === 'annual' ? 'Renouvellement' : 'Expire'} le{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    {daysLeft > 0 && (
                      <Text style={{ color: colors.gray[500] }}>  ·  {daysLeft}j restants</Text>
                    )}
                  </Text>
                </View>
              )}

              <Button
                onPress={handleManage}
                loading={busy === 'portal'}
                variant="outline"
                fullWidth
                style={{ marginTop: spacing.md }}
              >
                <Ionicons name="settings-outline" size={16} color={colors.gray[800]} />
                {'  '}Gérer mon abonnement
              </Button>
              <Text style={styles.portalHint}>
                Modifier le moyen de paiement, voir les factures, résilier à tout moment.
              </Text>
            </Card>

            <Section title="Inclus dans ton abonnement">
              {PERKS.map((p) => <PerkRow key={p.title} perk={p} unlocked />)}
            </Section>
          </>
        ) : (
          <>
            <View style={styles.heroBox}>
              <Ionicons name="sparkles" size={32} color={colors.amber[500]} />
              <Text style={styles.heroTitle}>Passe à Premium</Text>
              <Text style={styles.heroDesc}>
                Débloque l\u2019itinéraire IA personnalisé, le comparateur, les alertes de prix et plus encore.
              </Text>
            </View>

            <Section title="Ce que tu débloques">
              {PERKS.map((p) => <PerkRow key={p.title} perk={p} unlocked={false} />)}
            </Section>

            <Section title="Choisis ton plan">
              {PLANS.map((pl) => (
                <Card key={pl.id} style={pl.id === 'annual' ? styles.planRecommended : undefined}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={styles.planTitle}>{pl.title}</Text>
                        {pl.badge && (
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedText}>{pl.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.planPrice}>
                        {pl.price}
                        <Text style={styles.planPeriod}>  ·  {pl.period}</Text>
                      </Text>
                      <Text style={styles.planDesc}>{pl.desc}</Text>
                    </View>
                  </View>
                  <Button
                    onPress={() => handleSubscribe(pl.id)}
                    loading={busy === pl.id}
                    variant={pl.variant}
                    fullWidth
                    style={{ marginTop: spacing.md }}
                  >
                    {pl.cta}
                  </Button>
                </Card>
              ))}
            </Section>

            <Text style={styles.disclaimer}>
              Paiement sécurisé via Stripe. Le paiement s\u2019ouvre dans ton navigateur.{'\n'}
              Tu peux résilier ton abonnement annuel à tout moment.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PerkRow({ perk, unlocked }: { perk: typeof PERKS[number]; unlocked: boolean }) {
  return (
    <Card style={styles.perkCard}>
      <View style={[styles.perkIcon, !unlocked && { backgroundColor: colors.gray[100] }]}>
        <Ionicons name={unlocked ? 'checkmark-circle' : perk.icon} size={20} color={unlocked ? colors.emerald[500] : colors.gray[500]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.perkTitle}>{perk.title}</Text>
        <Text style={styles.perkDesc}>{perk.desc}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },

  statusCard: { backgroundColor: colors.primary[700], borderColor: 'transparent' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  crownBubble: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.amber[500], alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.white },
  statusSub: { fontSize: fontSize.sm, color: colors.primary[100], marginTop: 2 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.12)', padding: spacing.md, borderRadius: radius.lg },
  expiryText: { fontSize: fontSize.sm, color: colors.white, flex: 1 },
  portalHint: { fontSize: fontSize.xs, color: colors.primary[100], marginTop: 6, textAlign: 'center' },

  heroBox: { alignItems: 'center', padding: spacing.lg, gap: 6, marginBottom: spacing.sm },
  heroTitle: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.gray[900], marginTop: 6 },
  heroDesc: { fontSize: fontSize.sm, color: colors.gray[600], textAlign: 'center', lineHeight: 20, marginTop: 4 },

  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },

  perkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  perkIcon: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.emerald[400] + '20', alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  perkDesc: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2, lineHeight: 16 },

  planRecommended: { borderColor: colors.primary[700], borderWidth: 2 },
  planTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  planPrice: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.primary[700], marginTop: 4 },
  planPeriod: { fontSize: fontSize.sm, fontWeight: '500', color: colors.gray[500] },
  planDesc: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 4, lineHeight: 18 },
  recommendedBadge: { backgroundColor: colors.amber[500], paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  recommendedText: { fontSize: 10, color: colors.white, fontWeight: '800', letterSpacing: 0.4 },

  disclaimer: { fontSize: fontSize.xs, color: colors.gray[400], textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});
