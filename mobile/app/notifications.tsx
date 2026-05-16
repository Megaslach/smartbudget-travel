import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../lib/theme';

type NotifIconName = 'airplane' | 'people' | 'star' | 'pricetag' | 'checkmark-circle' | 'heart' | 'notifications';

interface Notif {
  id: string;
  icon: NotifIconName;
  color: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFS: Notif[] = [
  {
    id: '1',
    icon: 'airplane',
    color: colors.primary[500],
    title: 'Votre voyage est prêt ! ✈️',
    body: 'L\'itinéraire pour Barcelone a été généré avec succès. 8 jours, 2 personnes, 1 200 €.',
    time: 'Il y a 5 min',
    unread: true,
  },
  {
    id: '2',
    icon: 'people',
    color: colors.sky[500],
    title: 'Invitation au groupe',
    body: 'Lucas vous a invité à rejoindre le groupe "Vacances Grèce 2025 🇬🇷".',
    time: 'Il y a 1h',
    unread: true,
  },
  {
    id: '3',
    icon: 'star',
    color: colors.amber[400],
    title: 'Bienvenue en Premium ⭐',
    body: 'Profitez de 7 jours d\'essai gratuit. Accès illimité aux itinéraires et filtres avancés.',
    time: 'Il y a 3h',
    unread: false,
  },
  {
    id: '4',
    icon: 'pricetag',
    color: colors.emerald[500],
    title: 'Alerte prix : Madrid',
    body: 'Le prix du vol Paris → Madrid a baissé de 23 %. Disponible à partir de 87 €.',
    time: 'Hier',
    unread: false,
  },
  {
    id: '5',
    icon: 'checkmark-circle',
    color: colors.emerald[400],
    title: 'Voyage confirmé 🎉',
    body: 'Votre simulation "Tokyo 10 jours" a été sauvegardée dans vos favoris.',
    time: 'Hier',
    unread: false,
  },
  {
    id: '6',
    icon: 'heart',
    color: colors.red[400],
    title: 'Nouveau favori ajouté',
    body: 'L\'hôtel Riu Plaza España a été ajouté à vos favoris pour votre voyage à Madrid.',
    time: 'Il y a 2 jours',
    unread: false,
  },
  {
    id: '7',
    icon: 'people',
    color: colors.sky[500],
    title: 'Sarah a rejoint votre groupe',
    body: 'Sarah vient de rejoindre le groupe "Ski Alpes 2025 ⛷️". Le groupe compte maintenant 4 membres.',
    time: 'Il y a 3 jours',
    unread: false,
  },
];

function NotifCard({ notif }: { notif: Notif }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }, notif.unread && styles.cardUnread]}>
      {notif.unread && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: notif.color + '22' }]}>
        <Ionicons name={notif.icon} size={22} color={notif.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{notif.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{notif.body}</Text>
        <Text style={styles.cardTime}>{notif.time}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const unreadCount = MOCK_NOTIFS.filter(n => n.unread).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Unread section */}
        {MOCK_NOTIFS.some(n => n.unread) && (
          <>
            <Text style={styles.sectionLabel}>Nouvelles</Text>
            {MOCK_NOTIFS.filter(n => n.unread).map(n => <NotifCard key={n.id} notif={n} />)}
          </>
        )}

        {/* Read section */}
        {MOCK_NOTIFS.some(n => !n.unread) && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Antérieures</Text>
            {MOCK_NOTIFS.filter(n => !n.unread).map(n => <NotifCard key={n.id} notif={n} />)}
          </>
        )}

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary },
  badge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '800' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sectionLabel: {
    fontSize: fontSize.xs, fontWeight: '700',
    color: colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.sm, paddingLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  cardUnread: {
    borderColor: colors.primary[500] + '44',
    backgroundColor: colors.bgElevated,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary },
  cardDesc: { fontSize: fontSize.sm, color: colors.text.secondary, lineHeight: 18 },
  cardTime: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: 2 },
});
