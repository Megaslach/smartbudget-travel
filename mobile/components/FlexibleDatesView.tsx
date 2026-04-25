import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import type { FlexibleDatesScanResponse } from '@smartbudget/shared';
import { formatCurrency, formatShortDate } from '@smartbudget/shared';
import Card from './Card';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props {
  simulationId: string;
  isPremium: boolean;
}

export default function FlexibleDatesView({ simulationId, isPremium }: Props) {
  const [scan, setScan] = useState<FlexibleDatesScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await api.scanFlexibleDates(simulationId);
      setScan(r);
    } catch (e: any) {
      setError(e?.error || 'Erreur lors du scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="calendar-clear-outline" size={16} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Dates flexibles</Text>
      </View>

      <Card>
        <Text style={styles.title}>Scanne les jours alentour</Text>
        <Text style={styles.desc}>
          On compare les prix réels sur ±7 jours pour trouver le meilleur créneau.
        </Text>
        <Button onPress={handleScan} loading={loading} disabled={!isPremium} fullWidth style={{ marginTop: spacing.md }}>
          {isPremium ? 'Lancer le scan' : 'Disponible avec Premium'}
        </Button>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {scan && scan.results.length > 0 && (
          <View style={{ marginTop: spacing.md, gap: 8 }}>
            <Text style={styles.subHeader}>
              Base : {formatCurrency(scan.basePricePerPerson)}/pers
            </Text>
            {scan.results.slice(0, 5).map((r, i) => (
              <View key={i} style={styles.scanRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.scanLabel}>{r.label}</Text>
                    <View style={styles.offsetBadge}>
                      <Text style={styles.offsetText}>{r.offsetDays > 0 ? '+' : ''}{r.offsetDays}j</Text>
                    </View>
                  </View>
                  <Text style={styles.scanDates}>
                    {formatShortDate(r.startDate)} → {formatShortDate(r.endDate)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.scanPrice}>{formatCurrency(r.pricePerPerson)}</Text>
                  <Text style={styles.savingText}>−{formatCurrency(r.savingPerPerson)} ({r.savingPercent}%)</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {scan && scan.results.length === 0 && (
          <Text style={styles.emptyText}>Aucune date moins chère trouvée — tes dates actuelles sont déjà bonnes.</Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { width: 32, height: 32, borderRadius: radius.lg, backgroundColor: colors.indigo[500], alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.gray[900] },
  title: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  desc: { fontSize: fontSize.sm, color: colors.gray[500], marginTop: 2, lineHeight: 18 },
  subHeader: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.4 },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.gray[50], padding: spacing.md, borderRadius: radius.lg },
  scanLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[900] },
  scanDates: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 2 },
  scanPrice: { fontSize: fontSize.base, fontWeight: '700', color: colors.gray[900] },
  savingText: { fontSize: 10, color: colors.emerald[600], fontWeight: '700' },
  offsetBadge: { backgroundColor: colors.indigo[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  offsetText: { fontSize: 9, fontWeight: '700', color: colors.indigo[600] },
  emptyText: { fontSize: fontSize.sm, color: colors.gray[500], textAlign: 'center', marginTop: spacing.md },
  errorText: { fontSize: fontSize.sm, color: colors.red[500], marginTop: spacing.md },
});
