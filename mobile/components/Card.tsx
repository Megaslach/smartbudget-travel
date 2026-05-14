import { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../lib/theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export default function Card({ children, style, noPadding }: Props) {
  return (
    <View style={[styles.card, noPadding ? null : { padding: spacing.lg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
