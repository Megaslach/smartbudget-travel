import { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, fontSize } from '../lib/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export default function Input({
  label, error, required, secureTextEntry, containerStyle, leftIcon, ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;
  const effectiveSecure = isPassword && !visible;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.red[500] }}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputBox, error ? styles.inputError : null]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={colors.text.muted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={effectiveSecure}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.muted}
            />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  inputError: { borderColor: colors.red[400] },
  eyeButton: { padding: spacing.xs },
  errorText: { fontSize: fontSize.sm, color: colors.red[500], marginTop: 2 },
});
