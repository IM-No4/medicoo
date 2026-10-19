import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../components/ThemedModal';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { BANKS } from '../banks';
import type { Bank } from '../types';
import { BankLogo } from './BrandIcon';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (bank: Bank) => void;
}

// Searchable list of every bank we can take netbanking for.
export default function BankSheet({ visible, onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? BANKS.filter((b) => b.name.toLowerCase().includes(q)) : BANKS;
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
          <Text style={styles.title}>Select your bank</Text>
          <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.search}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks"
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={<Text style={styles.empty}>No bank found</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <BankLogo bank={item} size={36} />
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: c.card,
    },
    title: { fontSize: 17, fontWeight: '700', color: c.text },
    close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cardSecondary },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      margin: 16,
      height: 46,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    searchInput: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 0 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.borderLight, backgroundColor: c.card },
    badge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.cardSecondary },
    badgeText: { fontSize: 15, fontWeight: '800', color: c.textSecondary },
    name: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    empty: { textAlign: 'center', color: c.textMuted, marginTop: 40 },
  });
