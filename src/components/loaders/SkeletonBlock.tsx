import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

interface Props {
  height: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonBlock({
  height,
  width = '100%',
  borderRadius = 12,
  style,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        { height, width, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  block: {
    backgroundColor: c.cardSecondary,
  },
});
