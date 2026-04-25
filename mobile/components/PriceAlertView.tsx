import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import type { PricePoint } from '@smartbudget/shared';
import { formatCurrency } from '@smartbudget/shared';
import Card from './Card';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props {
  simulationId: string;
  initialEnabled?: boolean;
  initialThreshold?: number;
}

const THRESHOLDS = [5, 10, 15, 20];

export default function PriceAlertView({ simulationId, initialEnabled = false, initialThreshold = 10 }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPriceHistory(simulationId)
      .then(({ history: h }) => setHistory(h))
      .catch(() => {});
  }, [simulationId]);

  const persist = async (next: { enabled?: boolean; threshold?: number }) => {
    setLoading(true);
    try {
      const merged = { enabled: next.enabled ?? enabled, threshold: next.threshold ?? threshold };
      await api.updatePriceAlert(simulationId, merged);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    const v = !enabled;
    setEnabled(v);
    await persist({ enabled: v });
  };

  const setT = async (t: number) => {
    setThreshold(t);
    await persist({ threshold: t });
  };

  const first = history[0];
  const last = history[history.length - 1];
  const diff = first && last ? last.total - first.total : 0;
  const pct = first && first.total ? (diff / first.total) * 100 : 0;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: enabled ? colors.emerald[500] : colors.gray[400] }]}>
          <Ionicons name={enabled ? 'notifications' : 'notifications-off-outline'} size={16} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Alerte de prix</Text>
        {loading && <ActivityIndicator size="small" color={colors.primary[600]} style={{ marginLeft: 'auto' }} />}
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{enabled ? 'Activée' : 'Désactivée'}</Text>
            <Text style={styles.sub}>
              {enabled
                ? `On te prévient si le prix change de ±${threshold}%`
                : 'Recevoir une notif quand le prix bouge'}
            </Text>
          </View>
          <Pressable
            onPress={toggle}
            style={[styles.toggleBtn, enabled ? styles.toggleOn : styles.toggleOff]}
          >
            <View style={[styles.toggleKnob, enabled ? { alignSelf: 'flex-end' } : null]} />
          </Pressable>
        </View>

        {enabled && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.subHeader}>Seuil de variation</Text>
            <View style={styles.thresholdRow}>
              {THRESHOLDS.map((t) => {
                const active = threshold === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setT(t)}
                    style={[styles.thresholdBtn, active && styles.thresholdActive]}
                  >
                    <Text style={[styles.thresholdText, active && { color: colors.white }]}>±{t}%</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {history.length >= 2 && (
          <View style={styles.historyBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.subHeader}>Historique</Text>
              <View style={[styles.trendBadge, { backgroundColor: diff > 0 ? '#FEE2E2' : '#D1FAE5' }]}>
                <Ionicons
                  name={diff > 0 ? 'trending-up' : 'trending-down'}
                  size={11}
                  color={diff > 0 ? colors.red[500] : colors.emerald[600]}
                />
                <Text style={[styles.trendText, { color: diff > 0 ? colors.red[500] : colors.emerald[600] }]}>
                  {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                </Text>
              </View>
            </View>
            <View style={styles.sparkline}>
              {history.slice(-10).map((p, i, arr) => {
                const min = Math.min(...arr.map(x => x.total));
                const max = Math.max(...arr.map(x => x.total));
                const range = max - min || 1;
                const h = ((p.total - min) / range) * 40 + 4;
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={[styles.bar, { height: h, backgroundColor: i === arr.length - 1 ? colors.primary[700] : colors.primary[300] }]} />
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.minMax}>{formatCurrency(first.total)}</Text>
              <Text style={styles.minMax}>{formatCurrency(last.total)}</Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 32, height: 32, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  title: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  sub: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  toggleBtn: { width: 50, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.emerald[500] },
  toggleOff: { backgroundColor: colors.gray[300] },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
  subHeader: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.4 },
  thresholdRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  thresholdBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: colors.gray[100], borderRadius: radius.lg },
  thresholdActive: { backgroundColor: colors.primary[700] },
  thresholdText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[700] },
  historyBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray[100] },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  trendText: { fontSize: 11, fontWeight: '700' },
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 3, marginTop: 4 },
  bar: { width: '90%', borderRadius: 2 },
  minMax: { fontSize: fontSize.xs, color: colors.gray[400] },
});
