import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../lib/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section>
          <Row icon="person-outline"        label="Informations personnelles" />
          <Row icon="shield-checkmark-outline" label="Sécurité" />
          <Row icon="notifications-outline" label="Notifications" />
          <Row icon="language-outline"      label="Langue" trailing="Français" />
          <Row icon="cash-outline"          label="Devise"  trailing="EUR (€)" />
          <Row icon="lock-closed-outline"   label="Confidentialité" />
          <Row icon="document-text-outline" label="Conditions d'utilisation"
               onPress={() => Linking.openURL('https://itinifly.fr/terms')} />
          <Row icon="log-out-outline"       label="Déconnexion" danger
               onPress={() => Alert.alert('Déconnexion', 'Es-tu sûr ?', [
                 { text: 'Annuler' },
                 { text: 'OK', onPress: () => router.back() },
               ])} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ children }: any) {
  return <View style={styles.section}>{children}</View>;
}
function Row({ icon, label, trailing, danger, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bgSubtle }]}>
      <View style={[styles.iconBubble, danger && { backgroundColor: 'rgba(255,82,82,0.15)' }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.red[400] : colors.text.secondary} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: colors.red[400] }]}>{label}</Text>
      {trailing && <Text style={styles.trailing}>{trailing}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  scroll: { padding: spacing.lg },
  section: { backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBubble: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, color: colors.text.primary, fontSize: fontSize.base, fontWeight: '500' },
  trailing: { color: colors.text.muted, fontSize: fontSize.sm },
});
