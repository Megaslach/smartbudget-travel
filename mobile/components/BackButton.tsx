import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../lib/theme';

export default function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)}
      hitSlop={12}
      style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, paddingHorizontal: 4 })}
    >
      <Ionicons name="chevron-back" size={26} color={colors.primary[700]} />
    </Pressable>
  );
}
