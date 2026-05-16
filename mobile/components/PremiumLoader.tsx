import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../lib/theme';

const { width } = Dimensions.get('window');

const DEFAULT_MESSAGES = [
  'Nos équipes calculent vos vacances idéales…',
  'Préparation du meilleur itinéraire pour vous…',
  'Recherche des meilleures offres voyage…',
  'Création de votre expérience parfaite…',
  'Analyse des préférences voyageurs…',
  'Optimisation de votre budget voyage…',
  'Comparaison des destinations disponibles…',
];

interface Props {
  messages?: string[];
  showMessages?: boolean;
}

export default function PremiumLoader({ messages = DEFAULT_MESSAGES, showMessages = true }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);

  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const planeX = useRef(new Animated.Value(-80)).current;
  const planeY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1.35, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.05, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.18, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Airplane flight
    let flyTimeout: ReturnType<typeof setTimeout>;
    const flyPlane = () => {
      planeX.setValue(-80);
      Animated.timing(planeX, {
        toValue: width + 80,
        duration: 2700,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => { flyTimeout = setTimeout(flyPlane, 900); });
    };
    const startDelay = setTimeout(flyPlane, 700);

    // Airplane bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(planeY, { toValue: -8, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(planeY, { toValue: 8, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Progress loop
    const runProgress = () => {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start(() => setTimeout(runProgress, 200));
    };
    runProgress();

    // Message cycling
    let msgInterval: ReturnType<typeof setInterval> | undefined;
    if (showMessages) {
      msgInterval = setInterval(() => {
        Animated.timing(msgOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
          setMsgIdx(i => (i + 1) % messages.length);
          Animated.timing(msgOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
        });
      }, 2600);
    }

    return () => {
      clearTimeout(startDelay);
      clearTimeout(flyTimeout);
      if (msgInterval) clearInterval(msgInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Radial glow */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoIcon}>
          <Ionicons name="heart" size={64} color={colors.primary[500]} />
          <View style={styles.planeBadge}>
            <Ionicons name="airplane" size={32} color={colors.white} />
          </View>
        </View>
        <Text style={styles.logoText}>
          itini<Text style={{ color: colors.primary[500] }}>fly</Text>
        </Text>
      </Animated.View>

      {/* Flying airplane */}
      <View style={styles.planeTrack} pointerEvents="none">
        <Animated.View style={[styles.flyingPlane, { transform: [{ translateX: planeX }, { translateY: planeY }] }]}>
          <Ionicons name="airplane" size={28} color={colors.primary[400]} />
        </Animated.View>
      </View>

      {/* Message */}
      {showMessages && (
        <Animated.Text style={[styles.message, { opacity: msgOpacity }]}>
          {messages[msgIdx]}
        </Animated.Text>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressBar, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary[500],
  },
  logoWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoIcon: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planeBadge: {
    position: 'absolute',
    top: 8,
    right: 0,
    transform: [{ rotate: '-35deg' }],
  },
  logoText: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  planeTrack: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    height: 50,
    overflow: 'hidden',
  },
  flyingPlane: {
    position: 'absolute',
  },
  message: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    lineHeight: 22,
  },
  progressTrack: {
    width: '52%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
});
