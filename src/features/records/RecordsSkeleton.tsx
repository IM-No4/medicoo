import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from '../../components/loaders/SkeletonBlock';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

// Mirrors the real layout (search bar + 2-column folder grid) so the
// loading state reads as "this page" rather than a generic spinner.
export default function RecordsSkeleton() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <SkeletonBlock height={54} borderRadius={14} style={{ marginBottom: 14 }} />

      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.folderCard}>
            <View style={styles.folderTopRow}>
              <SkeletonBlock height={44} width={44} borderRadius={12} />
            </View>
            <SkeletonBlock height={14} width="80%" style={{ marginTop: 14, marginBottom: 6 }} />
            <SkeletonBlock height={12} width="50%" style={{ marginBottom: 16 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48.5%',
    backgroundColor: c.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  folderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
