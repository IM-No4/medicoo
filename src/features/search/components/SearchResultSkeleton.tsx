import SkeletonBlock from '@/src/components/loaders/SkeletonBlock';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function SearchResultSkeleton() {
  return (
    <View style={styles.card}>
      {/* Left icon */}
      <SkeletonBlock
        height={40}
        width={40}
        borderRadius={12}
      />

      {/* Text content */}
      <View style={styles.content}>
        <SkeletonBlock height={14} width="70%" />
        <SkeletonBlock
          height={12}
          width="90%"
          style={{ marginTop: 8 }}
        />
        <SkeletonBlock
          height={12}
          width="40%"
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});
