import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

export default function HealthSummarySkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={16} width={140} />
      <View style={styles.row}>
        <SkeletonBlock height={70} borderRadius={14} />
        <SkeletonBlock height={70} borderRadius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
