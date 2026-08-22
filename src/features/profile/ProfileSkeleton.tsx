import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../components/loaders/SkeletonBlock';

function GroupSkeleton({ rows }: { rows: number }) {
  return (
    <View style={styles.section}>
      <SkeletonBlock height={12} width={110} style={{ marginBottom: 12 }} />
      <View style={styles.groupCard}>
        {Array.from({ length: rows }).map((_, i) => (
          <View key={i} style={[styles.menuRow, i < rows - 1 && styles.menuRowDivider]}>
            <SkeletonBlock height={36} width={36} borderRadius={10} />
            <SkeletonBlock height={14} width="55%" style={{ marginLeft: 14 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Mirrors the real layout (gradient profile card, member ID row, then
// Account / Activity / Support menu groups) so the loading state reads as
// "this page" rather than a generic spinner.
export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={140} borderRadius={24} style={{ marginBottom: 16 }} />
      <SkeletonBlock height={14} width={160} style={{ marginBottom: 24, marginLeft: 20 }} />

      <GroupSkeleton rows={2} />
      <GroupSkeleton rows={3} />
      <GroupSkeleton rows={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});
