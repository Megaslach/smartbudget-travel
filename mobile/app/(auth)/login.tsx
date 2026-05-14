import { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet,
  ImageBackground, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const HERO = 'https://images.pexels.com/photos/96425/pexels-photo-96425.jpeg?auto=compress&w=940';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) { setError('Email et mot de passe requis'); return; }
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
    <View style={styles.root}>
      <ImageBackground source={{ uri: HERO }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover">
        <LinearGradient
          colors={['rgba(14,20,36,0.4)', 'rgba(14,20,36,0.85)', 'rgba(14,20,36,1)']}
          locations={[0, 0.4, 0.8]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={{ flex: 1 }} />

            <View>
              <Text style={styles.title}>Bienvenue !</Text>
              <Text style={styles.subtitle}>Connecte-toi ou crée ton compte</Text>

              {!showEmail ? (
                <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
                  <SocialButton
                    icon="logo-google"
                    label="Continuer avec Google"
                    onPress={() => Alert.alert('Bientôt', 'Connexion Google disponible prochainement')}
                  />
                  <SocialButton
                    icon="logo-apple"
                    label="Continuer avec Apple"
                    onPress={() => Alert.alert('Bientôt', 'Connexion Apple disponible prochainement')}
                  />
                  <SocialButton
                    icon="mail-outline"
                    label="Continuer avec e-mail"
                    onPress={() => setShowEmail(true)}
                  />

                  <Pressable onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.signupLink}>
                      Déjà un compte ? <Text style={styles.signupBold}>Se connecter</Text>
                    </Text>
                  </Pressable>
                </View>
              ) : (
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
                    placeholder="Mot de passe"
                    secureTextEntry
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                    leftIcon="lock-closed-outline"
                  />
                  {error && <Text style={styles.errorBox}>{error}</Text>}
                  <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
                    Se connecter
                  </Button>
                  <Pressable onPress={() => setShowEmail(false)} hitSlop={8}>
                    <Text style={styles.backLink}>← Autres options</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/(auth)/register')}>
                    <Text style={styles.signupLink}>
                      Pas de compte ? <Text style={styles.signupBold}>S&apos;inscrire</Text>
                    </Text>
                  </Pressable>
                </View>
              )}

              <Text style={styles.legal}>
                En continuant, tu acceptes nos{'\n'}
                <Text style={styles.legalLink}>Conditions d&apos;utilisation</Text> et la{' '}
                <Text style={styles.legalLink}>Politique de confidentialité</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function SocialButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={20} color={colors.text.primary} />
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: spacing.xl, justifyContent: 'flex-end' },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
  },
  socialLabel: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(255,82,82,0.15)',
    color: colors.red[400],
    padding: spacing.md,
    borderRadius: radius.lg,
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderColor: colors.red[500] + '40',
  },
  backLink: { color: colors.text.muted, fontSize: fontSize.sm, textAlign: 'center', marginTop: 4 },
  signupLink: { color: colors.text.secondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  signupBold: { color: colors.primary[500], fontWeight: '700' },
  legal: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
  },
  legalLink: { color: colors.text.secondary, textDecorationLine: 'underline' },
});
