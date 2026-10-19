import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft, Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// A short, guided desk-stretch break - same self-contained, zero-network,
// zero-account pattern as BreathingExerciseScreen.tsx (reachable offline
// and online alike), just a sequential set of named stretches instead of a
// single repeating breathing cycle.
type Step = { name: string; instruction: string; duration: number };

const STEPS: Step[] = [
  { name: 'Neck Roll', instruction: 'Slowly roll your neck in a full circle, then reverse direction.', duration: 10000 },
  { name: 'Shoulder Shrugs', instruction: 'Lift your shoulders up toward your ears, then release.', duration: 10000 },
  { name: 'Arm Reach', instruction: 'Reach both arms overhead and stretch upward.', duration: 10000 },
  { name: 'Wrist Stretch', instruction: 'Extend one arm, gently pull fingers back with the other hand.', duration: 10000 },
  { name: 'Seated Twist', instruction: 'Sitting tall, gently twist your torso to one side, then the other.', duration: 10000 },
];

export default function StretchBreakScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const runningRef = useRef(false);

  const runFrom = useCallback(async (startIndex: number) => {
    let index = startIndex;
    while (runningRef.current && index < STEPS.length) {
      setStepIndex(index);
      progress.setValue(0);

      await new Promise<void>((resolve) => {
        // Width can't run on the native driver, but this is a single slow
        // (~10s) linear fill, not a gesture-driven animation - no perf
        // concern running it on the JS thread.
        Animated.timing(progress, {
          toValue: 1,
          duration: STEPS[index].duration,
          useNativeDriver: false,
        }).start(() => resolve());
      });

      if (!runningRef.current) return;
      index += 1;
    }

    if (runningRef.current && index >= STEPS.length) {
      setRunning(false);
      runningRef.current = false;
      setCompleted(true);
    }
  }, [progress]);

  const toggleRunning = () => {
    if (completed) {
      setCompleted(false);
      setRunning(true);
      runningRef.current = true;
      runFrom(0);
      return;
    }
    const next = !running;
    setRunning(next);
    runningRef.current = next;
    if (next) {
      runFrom(stepIndex);
    } else {
      progress.stopAnimation();
    }
  };

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  const step = STEPS[stepIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('quick_stretch')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {completed ? (
          <>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>{t('nice_work')}</Text>
            <Text style={styles.intro}>You made it through all {STEPS.length} stretches.</Text>
          </>
        ) : (
          <>
            <Text style={styles.intro}>{t('a_minute_of_easy_desk_stretches_to_loo')}</Text>

            <View style={styles.stepArea}>
              <Text style={styles.stepName}>{running ? step.name : 'Ready?'}</Text>
              <Text style={styles.stepInstruction}>
                {running ? step.instruction : `${STEPS.length} stretches, about a minute total.`}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              {STEPS.map((_, i) => (
                <View key={i} style={styles.progressSegment}>
                  {i < stepIndex && <View style={[StyleSheet.absoluteFill, styles.progressFillDone]} />}
                  {i === stepIndex && running && (
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.progressFillDone,
                        {
                          width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.playButton} activeOpacity={0.85} onPress={toggleRunning}>
          {completed ? (
            <>
              <RotateCcw size={20} color="#FFFFFF" />
              <Text style={styles.playButtonText}>{t('do_it_again')}</Text>
            </>
          ) : (
            <>
              {running ? <Pause size={22} color="#FFFFFF" /> : <Play size={22} color="#FFFFFF" />}
              <Text style={styles.playButtonText}>{running ? 'Pause' : 'Start'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  intro: {
    fontSize: 13.5,
    lineHeight: 20,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  doneEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  // Emerald theme, matching this activity's own card in
  // WellnessActivitiesScreen.tsx.
  doneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 8,
  },
  stepArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginBottom: 24,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepInstruction: {
    fontSize: 14,
    lineHeight: 21,
    color: c.text,
    textAlign: 'center',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    marginBottom: 32,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.cardSecondary,
    overflow: 'hidden',
  },
  progressFillDone: {
    backgroundColor: '#059669',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
