import { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const HERO = 'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&w=940';

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
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email invalide'); return; }
    if (password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.error || 'Erreur lors de l\u2019inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: HERO }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover">
        <LinearGradient
          colors={['rgba(14,20,36,0.4)', 'rgba(14,20,36,0.85)', 'rgba(14,20,36,1)']}
          locations={[0, 0.4, 0.8]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={{ flex: 1 }} />
            <View>
              <Text style={styles.title}>Crée ton compte</Text>
              <Text style={styles.subtitle}>En quelques secondes</Text>

              <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                <Input
                  placeholder="votre@email.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  leftIcon="mail-outline"
                />
                <Input
                  placeholder="Mot de passe (min. 6 caractères)"
                  secureTextEntry
                  autoComplete="new-password"
                  value={password}
                  onChangeText={setPassword}
                  leftIcon="lock-closed-outline"
                />
                <Input
                  placeholder="Confirmer le mot de passe"
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                  leftIcon="lock-closed-outline"
                />
                {error && <Text style={styles.errorBox}>{error}</Text>}
                <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
                  S&apos;inscrire
                </Button>
                <Pressable onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.signupLink}>
                    Déjà un compte ? <Text style={styles.signupBold}>Se connecter</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.xl, justifyContent: 'flex-end' },
  title: { fontSize: 38, fontWeight: '800', color: colors.text.primary, marginBottom: 6 },
  subtitle: { fontSize: fontSize.base, color: colors.text.secondary },
  errorBox: {
    backgroundColor: 'rgba(255,82,82,0.15)',
    color: colors.red[400],
    padding: spacing.md,
    borderRadius: radius.lg,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.red[500] + '40',
  },
  signupLink: { color: colors.text.secondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  signupBold: { color: colors.primary[500], fontWeight: '700' },
});
