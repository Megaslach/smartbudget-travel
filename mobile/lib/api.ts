import { ApiClient } from '@smartbudget/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://smartbudget-api.vercel.app/api';

export const TOKEN_STORAGE_KEY = 'smartbudget.auth.token';

export const api = new ApiClient({
  baseUrl: API_URL,
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
});
