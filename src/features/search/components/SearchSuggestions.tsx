import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '@/src/components/icons/AppIcon';
import { SearchSuggestion } from '@/src/search/search.types';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

type Props = {
  suggestions: SearchSuggestion[];
  onSelect: (item: SearchSuggestion) => void;
};

const getDomainDesign = (domain: string) => {
  switch (domain) {
    case 'medicine':
      return { icon: 'pill', bg: '#ECFDF5', text: '#059669', label: 'Medicine' };
    case 'pharmacy':
      return { icon: 'store', bg: '#FEF3C7', text: '#D97706', label: 'Pharmacy' };
    case 'composition':
      return { icon: 'flask-conical', bg: '#EFF6FF', text: '#2563EB', label: 'Composition' };
    case 'manufacturer':
      return { icon: 'briefcase', bg: '#F5F3FF', text: '#7C3AED', label: 'Manufacturer' };
    default:
      return { icon: 'search', bg: '#F3F4F6', text: '#6B7280', label: 'Other' };
  }
};

export default function SearchSuggestions({ suggestions, onSelect }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((item, index) => {
        const design = getDomainDesign(item.kind);
        return (
          <TouchableOpacity
            key={`${item.kind}-${item.id || item.title}-${index}`}
            style={styles.suggestionRow}
            onPress={() => onSelect(item)}
          >
            <View style={[styles.iconBox, { backgroundColor: design.bg }]}>
              <AppIcon name={design.icon as any} size={16} color={design.text} />
            </View>
            <Text style={styles.suggestionText} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.domainBadge, { backgroundColor: design.bg }]}>
              <Text style={[styles.domainText, { color: design.text }]}>
                {design.label}
              </Text>
            </View>
            <View style={styles.arrowIcon}>
              <AppIcon name="chevron-right" size={16} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        );
      })}
      <View style={styles.divider} />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    fontWeight: '500',
  },
  domainBadge: {
    backgroundColor: c.cardSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  domainText: {
    fontSize: 10,
    color: c.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  arrowIcon: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: c.cardSecondary,
    marginTop: 8,
    marginBottom: 8,
  },
});
