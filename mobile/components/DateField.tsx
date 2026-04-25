import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { colors, fontSize, radius, spacing } from '../lib/theme';

interface Props {
  label: string;
  required?: boolean;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DateField({ label, required, value, onChange, minDate, maxDate, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ? new Date(value) : new Date());

  const handleChange = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (d && e.type === 'set') {
        onChange(toIsoDate(d));
      }
    } else if (d) {
      setTempDate(d);
    }
  };

  const confirmIos = () => {
    onChange(toIsoDate(tempDate));
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.red[500] }}> *</Text>}
      </Text>

      <Pressable onPress={() => setOpen(true)} style={styles.field}>
        <Ionicons name="calendar-outline" size={18} color={colors.gray[400]} style={{ marginRight: 8 }} />
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDisplay(value) : (placeholder || 'Sélectionner')}
        </Text>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} animationType="slide" transparent>
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={handleChange}
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button onPress={() => setOpen(false)} variant="outline" fullWidth>Annuler</Button>
                </View>
                <View style={{ flex: 1 }}>
                  <Button onPress={confirmIos} fullWidth>Valider</Button>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
  },
});
