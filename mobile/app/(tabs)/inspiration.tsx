import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDestinationImage } from '../../lib/destinationImages';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

const COLLECTIONS = [
  { title: '✨ Capitales européennes', destinations: ['Paris', 'Rome', 'Lisbonne', 'Berlin'] },
  { title: '🏝 Évasions tropicales',     destinations: ['Bali', 'Maldives', 'Phuket', 'Zanzibar'] },
  { title: '🗾 Asie incontournable',     destinations: ['Tokyo', 'Kyoto', 'Séoul', 'Bangkok'] },
  { title: '🌵 Aventure & nature',       destinations: ['Marrakech', 'Reykjavik', 'Cape Town', 'Cusco'] },
];

export default function InspirationScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        <View style={styles.header}>
          <Text style={styles.title}>Inspiration</Text>
          <Text style={styles.subtitle}>Des idées triées sur le volet pour ton prochain voyage</Text>
        </View>

        {COLLECTIONS.map((c) => (
          <View key={c.title} style={{ marginBottom: spacing.xl }}>
            <Text style={styles.sectionTitle}>{c.title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {c.destinations.map((d) => (
                <DestinationCard key={d} name={d} onPress={() => router.push(`/search?destination=${d}` as any)} />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function DestinationCard({ name, onPress }: { name: string; onPress: () => void }) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => { getDestinationImage(name).then(setImage); }, [name]);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ImageBackground source={image ? { uri: image } : undefined} style={styles.cardImage} imageStyle={{ borderRadius: radius.xl }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          locations={[0.4, 1]}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.xl }]}
        />
        <View style={styles.cardText}>
          <Text style={styles.cardName}>{name}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 4 },
  title: { fontSize: 32, fontWeight: '800', color: colors.text.primary },
  subtitle: { fontSize: fontSize.sm, color: colors.text.secondary },
  sectionTitle: {
    fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary,
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingRight: spacing.xl },
  card: { width: 160 },
  cardImage: { height: 200, justifyContent: 'flex-end', borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.bgElevated },
  cardText: { padding: spacing.md },
  cardName: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
});
