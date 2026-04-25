import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.error || 'Email ou mot de passe incorrect');
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
          <Text style={styles.title}>Bon retour</Text>
          <Text style={styles.subtitle}>Connecte-toi pour planifier ton prochain voyage</Text>
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
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.errorBox}>{error}</Text>}

          <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
            Se connecter
          </Button>

          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.switchLink}>
              Pas encore de compte ? <Text style={styles.switchLinkBold}>S&apos;inscrire</Text>
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
