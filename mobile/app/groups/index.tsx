import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import type { TripGroup } from '@smartbudget/shared';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

type GroupWithMeta = TripGroup & { memberCount: number; myRole: string };

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const { groups } = await api.listGroups(); setGroups(groups); }
    catch {}
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Mes groupes</Text>
        <Pressable onPress={() => router.push('/groups/create' as any)} hitSlop={10} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary[500]} /></View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={56} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Aucun groupe pour l&apos;instant</Text>
          <Text style={styles.emptyDesc}>
            Crée un groupe pour organiser un voyage à plusieurs.{'\n'}
            Tu pourras inviter tes amis et tout décider ensemble.
          </Text>
          <Pressable onPress={() => router.push('/groups/create' as any)} style={styles.cta}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.ctaText}>Créer un groupe</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary[500]} />}
        >
          {groups.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/groups/${g.id}` as any)}
              style={({ pressed }) => [styles.groupCard, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.groupEmoji}>{g.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{g.name}</Text>
                <Text style={styles.groupMeta}>
                  {g.memberCount} membre{g.memberCount > 1 ? 's' : ''}
                  {g.myRole === 'owner' ? ' · Propriétaire' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  addBtn:  { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, marginTop: spacing.md },
  emptyDesc: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary[500], paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, marginTop: spacing.md },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: fontSize.base },

  list: { padding: spacing.lg, gap: spacing.sm },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg,
  },
  groupEmoji: { fontSize: 32 },
  groupName: { fontSize: fontSize.base, fontWeight: '800', color: colors.text.primary },
  groupMeta: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
});
