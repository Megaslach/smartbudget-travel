import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import type { Collaborator, Comment } from '@smartbudget/shared';
import Card from './Card';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props {
  simulationId: string;
  isOwner: boolean;
  currentUserId?: string;
}

const WEB_BASE = 'https://smartbudget-travel.netlify.app';

export default function CollabView({ simulationId, isOwner, currentUserId }: Props) {
  const [owner, setOwner] = useState<{ id: string; email: string; name: string } | null>(null);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const load = async () => {
    try {
      const [collabRes, comRes] = await Promise.all([
        api.listCollaborators(simulationId),
        api.listComments(simulationId),
      ]);
      setOwner(collabRes.owner);
      setCollabs(collabRes.collaborators);
      setComments(comRes.comments);
    } catch {}
  };

  useEffect(() => { load(); }, [simulationId]);

  const handleInvite = async () => {
    setCreatingInvite(true);
    try {
      const { token } = await api.createInvite(simulationId);
      setInviteToken(token);
      const url = `${WEB_BASE}/invite/${token}`;
      await Share.share({ message: `Rejoins ma simulation de voyage : ${url}`, url });
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible de créer l’invitation');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { comment } = await api.createComment(simulationId, { text: text.trim() });
      setComments([...comments, comment]);
      setText('');
    } catch (e: any) {
      Alert.alert('Erreur', e?.error || 'Impossible d’envoyer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce commentaire ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteComment(id);
            setComments(comments.filter(c => c.id !== id));
          } catch {}
        },
      },
    ]);
  };

  const handleRemoveCollab = (userId: string) => {
    Alert.alert('Retirer', 'Retirer cette personne du voyage ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer', style: 'destructive',
        onPress: async () => {
          try {
            await api.removeCollaborator(simulationId, userId);
            setCollabs(collabs.filter(c => c.id !== userId));
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={16} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Collaboration</Text>
      </View>

      <Card>
        <Text style={styles.subHeader}>Membres</Text>
        <View style={{ gap: 8, marginTop: 6 }}>
          {owner && (
            <View style={styles.memberRow}>
              <Avatar name={owner.email} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName} numberOfLines={1}>{owner.email}</Text>
                <Text style={styles.memberRole}>Propriétaire</Text>
              </View>
              <View style={styles.ownerBadge}>
                <Ionicons name="star" size={10} color={colors.amber[500]} />
              </View>
            </View>
          )}
          {collabs.map((c) => (
            <View key={c.id} style={styles.memberRow}>
              <Avatar name={c.email} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName} numberOfLines={1}>{c.email}</Text>
                <Text style={styles.memberRole}>Collaborateur</Text>
              </View>
              {isOwner && (
                <Pressable onPress={() => handleRemoveCollab(c.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {isOwner && (
          <Button onPress={handleInvite} loading={creatingInvite} variant="outline" fullWidth style={{ marginTop: spacing.md }}>
            <Ionicons name="share-social-outline" size={16} color={colors.gray[800]} />
            {'  '}Inviter quelqu&apos;un
          </Button>
        )}
        {inviteToken && (
          <Text style={styles.inviteNote}>
            Lien d&apos;invitation valide 14 jours · à partager via le bouton ci-dessus
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.subHeader}>Commentaires</Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          {comments.length === 0 ? (
            <Text style={styles.emptyText}>Aucun commentaire pour l&apos;instant.</Text>
          ) : (
            comments.map((c) => {
              const canDelete = c.author.id === currentUserId || isOwner;
              return (
                <View key={c.id} style={styles.commentBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar name={c.author.email} small />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.commentAuthor} numberOfLines={1}>{c.author.email}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(c.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    {canDelete && (
                      <Pressable onPress={() => handleDelete(c.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={16} color={colors.gray[400]} />
                      </Pressable>
                    )}
                  </View>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={colors.gray[400]}
            value={text}
            onChangeText={setText}
            multiline
            style={styles.input}
          />
          <Pressable onPress={handleSend} disabled={loading || !text.trim()} style={[styles.sendBtn, (!text.trim() || loading) && { opacity: 0.4 }]}>
            {loading ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initial = (name || '?')[0].toUpperCase();
  const size = small ? 28 : 36;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary[700], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontSize: small ? 12 : 14, fontWeight: '700' }}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 32, height: 32, borderRadius: radius.lg, backgroundColor: colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  subHeader: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  memberRole: { fontSize: fontSize.xs, color: colors.gray[500] },
  ownerBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.amber[100], alignItems: 'center', justifyContent: 'center' },
  inviteNote: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 6, textAlign: 'center' },

  commentBlock: { gap: 6 },
  commentAuthor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[900] },
  commentDate: { fontSize: 10, color: colors.gray[400] },
  commentText: { fontSize: fontSize.sm, color: colors.gray[700], lineHeight: 18 },
  emptyText: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center', paddingVertical: spacing.sm },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  input: { flex: 1, backgroundColor: colors.gray[100], borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.sm, maxHeight: 80, color: colors.gray[900] },
  sendBtn: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.primary[700], alignItems: 'center', justifyContent: 'center' },
});
