import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, ImageBackground, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getDestinationImage } from '../../lib/destinationImages';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const IDEAS = [
  { name: 'Barcelone',  country: 'Espagne'  },
  { name: 'Lisbonne',   country: 'Portugal' },
];

const POPULAR = [
  { name: 'Bali',     country: 'Indonésie'  },
  { name: 'New York', country: 'États-Unis' },
  { name: 'Tokyo',    country: 'Japon'      },
  { name: 'Marrakech',country: 'Maroc'      },
];

export default function ExplorerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour {user?.email?.split('@')[0] || 'voyageur'} ! 👋</Text>
          <Pressable hitSlop={10} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.bellWrap}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
            </View>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={styles.title}>Où veux-tu partir ?</Text>

          <Pressable
            onPress={() => router.push('/search' as any)}
            style={styles.searchBar}
          >
            <Ionicons name="search-outline" size={20} color={colors.text.muted} />
            <Text style={styles.searchPlaceholder}>Rechercher une destination</Text>
          </Pressable>
        </View>

        <Section title="Idées pour toi" onSeeAll={() => router.push('/search' as any)}>
          <View style={styles.ideasGrid}>
            {IDEAS.map((d) => (
              <IdeaCard key={d.name} destination={d} onPress={() => router.push(`/search?destination=${d.name}` as any)} />
            ))}
          </View>
        </Section>

        <Section title="Destinations populaires" onSeeAll={() => router.push('/search' as any)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularList}>
            {POPULAR.map((d) => (
              <PopularCard key={d.name} destination={d} onPress={() => router.push(`/search?destination=${d.name}` as any)} />
            ))}
          </ScrollView>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, onSeeAll, children }: any) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.sectionLink}>Voir tout</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function IdeaCard({ destination, onPress }: any) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => { getDestinationImage(destination.name).then(setImage); }, [destination.name]);
  return (
    <Pressable onPress={onPress} style={styles.ideaCard}>
      <ImageBackground source={image ? { uri: image } : undefined} style={styles.ideaImage} imageStyle={{ borderRadius: radius.xl }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          locations={[0.4, 1]}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xl }]}
        />
        <View style={styles.ideaTextWrap}>
          <Text style={styles.ideaName}>{destination.name}</Text>
          <Text style={styles.ideaCountry}>{destination.country}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function PopularCard({ destination, onPress }: any) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => { getDestinationImage(destination.name).then(setImage); }, [destination.name]);
  return (
    <Pressable onPress={onPress} style={styles.popularCard}>
      <ImageBackground source={image ? { uri: image } : undefined} style={styles.popularImage} imageStyle={{ borderRadius: radius.xl }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          locations={[0.3, 1]}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xl }]}
        />
        <View style={styles.popularTextWrap}>
          <Text style={styles.popularName}>{destination.name}</Text>
          <Text style={styles.popularCountry}>{destination.country}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  greeting: { fontSize: fontSize.base, color: colors.text.secondary, fontWeight: '600' },
  bellWrap: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.lg },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
  },
  searchPlaceholder: { color: colors.text.muted, fontSize: fontSize.base },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary },
  sectionLink: { fontSize: fontSize.sm, color: colors.primary[500], fontWeight: '600' },

  ideasGrid: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  ideaCard: { flex: 1 },
  ideaImage: { height: 160, justifyContent: 'flex-end', borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.bgElevated },
  ideaTextWrap: { padding: spacing.md },
  ideaName: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
  ideaCountry: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs, marginTop: 2 },

  popularList: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingRight: spacing.xl },
  popularCard: { width: 140 },
  popularImage: { height: 180, justifyContent: 'flex-end', borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.bgElevated },
  popularTextWrap: { padding: spacing.md },
  popularName: { color: colors.white, fontSize: fontSize.base, fontWeight: '800' },
  popularCountry: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.xs, marginTop: 2 },
});
