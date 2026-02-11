import AppIcon from '@/src/components/icons/AppIcon';
import { SearchResult } from '@/src/search/search.types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  item: SearchResult;
  onPress: () => void;
};

export default function ResultItem({ item, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.icon}>
        <AppIcon
          name={getIcon(item.domain)}
          size={18}
          color="#1F2937"
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
