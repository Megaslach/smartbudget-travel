import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Itinerary, ItineraryActivity, ItineraryCategory, ItineraryTimeSlot } from '@smartbudget/shared';
import { formatCurrency } from '@smartbudget/shared';
import Card from './Card';
import { colors, fontSize, radius, spacing } from './../lib/theme';

interface Props {
  itinerary: Itinerary;
}

const CATEGORY_EMOJI: Record<ItineraryCategory, string> = {
  sight: '🏛️',
  food: '🍽️',
  activity: '🎯',
  transport: '🚆',
  nature: '🌿',
  shopping: '🛍️',
  nightlife: '🍸',
};

const TIME_LABELS: Record<ItineraryTimeSlot, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  morning: { label: 'Matin', icon: 'sunny-outline', color: colors.amber[500] },
  afternoon: { label: 'Après-midi', icon: 'partly-sunny-outline', color: colors.accent[500] },
  evening: { label: 'Soir', icon: 'moon-outline', color: colors.indigo[500] },
};

export default function ItineraryView({ itinerary }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const days = itinerary.days || [];

  if (days.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyText}>Itinéraire indisponible.</Text>
      </Card>
    );
  }

  const day = days[Math.min(activeIdx, days.length - 1)];
  const totalCost = (day.activities || []).reduce((s, a) => s + (a.estimatedCost || 0), 0);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={16} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Itinéraire jour par jour</Text>
          <Text style={styles.headerSub}>Personnalisé par IA</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {days.map((d, i) => {
          const active = activeIdx === i;
          return (
            <Pressable
              key={d.day}
              onPress={() => setActiveIdx(i)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabSmall, active && { color: colors.primary[100] }]}>JOUR {d.day}</Text>
              <Text
                style={[styles.tabTitle, active && { color: colors.white }]}
                numberOfLines={1}
              >
                {d.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayTitle}>{day.title}</Text>
            {!!day.summary && <Text style={styles.daySummary}>{day.summary}</Text>}
          </View>
          {totalCost > 0 && (
            <View style={styles.costBadge}>
              <Text style={styles.costText}>{formatCurrency(totalCost)}/pers</Text>
            </View>
          )}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {(day.activities || []).map((a, idx) => (
            <ActivityRow key={idx} activity={a} />
          ))}
          {(day.activities || []).length === 0 && (
            <Text style={styles.emptyText}>Aucune activité prévue ce jour.</Text>
          )}
        </View>
      </Card>
    </View>
  );
}

function ActivityRow({ activity }: { activity: ItineraryActivity }) {
  const time = TIME_LABELS[activity.time] || TIME_LABELS.morning;
  const emoji = CATEGORY_EMOJI[activity.category as ItineraryCategory] || '📍';

  const openInMaps = () => {
    if (activity.lat && activity.lng) {
      const url = `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`;
      Linking.openURL(url);
    } else if (activity.location) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`);
    }
  };

  return (
    <View style={styles.activityRow}>
      <View style={[styles.timeBubble, { backgroundColor: time.color + '20' }]}>
        <Ionicons name={time.icon} size={20} color={time.color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={styles.timeLabel}>{time.label}</Text>
          {!!activity.duration && <Text style={styles.metaSm}>· {activity.duration}</Text>}
          {activity.estimatedCost ? (
            <Text style={styles.metaSm}>· {formatCurrency(activity.estimatedCost)}</Text>
          ) : null}
        </View>
        <Text style={styles.actTitle}>{emoji} {activity.title}</Text>
        {!!activity.description && (
          <Text style={styles.actDesc}>{activity.description}</Text>
        )}
        {!!activity.location && (
          <Pressable onPress={openInMaps} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={12} color={colors.primary[600]} />
            <Text style={styles.locationLink} numberOfLines={1}>{activity.location}</Text>
          </Pressable>
        )}
        {!!activity.bookingUrl && (
          <Pressable onPress={() => Linking.openURL(activity.bookingUrl!)} style={{ marginTop: 4 }}>
            <Text style={styles.bookingLink}>Réserver →</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 32, height: 32, borderRadius: radius.lg,
    backgroundColor: colors.primary[600],
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  headerSub: { fontSize: fontSize.xs, color: colors.gray[500] },
  tab: {
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200],
    minWidth: 100, maxWidth: 160,
  },
  tabActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  tabSmall: { fontSize: 9, fontWeight: '700', color: colors.gray[400], letterSpacing: 0.5 },
  tabTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[800], marginTop: 2 },
  dayTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  daySummary: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2, lineHeight: 18 },
  costBadge: { backgroundColor: colors.emerald[400] + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  costText: { fontSize: fontSize.xs, color: colors.emerald[600], fontWeight: '700' },
  activityRow: { flexDirection: 'row', gap: spacing.md },
  timeBubble: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { fontSize: 10, fontWeight: '700', color: colors.gray[600], letterSpacing: 0.4, textTransform: 'uppercase' },
  metaSm: { fontSize: fontSize.xs, color: colors.gray[400] },
  actTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900], marginTop: 2 },
  actDesc: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 2, lineHeight: 18 },
  locationLink: { fontSize: fontSize.xs, color: colors.primary[600], textDecorationLine: 'underline' },
  bookingLink: { fontSize: fontSize.xs, color: colors.primary[700], fontWeight: '700' },
  emptyText: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center', padding: spacing.lg },
});
