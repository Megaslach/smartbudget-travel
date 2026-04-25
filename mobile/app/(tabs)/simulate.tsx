import { useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { api } from '../../lib/api';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

export default function SimulateScreen() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [people, setPeople] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateValid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  const handleSubmit = async () => {
    setError(null);
    if (!destination || !departureCity) {
      setError('Destination et ville de départ requises');
      return;
    }
    if (!dateValid(startDate) || !dateValid(endDate)) {
      setError('Format de date attendu: AAAA-MM-JJ');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('La date de retour doit être après la date de départ');
      return;
    }

    setLoading(true);
    try {
      const result = await api.simulate({
        destination, departureCity, startDate, endDate, people,
      });
      router.push(`/simulation/${result.simulation.id}`);
    } catch (err: any) {
      setError(err?.error || 'Erreur lors de la simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Simuler un voyage</Text>
        <Text style={styles.subtitle}>Remplis les détails, on calcule le reste.</Text>

        <Card style={styles.formCard}>
          <Input
            label="Destination"
            placeholder="ex: Bali, Lisbonne, Tokyo"
            required
            value={destination}
            onChangeText={setDestination}
          />
          <Input
            label="Ville de départ"
            placeholder="ex: Paris, Marseille"
            required
            value={departureCity}
            onChangeText={setDepartureCity}
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Départ"
                placeholder="2026-08-15"
                required
                value={startDate}
                onChangeText={setStartDate}
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Retour"
                placeholder="2026-08-22"
                required
                value={endDate}
                onChangeText={setEndDate}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.peopleRow}>
            <Text style={styles.peopleLabel}>Voyageurs</Text>
            <View style={styles.peopleControl}>
              <Pressable
                onPress={() => setPeople(Math.max(1, people - 1))}
                style={styles.peopleBtn}
              >
                <Ionicons name="remove" size={20} color={colors.gray[700]} />
              </Pressable>
              <Text style={styles.peopleValue}>{people}</Text>
              <Pressable
                onPress={() => setPeople(Math.min(10, people + 1))}
                style={styles.peopleBtn}
              >
                <Ionicons name="add" size={20} color={colors.gray[700]} />
              </Pressable>
            </View>
          </View>

          {error && <Text style={styles.errorBox}>{error}</Text>}

          <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">
            <Ionicons name="sparkles" size={18} color={colors.white} />
            {'  '}Estimer le budget
          </Button>
        </Card>

        <Text style={styles.disclaimer}>
          Les estimations sont basées sur des données réelles (vols, hôtels) quand disponibles, sinon sur l&apos;IA.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg },
  title: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.gray[900], marginBottom: 4 },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[500], marginBottom: spacing.lg },
  formCard: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  peopleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  peopleLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  peopleControl: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    backgroundColor: colors.gray[100], borderRadius: radius.lg, padding: 4,
  },
  peopleBtn: {
    width: 32, height: 32, borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  peopleValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900], minWidth: 24, textAlign: 'center' },
  errorBox: {
    backgroundColor: '#FEE2E2', color: colors.red[600],
    padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm,
  },
  disclaimer: {
    fontSize: fontSize.xs, color: colors.gray[400], textAlign: 'center',
    marginTop: spacing.lg, lineHeight: 16,
  },
});
