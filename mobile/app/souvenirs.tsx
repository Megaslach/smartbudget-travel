import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../lib/theme';

const { width } = Dimensions.get('window');
const PHOTO_COL = 3;
const PHOTO_SIZE = (width - spacing.lg * 2 - spacing.sm * (PHOTO_COL - 1)) / PHOTO_COL;

type Tab = 'Photos' | 'Lieux' | 'Activités';

const MOCK_PHOTOS = [
  { id: '1', dest: 'Barcelone', uri: 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&w=400' },
  { id: '2', dest: 'Barcelone', uri: 'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&w=400' },
  { id: '3', dest: 'Paris', uri: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=400' },
  { id: '4', dest: 'Paris', uri: 'https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&w=400' },
  { id: '5', dest: 'Lisbonne', uri: 'https://images.pexels.com/photos/3566187/pexels-photo-3566187.jpeg?auto=compress&w=400' },
  { id: '6', dest: 'Lisbonne', uri: 'https://images.pexels.com/photos/1534560/pexels-photo-1534560.jpeg?auto=compress&w=400' },
  { id: '7', dest: 'Rome', uri: 'https://images.pexels.com/photos/2064827/pexels-photo-2064827.jpeg?auto=compress&w=400' },
  { id: '8', dest: 'Rome', uri: 'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&w=400' },
  { id: '9', dest: 'Tokyo', uri: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&w=400' },
  { id: '10', dest: 'Tokyo', uri: 'https://images.pexels.com/photos/2187605/pexels-photo-2187605.jpeg?auto=compress&w=400' },
  { id: '11', dest: 'Barcelone', uri: 'https://images.pexels.com/photos/2079451/pexels-photo-2079451.jpeg?auto=compress&w=400' },
  { id: '12', dest: 'Paris', uri: 'https://images.pexels.com/photos/1590386/pexels-photo-1590386.jpeg?auto=compress&w=400' },
];

const MOCK_PLACES = [
  { id: '1', name: 'Sagrada Família', dest: 'Barcelone', emoji: '⛪', date: 'Juil 2024' },
  { id: '2', name: 'Tour Eiffel', dest: 'Paris', emoji: '🗼', date: 'Juin 2024' },
  { id: '3', name: 'Château de Belém', dest: 'Lisbonne', emoji: '🏰', date: 'Mai 2024' },
  { id: '4', name: 'Colisée', dest: 'Rome', emoji: '🏛️', date: 'Avr 2024' },
  { id: '5', name: 'Senso-ji', dest: 'Tokyo', emoji: '⛩️', date: 'Mar 2024' },
];

const MOCK_ACTIVITIES = [
  { id: '1', name: 'Visite flamenco', dest: 'Barcelone', emoji: '💃', date: 'Juil 2024', rating: 5 },
  { id: '2', name: 'Croisière Seine', dest: 'Paris', emoji: '⛵', date: 'Juin 2024', rating: 4 },
  { id: '3', name: 'Surf Cascais', dest: 'Lisbonne', emoji: '🏄', date: 'Mai 2024', rating: 5 },
  { id: '4', name: 'Pasta Making', dest: 'Rome', emoji: '🍝', date: 'Avr 2024', rating: 5 },
];

const TABS: Tab[] = ['Photos', 'Lieux', 'Activités'];

export default function SouvenirsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Photos');

  const handleAdd = () => {
    Alert.alert(
      'Ajouter des souvenirs',
      'La fonctionnalité d\'ajout de photos depuis votre galerie sera disponible prochainement.',
      [{ text: 'Ok', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes souvenirs</Text>
        <Pressable onPress={handleAdd} hitSlop={10} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.primary[500]} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'Photos' && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{MOCK_PHOTOS.length}</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{[...new Set(MOCK_PHOTOS.map(p => p.dest))].length}</Text>
                <Text style={styles.statLabel}>Destinations</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Voyages</Text>
              </View>
            </View>

            {/* Photo grid */}
            <View style={styles.grid}>
              {MOCK_PHOTOS.map((p, i) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [styles.photoWrap, pressed && { opacity: 0.8 }]}
                >
                  <Image source={{ uri: p.uri }} style={styles.photo} />
                  {i === 0 && (
                    <View style={styles.destBadge}>
                      <Text style={styles.destBadgeText}>{p.dest}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleAdd} style={styles.addPhotoBtn}>
              <Ionicons name="camera-outline" size={20} color={colors.primary[500]} />
              <Text style={styles.addPhotoBtnText}>Ajouter des photos</Text>
            </Pressable>
          </>
        )}

        {activeTab === 'Lieux' && (
          <View style={styles.listSection}>
            {MOCK_PLACES.map(place => (
              <View key={place.id} style={styles.listCard}>
                <Text style={styles.listEmoji}>{place.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{place.name}</Text>
                  <Text style={styles.listMeta}>{place.dest} · {place.date}</Text>
                </View>
                <Ionicons name="location-outline" size={16} color={colors.text.muted} />
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Activités' && (
          <View style={styles.listSection}>
            {MOCK_ACTIVITIES.map(act => (
              <View key={act.id} style={styles.listCard}>
                <Text style={styles.listEmoji}>{act.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{act.name}</Text>
                  <Text style={styles.listMeta}>{act.dest} · {act.date}</Text>
                </View>
                <View style={styles.ratingRow}>
                  {Array.from({ length: act.rating }).map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color={colors.amber[400]} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary[500] + '22', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primary[500] + '44',
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1, paddingVertical: spacing.md,
    alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: colors.primary[500] },
  tabLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text.muted },
  tabLabelActive: { color: colors.primary[500] },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.bgElevated,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg, alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.text.muted, fontWeight: '600' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
  },
  photoWrap: {
    width: PHOTO_SIZE, height: PHOTO_SIZE,
    borderRadius: radius.lg, overflow: 'hidden', position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  destBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
  },
  destBadgeText: { color: colors.white, fontSize: fontSize.xs, fontWeight: '700' },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing.xl,
    borderWidth: 1.5, borderColor: colors.primary[500] + '55',
    borderStyle: 'dashed', borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary[500] + '0A',
  },
  addPhotoBtnText: { color: colors.primary[500], fontSize: fontSize.base, fontWeight: '700' },
  listSection: { gap: spacing.sm },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgElevated, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  listEmoji: { fontSize: 28 },
  listName: { fontSize: fontSize.base, fontWeight: '700', color: colors.text.primary },
  listMeta: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', gap: 2 },
});
