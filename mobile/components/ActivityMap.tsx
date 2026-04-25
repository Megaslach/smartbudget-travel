import { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { ItineraryActivity, ItineraryCategory } from '@smartbudget/shared';
import { colors, radius } from '../lib/theme';

const CATEGORY_COLOR: Record<ItineraryCategory, string> = {
  sight: colors.primary[600],
  food: colors.accent[500],
  activity: colors.indigo[500],
  transport: colors.gray[500],
  nature: colors.emerald[500],
  shopping: colors.sand[600],
  nightlife: '#A855F7',
};

interface Props {
  activities: ItineraryActivity[];
  height?: number;
}

export default function ActivityMap({ activities, height = 220 }: Props) {
  const valid = activities.filter(a => a.lat && a.lng);

  const region = useMemo(() => {
    if (valid.length === 0) return null;
    const lats = valid.map(a => a.lat);
    const lngs = valid.map(a => a.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latDelta = Math.max(0.02, (maxLat - minLat) * 1.6);
    const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.6);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [valid]);

  if (!region || valid.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Pas de coordonnées disponibles pour cette journée.</Text>
      </View>
    );
  }

  // Web fallback: react-native-maps doesn't support web — show a simple list
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Carte disponible sur iOS/Android.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={region}
      >
        {valid.map((a, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: a.lat, longitude: a.lng }}
            title={a.title}
            description={a.location}
            pinColor={CATEGORY_COLOR[a.category as ItineraryCategory] || colors.primary[600]}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.gray[100] },
  empty: { borderRadius: radius.xl, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: { fontSize: 13, color: colors.gray[500], textAlign: 'center' },
});
