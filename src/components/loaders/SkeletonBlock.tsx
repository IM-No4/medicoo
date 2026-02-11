import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

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

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E5E7EB',
  },
});
