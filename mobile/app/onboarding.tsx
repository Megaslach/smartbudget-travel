import { View, Text, ImageBackground, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { colors, fontSize, spacing } from '../lib/theme';

const HERO_IMAGE = 'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&w=940';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ImageBackground source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover">
        <LinearGradient
          colors={['rgba(14,20,36,0.2)', 'rgba(14,20,36,0.7)', 'rgba(14,20,36,0.98)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Logo size="md" />
          <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={10}>
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.title}>
            Prêt à vivre{'\n'}<Text style={{ color: colors.primary[500] }}>l&apos;aventure</Text> ?
          </Text>
          <Text style={styles.subtitle}>
            Organise, découvre, partage{'\n'}et garde des souvenirs inoubliables.
          </Text>
          <Button
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xl }}
          >
            Commencer
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, padding: spacing.xl, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { color: colors.text.secondary, fontSize: fontSize.base, fontWeight: '600' },
  bottom: { paddingBottom: spacing.xl },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.text.primary,
    lineHeight: 50,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});
