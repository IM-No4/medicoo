import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

export default function QuickActionsSkeleton() {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.item}>
          <SkeletonBlock height={48} width={48} borderRadius={14} />
          <SkeletonBlock height={10} width={40} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 28,
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    width: '23%',
  },
});
