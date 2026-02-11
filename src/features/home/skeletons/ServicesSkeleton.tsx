import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

export default function ServicesSkeleton() {
  return (
    <View style={styles.wrapper}>
      <SkeletonBlock height={16} width={120} style={{ marginLeft: 16 }} />
      <View style={styles.row}>
        {[1, 2, 3].map((i) => (
          <SkeletonBlock
            key={i}
            height={90}
            width={100}
            borderRadius={16}
            style={{ marginLeft: 16 }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    marginTop: 12,
  },
});
