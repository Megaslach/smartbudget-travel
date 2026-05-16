import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import BackButton from '../components/BackButton';
import { colors, fontSize } from '../lib/theme';

function RootNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ flex: 1 }} />
      </View>
    );
  }

  const stackHeaderOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.sand[50] },
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: fontSize.base, color: colors.gray[900] },
    headerTintColor: colors.primary[700],
    headerLeft: () => <BackButton />,
    headerBackVisible: false,
  };

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="search" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="groups/index" />
      <Stack.Screen name="groups/create" />
      <Stack.Screen name="groups/[id]" />
      <Stack.Screen name="group-invite/[token]" />
      <Stack.Screen name="simulation/[id]" options={{ ...stackHeaderOptions, title: 'Détails' }} />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="souvenirs" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
