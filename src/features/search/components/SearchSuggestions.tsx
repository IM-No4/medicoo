import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '@/src/components/icons/AppIcon';
import { SearchResult } from '@/src/search/search.types';

type Props = {
  suggestions: SearchResult[];
  onSelect: (item: SearchResult) => void;
};

const getDomainDesign = (domain: string) => {
  switch (domain) {
    case 'medicine':
      return { icon: 'pill', bg: '#ECFDF5', text: '#059669', label: 'Medicine' };
    case 'pharmacy':
      return { icon: 'store', bg: '#FEF3C7', text: '#D97706', label: 'Pharmacy' };
    case 'doctor':
      return { icon: 'stethoscope', bg: '#EFF6FF', text: '#2563EB', label: 'Doctor' };
    default:
      return { icon: 'search', bg: '#F3F4F6', text: '#6B7280', label: 'Other' };
  }
};

export default function SearchSuggestions({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      {suggestions.map((item, index) => {
        const design = getDomainDesign(item.domain as string);
        return (
          <TouchableOpacity
            key={item.id + index}
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

const styles = StyleSheet.create({
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
    color: '#1F2937',
    fontWeight: '500',
  },
  domainBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  domainText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  arrowIcon: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 8,
  },
});
