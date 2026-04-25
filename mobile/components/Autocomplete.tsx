import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, FlatList,
  StyleSheet, ViewStyle, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { colors, fontSize, radius, spacing } from '../lib/theme';

type Mode = 'destination' | 'airport';

interface DestinationItem {
  name: string;
  country: string;
  countryCode: string;
  emoji: string;
  airports: { code: string; name: string }[];
  popular: boolean;
}

interface AirportItem {
  city: string;
  country: string;
  emoji: string;
  code: string;
  airportName: string;
}

interface Props {
  mode: Mode;
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  containerStyle?: ViewStyle;
}

export default function Autocomplete({
  mode, label, required, placeholder, value, onChange, containerStyle,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<(DestinationItem | AirportItem)[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value into local state
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2 || !open) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        if (mode === 'destination') {
          const { destinations } = await api.searchDestinations(query);
          setResults(destinations);
        } else {
          const { airports } = await api.searchAirports(query);
          setResults(airports);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, open]);

  const handleSelect = (item: DestinationItem | AirportItem) => {
    const display = mode === 'destination'
      ? `${(item as DestinationItem).name}, ${(item as DestinationItem).country}`
      : `${(item as AirportItem).city} (${(item as AirportItem).code})`;
    setQuery(display);
    onChange(display);
    setOpen(false);
    Keyboard.dismiss();
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setResults([]);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={{ color: colors.red[500] }}> *</Text>}
        </Text>
      )}

      <View style={styles.inputBox}>
        <Ionicons
          name={mode === 'destination' ? 'location-outline' : 'airplane-outline'}
          size={18}
          color={colors.gray[400]}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            onChange(t);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary[600]} style={{ marginLeft: 6 }} />}
        {!loading && query.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </Pressable>
        )}
      </View>

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${idx}-${(item as any).code || (item as any).name}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primary[50] }]}
              >
                {mode === 'destination' ? (
                  <DestinationRow item={item as DestinationItem} />
                ) : (
                  <AirportRow item={item as AirportItem} />
                )}
              </Pressable>
            )}
            style={{ maxHeight: 240 }}
          />
        </View>
      )}
    </View>
  );
}

function DestinationRow({ item }: { item: DestinationItem }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {item.country}
          {item.airports?.length ? ` · ${item.airports.slice(0, 2).map(a => a.code).join(', ')}` : ''}
        </Text>
      </View>
      {item.popular && <View style={styles.popBadge}><Text style={styles.popText}>★</Text></View>}
    </View>
  );
}

function AirportRow({ item }: { item: AirportItem }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{item.city}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{item.airportName}</Text>
      </View>
      <View style={styles.codeBadge}>
        <Text style={styles.codeText}>{item.code}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, position: 'relative' },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[700] },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, paddingVertical: spacing.md + 2, fontSize: fontSize.base, color: colors.gray[900] },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  row: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  rowTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  rowSub: { fontSize: fontSize.xs, color: colors.gray[500], marginTop: 1 },
  popBadge: { backgroundColor: colors.amber[100], width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  popText: { fontSize: 11, color: colors.amber[500] },
  codeBadge: { backgroundColor: colors.primary[100], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { fontSize: 11, fontWeight: '700', color: colors.primary[700] },
});
