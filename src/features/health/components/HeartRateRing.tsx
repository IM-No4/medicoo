import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const heartImage = require('../../../assets/images/heart.png');

const RING_SIZE = 140;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Sampled from heart.png's own flesh tones (coral highlights through deep
// red shadow) so the ring reads as "heart red" rather than an arbitrary
// brand color.
const NORMAL_GRADIENT_ID = 'heartRateNormalGradient';
const NORMAL_GRADIENT_FROM = '#FF8A75';
const NORMAL_GRADIENT_TO = '#E11D48';

// Used only to decide how full/what color the ring is, not a medical
// claim - a plausible display range and the commonly-cited normal resting
// range, purely for a meaningful (not fabricated) visual response to the
// user's actual reading.
const HR_DISPLAY_MIN = 40;
const HR_DISPLAY_MAX = 180;
const NORMAL_MIN = 60;
const NORMAL_MAX = 100;

interface Props {
  heartRate: number | null;
}

export function isNormalHeartRate(heartRate: number): boolean {
  return heartRate >= NORMAL_MIN && heartRate <= NORMAL_MAX;
}

export function HeartRateRing({ heartRate }: Props) {
  const hasReading = heartRate !== null && heartRate > 0;
  const isNormal = hasReading && isNormalHeartRate(heartRate!);
  const ringStroke = !hasReading ? '#E5E7EB' : isNormal ? `url(#${NORMAL_GRADIENT_ID})` : '#F59E0B';

  const clamped = hasReading
    ? Math.min(Math.max(heartRate!, HR_DISPLAY_MIN), HR_DISPLAY_MAX)
    : HR_DISPLAY_MIN;
  const percent = hasReading ? (clamped - HR_DISPLAY_MIN) / (HR_DISPLAY_MAX - HR_DISPLAY_MIN) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent);

  return (
    <View style={styles.container}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Defs>
          <LinearGradient id={NORMAL_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={NORMAL_GRADIENT_FROM} />
            <Stop offset="100%" stopColor={NORMAL_GRADIENT_TO} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke="#F1F5F9"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {hasReading && (
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={ringStroke}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            fill="none"
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        )}
      </Svg>
      <View style={styles.centerContent} pointerEvents="none">
        <Image
          source={heartImage}
          style={[styles.heartImage, !hasReading && styles.heartImageMuted]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  heartImage: {
    width: 84,
    height: 84,
  },
  heartImageMuted: {
    opacity: 0.35,
  },
});
