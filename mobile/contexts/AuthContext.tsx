import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@smartbudget/shared';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { user: userData } = await api.getMe();
      setUser(userData);
    } catch {
      setUser(null);
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      api.setToken(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        api.setToken(token);
        await refreshUser();
      }
      setIsLoading(false);
    })();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    api.setToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    const data = await api.register(email, password);
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    api.setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
