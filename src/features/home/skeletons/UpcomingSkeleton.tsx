import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../../components/loaders/SkeletonBlock';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export default function UpcomingSkeleton() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
});
