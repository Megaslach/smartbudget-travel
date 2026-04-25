import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          {user?.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={colors.amber[500]} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>

        <Card style={styles.heroCard}>
          <Text style={styles.heroTitle}>Voyagez malin, pas cher.</Text>
          <Text style={styles.heroDesc}>
            Simulez votre budget en un clic, découvrez un itinéraire sur-mesure.
          </Text>
          <Button onPress={() => router.push('/(tabs)/simulate')} fullWidth size="lg" style={{ marginTop: spacing.lg }}>
            Estimer mon budget
          </Button>
        </Card>

        <Text style={styles.sectionTitle}>Pourquoi SmartBudget ?</Text>

        <FeatureRow
          icon="trending-down"
          color={colors.emerald[500]}
          title="Budget transparent"
          desc="Estimation IA basée sur des données réelles, sans surprise."
        />
        <FeatureRow
          icon="sparkles"
          color={colors.accent[500]}
          title="Itinéraire IA personnalisé"
          desc="Jour par jour selon ton style, ton budget et tes envies."
        />
        <FeatureRow
          icon="people"
          color={colors.primary[600]}
          title="Voyage à plusieurs"
          desc="Invite tes amis, votez ensemble, tracker des dépenses inclus."
        />

        <Pressable onPress={() => router.push('/(tabs)/trips')} style={{ marginTop: spacing.xl }}>
          <Text style={styles.linkText}>Voir mes voyages enregistrés →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, color, title, desc }: any) {
  return (
    <Card style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  greeting: { fontSize: fontSize.sm, color: colors.gray[500], fontWeight: '600' },
  email: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  premiumBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.amber[100],
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full,
  },
  premiumText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.amber[500] },
  heroCard: { backgroundColor: colors.primary[700], borderColor: 'transparent' },
  heroTitle: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.white, marginBottom: 6 },
  heroDesc: { fontSize: fontSize.sm, color: colors.primary[100], lineHeight: 20 },
  sectionTitle: {
    fontSize: fontSize.base, fontWeight: '700', color: colors.gray[700],
    marginTop: spacing.lg, marginBottom: 4,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 40, height: 40, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900], marginBottom: 2 },
  featureDesc: { fontSize: fontSize.sm, color: colors.gray[500], lineHeight: 18 },
  linkText: {
    fontSize: fontSize.base, fontWeight: '600', color: colors.primary[700],
    textAlign: 'center',
  },
});
