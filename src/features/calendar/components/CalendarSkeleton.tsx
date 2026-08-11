import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

// Mirrors the real layout (Appointments + Medications sections, each with
// their own rows) so the screen doesn't flash from blank -> content, and the
// loading state reads as "this page" rather than a generic spinner.
export default function CalendarSkeleton() {
  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <SkeletonBlock height={20} width={150} />
      </View>
      <View style={styles.list}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.row}>
            <SkeletonBlock height={48} width={48} borderRadius={14} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <SkeletonBlock height={14} width="55%" style={{ marginBottom: 8 }} />
              <SkeletonBlock height={12} width="38%" style={{ marginBottom: 8 }} />
              <SkeletonBlock height={11} width="28%" />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <SkeletonBlock height={20} width={130} />
        <SkeletonBlock height={22} width={72} borderRadius={6} />
      </View>
      <View style={styles.list}>
        {[0, 1].map((i) => (
          <View key={i} style={styles.row}>
            <SkeletonBlock height={48} width={48} borderRadius={14} style={{ marginRight: 14 }} />
            <View style={{ flex: 1 }}>
              <SkeletonBlock height={14} width="55%" style={{ marginBottom: 8 }} />
              <SkeletonBlock height={12} width="38%" style={{ marginBottom: 8 }} />
              <SkeletonBlock height={11} width="28%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
  },
  list: {
    marginHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
});
