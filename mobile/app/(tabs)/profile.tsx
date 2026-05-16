import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { api } from '../../lib/api';
import { colors, fontSize, radius, spacing } from '../../lib/theme';

type ModalType = null | 'email' | 'password';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [modal, setModal] = useState<ModalType>(null);

  const initials = user?.email?.[0]?.toUpperCase() ?? '?';
  const displayName = user?.email?.split('@')[0] ?? 'Voyageur';

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
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            try { await api.deleteAccount(); await logout(); }
            catch (e: any) { Alert.alert('Erreur', e?.error || 'Impossible'); }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header avatar */}
        <View style={styles.headerSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            {user?.isPremium && (
              <View style={styles.premiumDot}>
                <Ionicons name="star" size={11} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{displayName.charAt(0).toUpperCase() + displayName.slice(1)}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {!user?.isPremium && (
          <Pressable onPress={() => router.push('/subscription' as any)} style={styles.premiumBanner}>
            <View style={styles.premiumIcon}>
              <Ionicons name="sparkles" size={20} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Passer en PREMIUM ✨</Text>
              <Text style={styles.premiumSub}>Voyage sans limites · 7 jours offerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>
        )}

        <View style={styles.menu}>
          <MenuRow icon="airplane-outline"          label="Mes voyages"   onPress={() => router.push('/(tabs)/favoris' as any)} />
          <MenuRow icon="people-outline"             label="Mes groupes"   onPress={() => router.push('/groups' as any)} />
          <MenuRow icon="heart-outline"              label="Mes favoris"   onPress={() => router.push('/(tabs)/favoris' as any)} />
          <MenuRow icon="images-outline"             label="Mes souvenirs" onPress={() => router.push('/souvenirs' as any)} />
          <MenuRow icon="settings-outline"           label="Paramètres"    onPress={() => router.push('/settings' as any)} />
          <MenuRow icon="help-circle-outline"        label="Aide & support" onPress={() => Linking.openURL('https://itinifly.fr')} />
        </View>

        {user?.isPremium && (
          <Pressable onPress={() => router.push('/subscription' as any)} style={styles.subRow}>
            <Ionicons name="star" size={18} color={colors.primary[500]} />
            <Text style={styles.subRowText}>Mon abonnement Premium</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </Pressable>
        )}

        <Pressable onPress={handleLogout} style={styles.outBtn}>
          <Ionicons name="log-out-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.outBtnText}>Se déconnecter</Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={[styles.outBtn, { marginTop: 0 }]}>
          <Ionicons name="trash-outline" size={18} color={colors.red[400]} />
          <Text style={[styles.outBtnText, { color: colors.red[400] }]}>Supprimer mon compte</Text>
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

function MenuRow({ icon, label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: colors.bgSubtle }]}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={colors.text.secondary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
    </Pressable>
  );
}

function EditEmailModal({ onClose, currentEmail, onSaved }: any) {
  const [email, setEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!email) { setError('Email requis'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email invalide'); return; }
    setLoading(true);
    try { await api.updateProfile({ email: email.trim() }); await onSaved(); onClose(); }
    catch (e: any) { setError(e?.error || 'Erreur'); }
    finally { setLoading(false); }
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
    if (next !== confirm) { setError('Ne correspondent pas'); return; }
    setLoading(true);
    try { await api.updateProfile({ currentPassword: current, newPassword: next }); Alert.alert('Succès', 'Mot de passe modifié'); onClose(); }
    catch (e: any) { setError(e?.error || 'Erreur'); }
    finally { setLoading(false); }
  };
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Changer le mot de passe</Text>
          <Input label="Actuel"     secureTextEntry value={current} onChangeText={setCurrent} />
          <Input label="Nouveau"    secureTextEntry value={next}    onChangeText={setNext} />
          <Input label="Confirmer"  secureTextEntry value={confirm} onChangeText={setConfirm} />
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  headerSection: { alignItems: 'center', paddingVertical: spacing.lg, gap: 4 },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, position: 'relative',
  },
  avatarText: { color: colors.white, fontSize: 32, fontWeight: '800' },
  premiumDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.amber[500],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.bg,
  },
  displayName: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: '800' },
  email: { color: colors.text.secondary, fontSize: fontSize.sm },

  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: radius.xl, padding: spacing.lg,
    marginTop: spacing.lg,
  },
  premiumIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { color: colors.white, fontSize: fontSize.base, fontWeight: '800' },
  premiumSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.xs, marginTop: 2 },

  menu: { marginTop: spacing.xl, backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSubtle, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: colors.text.primary, fontSize: fontSize.base, fontWeight: '500' },

  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2,
    borderRadius: radius.xl, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.primary[500] + '40',
  },
  subRowText: { flex: 1, color: colors.text.primary, fontWeight: '600' },

  outBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: spacing.lg, paddingVertical: spacing.md,
  },
  outBtnText: { color: colors.text.secondary, fontSize: fontSize.base, fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.bg, borderTopLeftRadius: radius['2xl'], borderTopRightRadius: radius['2xl'], padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary },
  errorBox: { backgroundColor: 'rgba(255,82,82,0.15)', color: colors.red[400], padding: spacing.md, borderRadius: radius.lg, fontSize: fontSize.sm },
});
