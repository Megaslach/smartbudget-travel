import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Share, TextInput,
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
type Tab = 'Membres' | 'Votes' | 'Budget' | 'Chat';

interface VoteProposal {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  votes: number;
  myVote: boolean;
}

const MOCK_PROPOSALS: VoteProposal[] = [
  { id: 'p1', emoji: '⛪', name: 'Sagrada Família', desc: 'Chef-d\'œuvre de Gaudí', votes: 18, myVote: false },
  { id: 'p2', emoji: '🌿', name: 'Parc Güell', desc: 'Panorama exceptionnel sur Barcelone', votes: 12, myVote: false },
  { id: 'p3', emoji: '🏛️', name: 'Casa Batlló', desc: 'Architecture insolite de nuit', votes: 7, myVote: false },
];

interface ChatMessage {
  id: string;
  email: string;
  text: string;
  time: string;
}

const MOCK_CHAT: ChatMessage[] = [
  { id: 'c1', email: 'lucas@example.com', text: 'J\'ai voté pour la Sagrada Família, on va adorer ! 🙌', time: '10:32' },
  { id: 'c2', email: 'sarah@example.com', text: 'Le Parc Güell c\'est top aussi pour les photos 📸', time: '10:45' },
  { id: 'c3', email: 'lucas@example.com', text: 'On réserve pour combien de personnes finalement ?', time: '11:02' },
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Membres');
  const [proposals, setProposals] = useState<VoteProposal[]>(MOCK_PROPOSALS);
  const [chatMsg, setChatMsg] = useState('');

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
      Alert.alert('Erreur', e?.error || 'Impossible de créer l\'invitation');
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
          text: isOwner ? 'Supprimer' : 'Quitter', style: 'destructive',
          onPress: async () => {
            try { await api.leaveGroup(group.id); router.replace('/groups' as any); }
            catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible'); }
          },
        },
      ],
    );
  };

  const handleVote = (proposalId: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === proposalId) {
        return { ...p, myVote: !p.myVote, votes: p.myVote ? p.votes - 1 : p.votes + 1 };
      }
      return p;
    }));
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

  const totalVotes = proposals.reduce((s, p) => s + p.votes, 0);
  const TABS: Tab[] = ['Membres', 'Votes', 'Budget', 'Chat'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.emoji} {group.name}</Text>
        {group.myRole === 'owner' ? (
          <Pressable onPress={handleInvite} hitSlop={10} style={styles.inviteBtn}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary[500]} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{group.emoji}</Text>
        <Text style={styles.heroName}>{group.name}</Text>
        <Text style={styles.heroMeta}>
          {group.members.length} membre{group.members.length > 1 ? 's' : ''}
          {group.myRole === 'owner' ? ' · Propriétaire 👑' : ''}
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'Membres' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {group.myRole === 'owner' && (
            <Button onPress={handleInvite} loading={inviting} fullWidth size="lg" style={{ marginBottom: spacing.lg }}>
              <Ionicons name="share-social-outline" size={18} color={colors.white} />
              {'  '}Inviter quelqu&apos;un
            </Button>
          )}

          <Text style={styles.sectionTitle}>Membres ({group.members.length})</Text>
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

          <Pressable onPress={handleLeave} style={styles.dangerBtn}>
            <Ionicons name="exit-outline" size={18} color={colors.red[400]} />
            <Text style={styles.dangerText}>
              {group.myRole === 'owner' ? 'Supprimer le groupe' : 'Quitter le groupe'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      {activeTab === 'Votes' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.voteHeader}>
            <View style={styles.voteBadge}>
              <View style={styles.voteDot} />
              <Text style={styles.voteBadgeText}>Vote en cours</Text>
            </View>
            <Text style={styles.voteTimer}>⏱ Fin dans 12h</Text>
          </View>

          <Text style={styles.voteQuestion}>Quelle activité pour le Jour 3 ?</Text>
          <Text style={styles.voteSubtitle}>{totalVotes} vote{totalVotes > 1 ? 's' : ''} au total · Sélectionnez votre préférence</Text>

          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {proposals.map((p) => {
              const pct = totalVotes > 0 ? Math.round((p.votes / totalVotes) * 100) : 0;
              return (
                <Pressable key={p.id} onPress={() => handleVote(p.id)} style={[styles.proposalCard, p.myVote && styles.proposalCardActive]}>
                  <View style={styles.proposalRow}>
                    <Text style={styles.proposalEmoji}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proposalName}>{p.name}</Text>
                      <Text style={styles.proposalDesc}>{p.desc}</Text>
                    </View>
                    <View style={styles.voteCountWrap}>
                      <Text style={styles.voteCount}>{p.votes}</Text>
                      <Text style={styles.votePct}>{pct}%</Text>
                    </View>
                    {p.myVote && (
                      <View style={styles.myVoteBadge}>
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      </View>
                    )}
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${pct}%` as any }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.voteInfo}>
            <Ionicons name="information-circle-outline" size={16} color={colors.text.muted} />
            <Text style={styles.voteInfoText}>Appuyez sur une proposition pour voter. Vous pouvez changer votre vote.</Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'Budget' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetEmoji}>💶</Text>
            <Text style={styles.budgetTitle}>Budget estimé par personne</Text>
            <Text style={styles.budgetAmount}>~1 200 €</Text>
            <Text style={styles.budgetSub}>pour {group.members.length} personne{group.members.length > 1 ? 's' : ''}</Text>
          </View>

          {[
            { icon: 'airplane-outline' as const, label: 'Vols', amount: '340 €', pct: 28 },
            { icon: 'bed-outline' as const, label: 'Hébergement', amount: '480 €', pct: 40 },
            { icon: 'restaurant-outline' as const, label: 'Restaurants', amount: '220 €', pct: 18 },
            { icon: 'ticket-outline' as const, label: 'Activités', amount: '160 €', pct: 14 },
          ].map(item => (
            <View key={item.label} style={styles.budgetRow}>
              <View style={styles.budgetRowIcon}>
                <Ionicons name={item.icon} size={18} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.budgetRowHeader}>
                  <Text style={styles.budgetRowLabel}>{item.label}</Text>
                  <Text style={styles.budgetRowAmount}>{item.amount}</Text>
                </View>
                <View style={styles.budgetRowTrack}>
                  <View style={[styles.budgetRowBar, { width: `${item.pct}%` as any }]} />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.budgetNote}>
            <Ionicons name="information-circle-outline" size={15} color={colors.text.muted} />
            <Text style={styles.budgetNoteText}>Estimation basée sur des prix moyens. Les montants finaux peuvent varier.</Text>
          </View>
        </ScrollView>
      )}

      {activeTab === 'Chat' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.chatScroll}>
            {MOCK_CHAT.map((msg) => {
              const isMe = msg.email === user?.email;
              return (
                <View key={msg.id} style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
                  {!isMe && (
                    <View style={styles.msgAvatar}>
                      <Text style={styles.msgAvatarText}>{msg.email[0].toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                    {!isMe && <Text style={styles.msgAuthor}>{msg.email.split('@')[0]}</Text>}
                    <Text style={styles.msgText}>{msg.text}</Text>
                    <Text style={styles.msgTime}>{msg.time}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatField}
              placeholder="Écrire un message…"
              placeholderTextColor={colors.text.muted}
              value={chatMsg}
              onChangeText={setChatMsg}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (chatMsg.trim()) {
                  Alert.alert('Chat', 'Fonctionnalité bientôt disponible !');
                  setChatMsg('');
                }
              }}
            />
            <Pressable
              onPress={() => {
                if (chatMsg.trim()) {
                  Alert.alert('Chat', 'Fonctionnalité bientôt disponible !');
                  setChatMsg('');
                }
              }}
              style={styles.chatSend}
            >
              <Ionicons name="send" size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  inviteBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[500] + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary[500] + '44',
  },
  headerTitle: {
    fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary,
    flex: 1, textAlign: 'center', marginHorizontal: spacing.md,
  },
  hero: { alignItems: 'center', paddingVertical: spacing.md, gap: 4 },
  heroEmoji: { fontSize: 52 },
  heroName: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.text.primary, marginTop: spacing.sm },
  heroMeta: { fontSize: fontSize.sm, color: colors.text.secondary },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tabItem: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: colors.primary[500] },
  tabLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.muted },
  tabLabelActive: { color: colors.primary[500] },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  membersList: {
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: 8,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800' },
  memberName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.primary },
  memberRole: { fontSize: fontSize.xs, color: colors.text.secondary, marginTop: 2 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.xl, paddingVertical: spacing.md },
  dangerText: { color: colors.red[400], fontSize: fontSize.base, fontWeight: '600' },
  // Votes
  voteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  voteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary[500] + '22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  voteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500] },
  voteBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary[400] },
  voteTimer: { fontSize: fontSize.xs, color: colors.text.secondary, fontWeight: '600' },
  voteQuestion: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary, marginBottom: 4 },
  voteSubtitle: { fontSize: fontSize.sm, color: colors.text.secondary },
  proposalCard: {
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    overflow: 'hidden',
  },
  proposalCardActive: { borderColor: colors.primary[500] + '66', backgroundColor: colors.bgElevated },
  proposalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  proposalEmoji: { fontSize: 28 },
  proposalName: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary },
  proposalDesc: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  voteCountWrap: { alignItems: 'flex-end' },
  voteCount: { fontSize: fontSize.base, fontWeight: '800', color: colors.text.primary },
  votePct: { fontSize: fontSize.xs, color: colors.text.muted },
  myVoteBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 2 },
  voteInfo: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.xl, backgroundColor: colors.bgElevated, padding: spacing.md, borderRadius: radius.lg },
  voteInfoText: { fontSize: fontSize.xs, color: colors.text.muted, flex: 1, lineHeight: 16 },
  // Budget
  budgetCard: {
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.primary[500] + '33',
    padding: spacing.xl, alignItems: 'center', gap: 4, marginBottom: spacing.lg,
  },
  budgetEmoji: { fontSize: 36 },
  budgetTitle: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '600' },
  budgetAmount: { fontSize: 44, fontWeight: '900', color: colors.primary[500] },
  budgetSub: { fontSize: fontSize.sm, color: colors.text.muted },
  budgetRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm,
  },
  budgetRowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary[500] + '22', alignItems: 'center', justifyContent: 'center' },
  budgetRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetRowLabel: { fontSize: fontSize.base, fontWeight: '600', color: colors.text.primary },
  budgetRowAmount: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary },
  budgetRowTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  budgetRowBar: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 2 },
  budgetNote: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'flex-start' },
  budgetNoteText: { fontSize: fontSize.xs, color: colors.text.muted, flex: 1, lineHeight: 16 },
  // Chat
  chatScroll: { padding: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  msgWrap: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  msgWrapMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.sky[500], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '800' },
  msgBubble: {
    maxWidth: '72%', backgroundColor: colors.bgElevated,
    borderRadius: radius.xl, borderBottomLeftRadius: 4,
    padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.border,
  },
  msgBubbleMe: { backgroundColor: colors.primary[500] + '22', borderBottomLeftRadius: radius.xl, borderBottomRightRadius: 4, borderColor: colors.primary[500] + '44' },
  msgAuthor: { fontSize: fontSize.xs, color: colors.primary[400], fontWeight: '700' },
  msgText: { fontSize: fontSize.sm, color: colors.text.primary, lineHeight: 18 },
  msgTime: { fontSize: 10, color: colors.text.muted, alignSelf: 'flex-end' },
  chatInput: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  chatField: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: radius.full,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: fontSize.base, color: colors.text.primary,
    borderWidth: 1, borderColor: colors.border,
  },
  chatSend: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center',
  },
});


