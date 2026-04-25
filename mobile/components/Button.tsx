import { ReactNode } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, fontSize } from '../lib/theme';

type Variant = 'primary' | 'accent' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function Button({
  children, onPress, variant = 'primary', size = 'md',
  disabled, loading, fullWidth, style,
}: Props) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    sizeStyles[size],
    variantStyles[variant].container,
    fullWidth ? styles.fullWidth : {},
    isDisabled ? styles.disabled : {},
    style || {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    sizeTextStyles[size],
    variantStyles[variant].text,
  ];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        ...containerStyle,
        pressed && !isDisabled ? styles.pressed : {},
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color as string} />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  text: { fontWeight: '700' },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md + 2 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
};

const sizeTextStyles: Record<Size, TextStyle> = {
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.base },
  lg: { fontSize: fontSize.lg },
};

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary[700] },
    text: { color: colors.white },
  },
  accent: {
    container: { backgroundColor: colors.accent[500] },
    text: { color: colors.white },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.gray[700] },
  },
  outline: {
    container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200] },
    text: { color: colors.gray[800] },
  },
};
