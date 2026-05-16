import { useRef, useState } from 'react';
import {
  View, Text, ImageBackground, StyleSheet, Pressable, Dimensions,
  ScrollView, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { colors, fontSize, radius, spacing } from '../lib/theme';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'itinifly.onboarded';

const SLIDES = [
  {
    image: 'https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&w=940',
    tag: 'Bienvenue',
    icon: 'compass-outline' as const,
    title: 'Prêt à vivre\nl\'aventure ?',
    subtitle: 'Organise, découvre, partage\net garde des souvenirs inoubliables.',
  },
  {
    image: 'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&w=940',
    tag: 'Groupes',
    icon: 'people-outline' as const,
    title: 'Voyage en groupe,\nvotez ensemble',
    subtitle: 'Créez un groupe, invitez vos amis et décidez ensemble de chaque détail du voyage.',
  },
  {
    image: 'https://images.pexels.com/photos/2161467/pexels-photo-2161467.jpeg?auto=compress&w=940',
    tag: 'Budget',
    icon: 'trending-down-outline' as const,
    title: 'Les meilleurs\nprix pour vous',
    subtitle: 'Comparaison en temps réel pour vols, hôtels et activités.\nVotre budget optimisé.',
  },
  {
    image: 'https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg?auto=compress&w=940',
    tag: 'Souvenirs',
    icon: 'images-outline' as const,
    title: 'Gardez vos\nmeilleurs souvenirs',
    subtitle: 'Photos, lieux, activités. Tout est conservé\npour revivre chaque moment.',
  },
];

const FEATURES_LAST = [
  { icon: 'shield-checkmark-outline' as const, text: 'Sécurisé & confidentiel' },
  { icon: 'flash-outline' as const, text: 'Résultats instantanés' },
  { icon: 'star-outline' as const, text: 'Sans engagement, 7 jours offerts' },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slide);
  };

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * width, animated: true });
    } else {
      await finishOnboarding();
    }
  };

  const isLast = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.root}>
      {/* Sliding backgrounds */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width }}>
            <ImageBackground source={{ uri: s.image }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover">
              <LinearGradient
                colors={['rgba(14,20,36,0.1)', 'rgba(14,20,36,0.55)', 'rgba(14,20,36,0.97)']}
                locations={[0, 0.45, 0.82]}
                style={StyleSheet.absoluteFillObject}
              />
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      {/* UI overlay */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Logo size="sm" />
          <Pressable onPress={finishOnboarding} hitSlop={12}>
            <Text style={styles.skip}>Passer</Text>
          </Pressable>
        </View>

        {/* Feature tag — centered in empty space */}
        <View style={styles.tagArea}>
          <View style={styles.tagPill}>
            <Ionicons name={slide.icon} size={15} color={colors.primary[400]} />
            <Text style={styles.tagText}>{slide.tag}</Text>
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContent}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>

          {isLast && (
            <View style={styles.features}>
              {FEATURES_LAST.map((f) => (
                <View key={f.icon} style={styles.featureRow}>
                  <Ionicons name={f.icon} size={16} color={colors.primary[500]} />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  scrollRef.current?.scrollTo({ x: i * width, animated: true });
                  setCurrentSlide(i);
                }}
                hitSlop={8}
              >
                <View style={[styles.dot, i === currentSlide && styles.dotActive]} />
              </Pressable>
            ))}
          </View>

          <Button onPress={handleNext} fullWidth size="lg" style={{ marginTop: spacing.xl }}>
            {isLast ? 'Commencer l\'aventure ✈️' : 'Suivant'}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  overlay: {
    ...StyleSheet.absoluteFillObject as any,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  skip: { color: colors.text.secondary, fontSize: fontSize.base, fontWeight: '600' },
  tagArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,90,31,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,90,31,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  tagText: { color: colors.primary[400], fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 0.5 },
  bottomContent: {},
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.text.primary,
    lineHeight: 48,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  features: { marginTop: spacing.xl, gap: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { color: colors.text.secondary, fontSize: fontSize.sm },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: spacing.xl, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
});
