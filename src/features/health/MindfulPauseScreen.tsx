import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft, Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, BackHandler, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// A short guided mindfulness pause - same self-contained, zero-network
// pattern as BreathingExerciseScreen.tsx and StretchBreakScreen.tsx. A
// slow pulsing circle plus a handful of calming prompts rotating over a
// fixed 60-second session, rather than a repeating breathing cycle or a
// sequence of physical steps.
const SESSION_SECONDS = 60;
const PROMPTS = [
  'Notice your breath, in and out.',
  'Relax your shoulders and jaw.',
  'Let your thoughts pass without judgment.',
  'Feel the weight of your body settling.',
  'You are doing enough, right now.',
];
const PROMPT_INTERVAL_SECONDS = SESSION_SECONDS / PROMPTS.length;

const CIRCLE_MAX = 220;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MindfulPauseScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [completed, setCompleted] = useState(false);

  const pulse = useRef(new Animated.Value(0.85)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPulse = useCallback(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
  }, [pulse]);

  const stopPulse = useCallback(() => {
    pulseLoopRef.current?.stop();
    pulse.stopAnimation();
  }, [pulse]);

  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopPulse();
    setRunning(false);
    setCompleted(true);
  }, [stopPulse]);

  const toggleRunning = () => {
    if (completed) {
      setCompleted(false);
      setSecondsLeft(SESSION_SECONDS);
      setRunning(true);
      startPulse();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            finish();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return;
    }

    const next = !running;
    setRunning(next);
    if (next) {
      startPulse();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            finish();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopPulse();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopPulse();
    };
  }, [stopPulse]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  const elapsed = SESSION_SECONDS - secondsLeft;
  const promptIndex = Math.min(
    PROMPTS.length - 1,
    Math.floor(elapsed / PROMPT_INTERVAL_SECONDS)
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('mindful_pause')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {completed ? (
          <>
            <Text style={styles.doneEmoji}>🌿</Text>
            <Text style={styles.doneTitle}>{t('well_done')}</Text>
            <Text style={styles.intro}>{t('a_full_minute_for_yourself_however_tha')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.intro}>{t('a_minute_to_pause_breathe_and_reset')}</Text>

            <View style={styles.circleArea}>
              <Animated.View style={[styles.circle, { transform: [{ scale: pulse }] }]} />
              <Text style={styles.timer}>{running ? formatTime(secondsLeft) : formatTime(SESSION_SECONDS)}</Text>
            </View>

            <Text style={styles.prompt}>
              {running ? PROMPTS[promptIndex] : 'Find a quiet moment, then press start.'}
            </Text>
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
  // Violet theme - the near-universal color association for meditation/
  // mindfulness across wellness apps, matching this activity's own card
  // in WellnessActivitiesScreen.tsx.
  doneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 8,
  },
  circleArea: {
    width: CIRCLE_MAX,
    height: CIRCLE_MAX,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_MAX,
    height: CIRCLE_MAX,
    borderRadius: CIRCLE_MAX / 2,
    backgroundColor: c.cardSecondary,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  timer: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6D28D9',
  },
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    color: c.text,
    textAlign: 'center',
    marginBottom: 32,
    minHeight: 66,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
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
