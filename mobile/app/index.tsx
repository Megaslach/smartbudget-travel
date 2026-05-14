import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

const ONBOARDING_KEY = 'itinifly.onboarded';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setHasOnboarded(v === 'true'))
      .catch(() => setHasOnboarded(false));
  }, []);

  if (isLoading || hasOnboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(auth)/login" />;
}
