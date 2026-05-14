import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const EMOJIS = ['🌍', '✈️', '🏖️', '🗼', '🏛️', '🏔️', '🌃', '🌴', '🍷', '🎉'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!name.trim() || name.trim().length < 2) {
      setError('Nom du groupe requis (2 caractères min)'); return;
    }
    setLoading(true);
    try {
      const { group } = await api.createGroup({ name: name.trim(), emoji });
      router.replace(`/groups/${group.id}` as any);
    } catch (e: any) {
      setError(e?.error || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Nouveau groupe</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Emoji du groupe</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
              >
                <Text style={styles.emoji}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: spacing.lg }} />
          <Input
            label="Nom du groupe"
            placeholder="ex: Barcelone 2027, Road trip USA, Famille…"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {error && (
            <Text style={styles.errorBox}>{error}</Text>
          )}

          <Button onPress={handleCreate} loading={loading} fullWidth size="lg" style={{ marginTop: spacing.lg }}>
            Créer le groupe
          </Button>

          <Text style={styles.hint}>
            Tu seras le propriétaire. Tu pourras inviter d&apos;autres personnes ensuite.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  label: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: '600', marginBottom: spacing.sm },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[500] + '20' },
  emoji: { fontSize: 26 },
  errorBox: { backgroundColor: 'rgba(255,82,82,0.15)', color: colors.red[400], padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm, marginTop: spacing.md, borderWidth: 1, borderColor: colors.red[500] + '40' },
  hint: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});
