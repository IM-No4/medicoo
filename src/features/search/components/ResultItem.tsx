import AppIcon from '@/src/components/icons/AppIcon';
import { SearchResult } from '@/src/search/search.types';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

type Props = {
  item: SearchResult;
  onPress: () => void;
};

export default function ResultItem({ item, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.icon}>
        <AppIcon
          name={getIcon(item.domain)}
          size={18}
          color={theme.text}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function getIcon(domain: SearchResult['domain']) {
  switch (domain) {
    case 'doctor':
      return 'stethoscope';
    case 'medicine':
      return 'pill';
    case 'lab_test':
      return 'flask';
    case 'pharmacy':
      return 'store';
    default:
      return 'search';
  }
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  subtitle: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
});
