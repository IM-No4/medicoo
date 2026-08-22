import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../components/loaders/SkeletonBlock';

// Mirrors the real notification card layout (icon circle + title/subtitle/
// time lines) so the loading state reads as "this page" rather than a
// generic spinner.
export default function NotificationsSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <SkeletonBlock height={44} width={44} borderRadius={22} />
          <View style={styles.content}>
            <SkeletonBlock height={14} width="60%" style={{ marginBottom: 8 }} />
            <SkeletonBlock height={12} width="90%" style={{ marginBottom: 6 }} />
            <SkeletonBlock height={12} width="70%" style={{ marginBottom: 8 }} />
            <SkeletonBlock height={10} width={60} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 4,
  },
  card: {
    marginHorizontal: 16,
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  content: {
    flex: 1,
  },
});
