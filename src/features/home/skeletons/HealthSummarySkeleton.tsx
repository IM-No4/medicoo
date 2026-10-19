import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export default function HealthSummarySkeleton() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
