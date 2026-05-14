import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import type { TripGroup, TripGroupMember } from '@smartbudget/shared';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const APP_WEB = 'https://smartbudget-travel.netlify.app';

type GroupDetail = TripGroup & { myRole: string; members: TripGroupMember[] };

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try { const { group } = await api.getGroup(id); setGroup(group as GroupDetail); }
    catch {}
  }, [id]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleInvite = async () => {
    if (!group) return;
    setInviting(true);
    try {
      const { token } = await api.createGroupInvite(group.id);
      const inviteUrl = `${APP_WEB}/group-invite/${token}`;
      await Share.share({
        message: `Rejoins mon groupe de voyage "${group.name}" ${group.emoji} sur Itinifly : ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible de créer l\u2019invitation');
    } finally { setInviting(false); }
  };

  const handleLeave = () => {
    if (!group) return;
    const isOwner = group.myRole === 'owner';
    Alert.alert(
      isOwner ? 'Supprimer le groupe ?' : 'Quitter le groupe ?',
      isOwner ? 'Cette action est définitive. Tous les membres seront retirés.' : 'Tu pourras être réinvité.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isOwner ? 'Supprimer' : 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.leaveGroup(group.id);
              router.replace('/groups' as any);
            } catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible'); }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.text.secondary }}>Groupe introuvable</Text>
        <Button onPress={() => router.back()} variant="outline" style={{ marginTop: 16 }}>Retour</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.emoji} {group.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{group.emoji}</Text>
          <Text style={styles.heroName}>{group.name}</Text>
          <Text style={styles.heroMeta}>
            {group.members.length} membre{group.members.length > 1 ? 's' : ''}
            {group.myRole === 'owner' ? ' · tu es le propriétaire' : ''}
          </Text>
        </View>

        {group.myRole === 'owner' && (
          <Button onPress={handleInvite} loading={inviting} fullWidth size="lg" style={{ marginTop: spacing.lg }}>
            <Ionicons name="share-social-outline" size={18} color={colors.white} />
            {'  '}Inviter quelqu&apos;un
          </Button>
        )}

        <Text style={styles.sectionTitle}>Membres</Text>
        <View style={styles.membersList}>
          {group.members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(m.user.email || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.user.email}
                  {m.userId === user?.id && <Text style={{ color: colors.text.muted }}> (toi)</Text>}
                </Text>
                <Text style={styles.memberRole}>{m.role === 'owner' ? '👑 Propriétaire' : 'Membre'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.placeholderCard}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary[500]} />
          <Text style={styles.placeholderTitle}>Votes & propositions</Text>
          <Text style={styles.placeholderDesc}>
            Bientôt : proposez des hôtels, activités et dates dans le groupe, puis votez ensemble pour décider du voyage.
          </Text>
        </View>

        <View style={styles.placeholderCard}>
          <Ionicons name="images-outline" size={28} color={colors.primary[500]} />
          <Text style={styles.placeholderTitle}>Souvenirs partagés</Text>
          <Text style={styles.placeholderDesc}>
            Bientôt : un album commun où chaque membre dépose ses photos du voyage.
          </Text>
        </View>

        <Pressable onPress={handleLeave} style={styles.dangerBtn}>
          <Ionicons name="exit-outline" size={18} color={colors.red[400]} />
          <Text style={styles.dangerText}>
            {group.myRole === 'owner' ? 'Supprimer le groupe' : 'Quitter le groupe'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary, flex: 1, textAlign: 'center', marginHorizontal: spacing.md },

  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  hero: { alignItems: 'center', gap: 6, paddingVertical: spacing.lg },
  heroEmoji: { fontSize: 64 },
  heroName: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.text.primary, marginTop: spacing.sm },
  heroMeta: { fontSize: fontSize.sm, color: colors.text.secondary },

  sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.sm, paddingHorizontal: 4 },
  membersList: { gap: 8, backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800' },
  memberName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.primary },
  memberRole: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },

  placeholderCard: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.md, alignItems: 'center', gap: 8 },
  placeholderTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary, marginTop: 4 },
  placeholderDesc: { fontSize: fontSize.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 18 },

  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: spacing.md },
  dangerText: { color: colors.red[400], fontSize: fontSize.base, fontWeight: '600' },
});
