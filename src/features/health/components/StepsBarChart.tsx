import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

interface Bucket {
  label: string;
  value: number;
}

interface Props {
  buckets: Bucket[];
  highlightIndex?: number | null;
  height?: number;
}

const TRACK_HEIGHT = 100;

export function StepsBarChart({ buckets, highlightIndex = null, height = TRACK_HEIGHT }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const maxValue = Math.max(...buckets.map((b) => b.value), 1);

  return (
    <View style={styles.row}>
      {buckets.map((bucket, i) => {
        const isHighlighted = i === highlightIndex;
        const heightPct = bucket.value > 0 ? Math.max((bucket.value / maxValue) * 100, 6) : 3;

        return (
          <View key={i} style={styles.column}>
            <View style={[styles.track, { height }]}>
              <View
                style={[
                  styles.bar,
                  { height: `${heightPct}%` },
                  isHighlighted ? styles.barHighlighted : styles.barNormal,
                ]}
              />
            </View>
            <Text style={styles.label} numberOfLines={1}>{bucket.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  track: {
    width: '100%',
    maxWidth: 18,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barNormal: {
    backgroundColor: '#6EE7B7',
  },
  barHighlighted: {
    backgroundColor: '#10B981',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: c.textMuted,
  },
});
