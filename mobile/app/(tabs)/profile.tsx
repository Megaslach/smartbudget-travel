import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../../lib/api';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

type ModalType = null | 'email' | 'password';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [modal, setModal] = useState<ModalType>(null);

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleUpgrade = async (plan: 'oneshot' | 'annual') => {
    try {
      const { url } = await api.createCheckoutSession(plan);
      Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('Erreur', err?.error || 'Impossible d’ouvrir le paiement');
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Es-tu sûr de vouloir te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est définitive. Tous tes voyages et données seront perdus.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              await logout();
            } catch (e: any) {
              Alert.alert('Erreur', e?.error || 'Impossible de supprimer le compte');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            {user?.isPremium && (
              <View style={styles.premiumDot}>
                <Ionicons name="star" size={12} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>
            {user?.isPremium ? `Premium · ${user.premiumPlan === 'annual' ? 'Annuel' : 'One-shot'}` : 'Gratuit'}
          </Text>
        </Card>

        {!user?.isPremium && (
          <Card style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Passe à Premium</Text>
            <Text style={styles.upgradeDesc}>
              Itinéraire IA personnalisé · Comparateur · Alerte de prix · Dates flexibles
            </Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <Button onPress={() => handleUpgrade('oneshot')} variant="outline" fullWidth>
                One-shot — 4,99€ (30 jours)
              </Button>
              <Button onPress={() => handleUpgrade('annual')} fullWidth>
                Annuel — 29€/an
              </Button>
            </View>
          </Card>
        )}

        <Section title="Compte">
          <Row icon="mail-outline" label="Modifier l'email" onPress={() => setModal('email')} />
          <Row icon="lock-closed-outline" label="Changer le mot de passe" onPress={() => setModal('password')} />
        </Section>

        <Section title="Aide">
          <Row icon="globe-outline" label="Site web" onPress={() => Linking.openURL('https://smartbudget-travel.netlify.app')} />
          <Row icon="document-text-outline" label="Conditions d'utilisation" onPress={() => Linking.openURL('https://smartbudget-travel.netlify.app')} />
        </Section>

        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color={colors.gray[600]} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={[styles.logoutBtn, { marginTop: 0 }]}>
          <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
          <Text style={[styles.logoutText, { color: colors.red[500] }]}>Supprimer mon compte</Text>
        </Pressable>
      </ScrollView>

      {modal === 'email' && (
        <EditEmailModal onClose={() => setModal(null)} currentEmail={user?.email || ''} onSaved={refreshUser} />
      )}
      {modal === 'password' && (
        <EditPasswordModal onClose={() => setModal(null)} />
      )}
    </SafeAreaView>
  );
}

function EditEmailModal({ onClose, currentEmail, onSaved }: any) {
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email) { setError('Email requis'); return; }
    setLoading(true);
    try {
      await api.updateProfile({ email });
      await onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Modifier l&apos;email</Text>
          <Input label="Nouvel email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {error && <Text style={styles.errorBox}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}><Button onPress={onClose} variant="outline" fullWidth>Annuler</Button></View>
            <View style={{ flex: 1 }}><Button onPress={handleSubmit} loading={loading} fullWidth>Enregistrer</Button></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EditPasswordModal({ onClose }: any) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!current || !next) { setError('Tous les champs sont requis'); return; }
    if (next.length < 6) { setError('Minimum 6 caractères'); return; }
    if (next !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    try {
      await api.updateProfile({ currentPassword: current, newPassword: next });
      Alert.alert('Succès', 'Mot de passe modifié');
      onClose();
    } catch (e: any) {
      setError(e?.error || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Changer le mot de passe</Text>
          <Input label="Mot de passe actuel" secureTextEntry value={current} onChangeText={setCurrent} />
          <Input label="Nouveau mot de passe" secureTextEntry value={next} onChangeText={setNext} />
          <Input label="Confirmer" secureTextEntry value={confirm} onChangeText={setConfirm} />
          {error && <Text style={styles.errorBox}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}><Button onPress={onClose} variant="outline" fullWidth>Annuler</Button></View>
            <View style={{ flex: 1 }}><Button onPress={handleSubmit} loading={loading} fullWidth>Enregistrer</Button></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Section({ title, children }: any) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card noPadding style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function Row({ icon, label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gray[50] }]}>
      <Ionicons name={icon} size={20} color={colors.gray[600]} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand[50] },
  scroll: { padding: spacing.lg },
  profileCard: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.primary[700],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, position: 'relative',
  },
  avatarText: { color: colors.white, fontSize: fontSize['2xl'], fontWeight: '700' },
  premiumDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: radius.full,
    backgroundColor: colors.amber[500],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  email: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  role: { fontSize: fontSize.sm, color: colors.gray[500] },
  upgradeCard: { marginTop: spacing.lg },
  upgradeTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  upgradeDesc: { fontSize: fontSize.sm, color: colors.gray[600], marginTop: 4, lineHeight: 20 },
  sectionTitle: {
    fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[500],
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm, paddingHorizontal: spacing.xs,
  },
  sectionCard: { overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    borderBottomWidth: 1, borderBottomColor: colors.gray[100],
  },
  rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.gray[800] },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.lg, padding: spacing.md,
  },
  logoutText: { color: colors.gray[600], fontSize: fontSize.base, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'],
    padding: spacing.lg, gap: spacing.md,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900] },
  errorBox: { backgroundColor: '#FEE2E2', color: colors.red[600], padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm },
});
