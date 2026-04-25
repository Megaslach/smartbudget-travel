import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AiTipsResult, SmartTip } from '@smartbudget/shared';
import { formatCurrency } from '@smartbudget/shared';
import Card from './Card';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props { tips: AiTipsResult }

const OUTLOOK_MAP = {
  rising:  { icon: 'trending-up-outline'   as const, label: 'En hausse',  color: colors.red[500],     bg: '#FEE2E2' },
  stable:  { icon: 'remove-outline'         as const, label: 'Stable',     color: colors.amber[500],   bg: colors.amber[100] },
  falling: { icon: 'trending-down-outline' as const, label: 'En baisse',  color: colors.emerald[500], bg: '#D1FAE5' },
};

export default function AiTipsView({ tips }: Props) {
  const outlook = OUTLOOK_MAP[tips.priceOutlook];
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bulb-outline" size={16} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Conseils IA</Text>
      </View>

      <Card style={[styles.outlookCard, { backgroundColor: outlook.bg }]}>
        <View style={styles.outlookRow}>
          <Ionicons name={outlook.icon} size={20} color={outlook.color} />
          <Text style={[styles.outlookLabel, { color: outlook.color }]}>Tendance prix : {outlook.label}</Text>
        </View>
        {!!tips.priceOutlookNote && <Text style={styles.outlookNote}>{tips.priceOutlookNote}</Text>}
      </Card>

      {!!tips.bestBookingWindow && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary[700]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingLabel}>Meilleure fenêtre de réservation</Text>
              <Text style={styles.bookingValue}>{tips.bestBookingWindow}</Text>
            </View>
          </View>
        </Card>
      )}

      {tips.tips?.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          {tips.tips.map((t, i) => <TipRow key={i} tip={t} />)}
        </View>
      )}
    </View>
  );
}

function TipRow({ tip }: { tip: SmartTip }) {
  return (
    <Card style={tip.isPremium ? styles.tipPremium : undefined}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Text style={styles.tipEmoji}>{tip.icon || '💡'}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            {tip.isPremium && (
              <View style={styles.premBadge}>
                <Ionicons name="lock-closed" size={10} color={colors.amber[500]} />
                <Text style={styles.premText}>Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.tipDesc}>{tip.description}</Text>
          {!!tip.potentialSaving && tip.potentialSaving > 0 && (
            <View style={styles.savingBadge}>
              <Text style={styles.savingText}>Économise jusqu&apos;à {formatCurrency(tip.potentialSaving)}</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 32, height: 32, borderRadius: radius.lg,
    backgroundColor: colors.accent[500],
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  outlookCard: { borderColor: 'transparent' },
  outlookRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outlookLabel: { fontSize: fontSize.base, fontWeight: '700' },
  outlookNote: { fontSize: fontSize.sm, color: colors.gray[700], marginTop: 4, lineHeight: 18 },
  bookingLabel: { fontSize: fontSize.xs, color: colors.gray[500], fontWeight: '600' },
  bookingValue: { fontSize: fontSize.sm, color: colors.gray[900], fontWeight: '700', marginTop: 2 },
  tipPremium: { backgroundColor: colors.amber[100] + '40', borderColor: colors.amber[400] + '60' },
  tipEmoji: { fontSize: 22 },
  tipTitle: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  tipDesc: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 4, lineHeight: 18 },
  savingBadge: {
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, marginTop: 6,
  },
  savingText: { fontSize: 10, color: colors.emerald[600], fontWeight: '700' },
  premBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.amber[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  premText: { fontSize: 9, color: colors.amber[500], fontWeight: '700' },
});
