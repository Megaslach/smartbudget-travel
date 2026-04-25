import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.error || 'Erreur lors de l’inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="leaf" size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Crée ton compte</Text>
          <Text style={styles.subtitle}>Commence à planifier ton voyage en quelques secondes</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="votre@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Mot de passe"
            placeholder="Minimum 6 caractères"
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          {error && <Text style={styles.errorBox}>{error}</Text>}

          <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
            S&apos;inscrire
          </Button>

          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.switchLink}>
              Déjà un compte ? <Text style={styles.switchLinkBold}>Se connecter</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  iconWrap: {
    width: 56, height: 56, borderRadius: radius.xl,
    backgroundColor: colors.primary[700],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.gray[900], marginBottom: 6 },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center' },
  form: { gap: spacing.lg },
  errorBox: {
    backgroundColor: '#FEE2E2', color: colors.red[600],
    padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm,
  },
  switchLink: { textAlign: 'center', fontSize: fontSize.sm, color: colors.gray[600], marginTop: spacing.sm },
  switchLinkBold: { color: colors.primary[700], fontWeight: '700' },
});
