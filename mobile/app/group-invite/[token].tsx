import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { TripGroup } from '@smartbudget/shared';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<TripGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getGroupInviteInfo(token)
      .then(({ group }) => setGroup(group))
      .catch((e) => setError(e?.error || 'Invitation invalide ou expirée'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!user) {
      Alert.alert('Connexion requise', 'Connecte-toi pour rejoindre ce groupe.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Me connecter', onPress: () => router.replace('/(auth)/login') },
      ]);
      return;
    }
    setAccepting(true);
    try {
      const { groupId } = await api.acceptGroupInvite(token);
      router.replace(`/groups/${groupId}` as any);
    } catch (e: any) {
      setError(e?.error || 'Impossible de rejoindre');
    } finally { setAccepting(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)' as any)} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.primary[500]} />
        ) : error || !group ? (
          <>
            <Ionicons name="alert-circle-outline" size={56} color={colors.red[400]} />
            <Text style={styles.title}>Invitation invalide</Text>
            <Text style={styles.desc}>{error || 'Cette invitation a expiré ou n\u2019existe plus.'}</Text>
            <Button onPress={() => router.replace('/(tabs)' as any)} variant="outline" style={{ marginTop: 16 }}>
              Retour
            </Button>
          </>
        ) : (
          <>
            <Text style={styles.emojiHero}>{group.emoji}</Text>
            <Text style={styles.title}>Rejoindre {group.name} ?</Text>
            <Text style={styles.desc}>
              Tu as été invité à rejoindre ce groupe de voyage sur Itinifly.{'\n'}
              Tu pourras voir l&apos;itinéraire, participer aux votes et discuter avec les autres membres.
            </Text>
            <Button onPress={handleAccept} loading={accepting} fullWidth size="lg" style={{ marginTop: spacing.xl }}>
              Rejoindre le groupe
            </Button>
            <Pressable onPress={() => router.replace('/(tabs)' as any)} hitSlop={8} style={{ marginTop: spacing.md }}>
              <Text style={styles.cancel}>Plus tard</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emojiHero: { fontSize: 80 },
  title: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.text.primary, textAlign: 'center', marginTop: spacing.md },
  desc: { fontSize: fontSize.base, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  cancel: { color: colors.text.muted, fontSize: fontSize.sm, fontWeight: '600' },
});
