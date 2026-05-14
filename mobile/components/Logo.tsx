import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../lib/theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: Props) {
  const iconSize = size === 'lg' ? 40 : size === 'md' ? 28 : 22;
  const textSize = size === 'lg' ? fontSize['3xl'] : size === 'md' ? fontSize.xl : fontSize.lg;

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { width: iconSize * 1.6, height: iconSize * 1.6 }]}>
        <Ionicons name="heart" size={iconSize} color={colors.primary[500]} />
        <View style={styles.planeOverlay}>
          <Ionicons name="airplane" size={iconSize * 0.55} color={colors.white} />
        </View>
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: textSize }]}>
          ITINI<Text style={{ color: colors.primary[500] }}>FLY</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planeOverlay: {
    position: 'absolute',
    transform: [{ translateY: -2 }],
  },
  text: {
    color: colors.text.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
