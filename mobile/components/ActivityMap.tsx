import { View, Text, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ItineraryActivity, ItineraryCategory } from '@smartbudget/shared';
import { colors, fontSize, radius, spacing } from '../lib/theme';

const CATEGORY_COLOR: Record<ItineraryCategory, string> = {
  sight: colors.primary[600],
  food: colors.accent[500],
  activity: colors.indigo[500],
  transport: colors.gray[500],
  nature: colors.emerald[500],
  shopping: colors.sand[600],
  nightlife: '#A855F7',
};

const CATEGORY_EMOJI: Record<ItineraryCategory, string> = {
  sight: '🏛️',
  food: '🍽️',
  activity: '🎯',
  transport: '🚆',
  nature: '🌿',
  shopping: '🛍️',
  nightlife: '🍸',
};

interface Props {
  activities: ItineraryActivity[];
}

const openInMaps = (a: ItineraryActivity) => {
  const query = a.lat && a.lng ? `${a.lat},${a.lng}` : encodeURIComponent(a.location || a.title);
  const url = Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url);
};

export default function ActivityMap({ activities }: Props) {
  const valid = activities.filter(a => a.location || (a.lat && a.lng));
  if (valid.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={14} color={colors.gray[600]} />
        <Text style={styles.headerText}>Lieux ({valid.length}) — tape pour ouvrir dans Maps</Text>
      </View>
      <View style={{ gap: 8, marginTop: 8 }}>
        {valid.map((a, i) => {
          const cat = a.category as ItineraryCategory;
          const color = CATEGORY_COLOR[cat] || colors.primary[600];
          const emoji = CATEGORY_EMOJI[cat] || '📍';
          return (
            <Pressable key={i} onPress={() => openInMaps(a)}>
              {({ pressed }) => (
                <View style={[styles.row, pressed && { backgroundColor: colors.gray[100] }]}>
                  <View style={[styles.pin, { backgroundColor: color }]}>
                    <Text style={styles.pinEmoji}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.title} numberOfLines={1}>{a.title}</Text>
                    {!!a.location && <Text style={styles.location} numberOfLines={1}>{a.location}</Text>}
                  </View>
                  <Ionicons name="open-outline" size={16} color={colors.gray[400]} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.gray[50], borderRadius: radius.xl, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerText: { fontSize: fontSize.xs, color: colors.gray[600], fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 8, borderRadius: radius.lg },
  pin: { width: 36, height: 36, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  pinEmoji: { fontSize: 16 },
  title: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  location: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 1 },
});
