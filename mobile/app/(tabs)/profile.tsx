import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleUpgrade = async (plan: 'oneshot' | 'annual') => {
    try {
      const { url } = await api.createCheckoutSession(plan);
      Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Erreur', err?.error || 'Impossible d’ouvrir le paiement');
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            {user?.isPremium && (
              <View style={styles.premiumDot}>
                <Ionicons name="star" size={12} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>
            {user?.isPremium ? `Premium · ${user.premiumPlan === 'annual' ? 'Annuel' : 'One-shot'}` : 'Gratuit'}
          </Text>
        </Card>

        {!user?.isPremium && (
          <Card style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Passe à Premium</Text>
            <Text style={styles.upgradeDesc}>
              Itinéraire IA personnalisé · Comparateur · Alerte de prix · Dates flexibles
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button onPress={() => handleUpgrade('oneshot')} variant="outline" fullWidth>
                One-shot — 4,99€ (30 jours)
              </Button>
              <Button onPress={() => handleUpgrade('annual')} fullWidth>
                Annuel — 29€/an
              </Button>
            </View>
          </Card>
        )}

        <Section title="Paramètres">
          <Row icon="mail-outline" label="Modifier l'email" onPress={() => Alert.alert('Bientôt', 'Disponible prochainement')} />
          <Row icon="lock-closed-outline" label="Changer le mot de passe" onPress={() => Alert.alert('Bientôt', 'Disponible prochainement')} />
          <Row icon="notifications-outline" label="Notifications" onPress={() => Alert.alert('Bientôt', 'Disponible prochainement')} />
        </Section>

        <Section title="Aide">
          <Row icon="help-circle-outline" label="Centre d'aide" onPress={() => Linking.openURL('https://smartbudget-travel.netlify.app')} />
          <Row icon="document-text-outline" label="Conditions d'utilisation" onPress={() => Linking.openURL('https://smartbudget-travel.netlify.app')} />
        </Section>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.red[500]} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card noPadding style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function Row({ icon, label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gray[50] }]}>
      <Ionicons name={icon} size={20} color={colors.gray[600]} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg },
  profileCard: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.primary[700],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, position: 'relative',
  },
  avatarText: { color: colors.white, fontSize: fontSize['2xl'], fontWeight: '700' },
  premiumDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: radius.full,
    backgroundColor: colors.amber[500],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  email: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  role: { fontSize: fontSize.sm, color: colors.gray[500] },
  upgradeCard: { marginTop: spacing.lg },
  upgradeTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  upgradeDesc: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 4, lineHeight: 20 },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm, paddingHorizontal: spacing.xs,
  },
  sectionCard: { overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.gray[800] },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.xl, padding: spacing.md,
  },
  logoutText: { color: colors.red[500], fontSize: fontSize.base, fontWeight: '600' },
});
