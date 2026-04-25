import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar, LocaleConfig, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

// French locale for the calendar
LocaleConfig.locales.fr = {
  monthNames: [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ],
  monthNamesShort: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  dayNames: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  dayNamesShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

interface Props {
  label: string;
  required?: boolean;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

const toIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (iso: string) => {
  if (!iso) return '';
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DateField({ label, required, value, onChange, minDate, maxDate, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(value);

  const handleDayPress = (day: DateData) => {
    setSelected(day.dateString);
  };

  const confirm = () => {
    onChange(selected);
    setOpen(false);
  };

  const minDateStr = minDate ? toIso(minDate) : undefined;
  const maxDateStr = maxDate ? toIso(maxDate) : undefined;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.red[500] }}> *</Text>}
      </Text>

      <Pressable onPress={() => { setSelected(value || toIso(new Date())); setOpen(true); }} style={styles.field}>
        <Ionicons name="calendar-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8 }} />
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDisplay(value) : (placeholder || 'Sélectionner')}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />
          <View style={styles.modalCard}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{label}</Text>

            <Calendar
              current={selected || undefined}
              onDayPress={handleDayPress}
              minDate={minDateStr}
              maxDate={maxDateStr}
              markedDates={selected ? { [selected]: { selected: true, selectedColor: colors.primary[700] } } : {}}
              theme={{
                backgroundColor: colors.white,
                calendarBackground: colors.white,
                textSectionTitleColor: colors.gray[500],
                selectedDayBackgroundColor: colors.primary[700],
                selectedDayTextColor: colors.white,
                todayTextColor: colors.accent[500],
                dayTextColor: colors.gray[900],
                textDisabledColor: colors.gray[300],
                arrowColor: colors.primary[700],
                monthTextColor: colors.gray[900],
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
                textMonthFontSize: 16,
                textDayFontSize: 14,
                textDayHeaderFontSize: 12,
                textDayHeaderFontWeight: '600',
              }}
              firstDay={1}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button onPress={() => setOpen(false)} variant="outline" fullWidth>Annuler</Button>
              </View>
              <View style={{ flex: 2 }}>
                <Button onPress={confirm} disabled={!selected} fullWidth>Valider</Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  value: { fontSize: fontSize.base, color: colors.gray[900] },
  placeholder: { fontSize: fontSize.base, color: colors.gray[400] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.gray[300], alignSelf: 'center', marginBottom: spacing.sm },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.gray[900], textAlign: 'center', marginBottom: spacing.md },
});
