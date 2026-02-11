import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';

export default function UpcomingSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={16} width={100} />
      <SkeletonBlock
        height={60}
        borderRadius={14}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
});
