import AppIcon from '@/src/components/icons/AppIcon';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

type Props = {
  items: string[];
  onSelect: (item: string) => void;
  onClear: () => void;
};

export default function RecentSearches({ items, onSelect, onClear }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('recent_searches')}</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearText}>{t('clear')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bubbleContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.bubble}
            activeOpacity={0.6}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            onPress={() => onSelect(item)}
          >
            <AppIcon name="clock" size={14} color={theme.textSecondary} />
            <Text style={styles.bubbleText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EB6E25',
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cardSecondary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 42,
    borderRadius: 21,
    gap: 6,
  },
  bubbleText: {
    fontSize: 13,
    color: c.text,
    fontWeight: '500',
  },
});
