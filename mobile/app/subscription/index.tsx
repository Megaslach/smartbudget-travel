import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const BENEFITS = [
  { icon: 'pricetag-outline'      as const, label: 'Réductions exclusives' },
  { icon: 'shield-checkmark-outline' as const, label: 'Annulation gratuite' },
  { icon: 'flash-outline'         as const, label: 'Support prioritaire' },
  { icon: 'sparkles-outline'      as const, label: 'Contenus premium' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const isPremium = user?.isPremium;
  const plan = user?.premiumPlan;
  const expiresAt = user?.premiumUntil ? new Date(user.premiumUntil) : null;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : 0;

  const handleSubscribe = async (planId: 'oneshot' | 'annual') => {
    setBusy(planId);
    try {
      const { url } = await api.createCheckoutSession(planId);
      await Linking.openURL(url);
    } catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible'); }
    finally { setBusy(null); }
  };

  const handleManage = async () => {
    setBusy('portal');
    try {
      const { url } = await api.createPortalSession();
      await Linking.openURL(url);
    } catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible'); }
    finally { setBusy(null); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles" size={28} color={colors.white} />
          </View>
          <Text style={styles.heroTitle}>Passer en PREMIUM ✨</Text>
          <Text style={styles.heroSub}>
            {isPremium ? 'Tu profites déjà de tous les avantages.' : 'Profite d\u2019avantages exclusifs pour voyager sans limites.'}
          </Text>
        </View>

        <View style={styles.card}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefitRow}>
              <View style={styles.checkBubble}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
              </View>
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        {isPremium ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {expiresAt && (
              <View style={styles.expiryBox}>
                <Ionicons name="time-outline" size={16} color={colors.primary[500]} />
                <Text style={styles.expiryText}>
                  {plan === 'annual' ? 'Renouvellement' : 'Accès jusqu\u2019au'}
                  {' '}<Text style={{ fontWeight: '800' }}>{expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                  {daysLeft > 0 && <Text style={{ color: colors.text.muted }}>{'  ·  '}{daysLeft}j restants</Text>}
                </Text>
              </View>
            )}
            <Button onPress={handleManage} loading={busy === 'portal'} variant="outline" fullWidth>
              Gérer mon abonnement
            </Button>
          </View>
        ) : (
          <View style={{ marginTop: spacing.xl }}>
            <View style={styles.priceBox}>
              <Text style={styles.priceMain}>4,99 €<Text style={styles.pricePer}>  / mois</Text></Text>
              <Text style={styles.priceSub}>Engagement annuel — soit 59,88 €/an</Text>
            </View>

            <Button
              onPress={() => handleSubscribe('annual')}
              loading={busy === 'annual'}
              fullWidth
              size="lg"
              style={{ marginTop: spacing.md }}
            >
              Essayer gratuitement 7 jours
            </Button>
            <Text style={styles.disclaimer}>Sans engagement. Annulation à tout moment.</Text>

            <View style={styles.alt}>
              <Text style={styles.altLabel}>Tu préfères un pass ponctuel ?</Text>
              <Button
                onPress={() => handleSubscribe('oneshot')}
                loading={busy === 'oneshot'}
                variant="outline"
                fullWidth
                style={{ marginTop: 8 }}
              >
                Pass one-shot — 4,99€ (30 jours)
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },

  hero: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  heroTitle: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.text.primary },
  heroSub: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.xl },

  card: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.lg, gap: spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkBubble: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  benefitLabel: { fontSize: fontSize.base, color: colors.text.primary, fontWeight: '600' },

  expiryBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary[500] + '40' },
  expiryText: { fontSize: fontSize.sm, color: colors.text.primary, flex: 1 },

  priceBox: { alignItems: 'center', marginVertical: spacing.lg },
  priceMain: { fontSize: 44, fontWeight: '800', color: colors.primary[500] },
  pricePer: { fontSize: fontSize.base, color: colors.text.secondary, fontWeight: '500' },
  priceSub: { fontSize: fontSize.sm, color: colors.text.muted, marginTop: 4 },
  disclaimer: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },

  alt: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  altLabel: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center' },
});
