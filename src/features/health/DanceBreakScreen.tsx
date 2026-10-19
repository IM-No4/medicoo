import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft, Music, Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, BackHandler, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// A playful, deliberately silly movement break - the "just for fun" sibling
// to Quick Stretch's more serious stretching routine. Same self-contained,
// zero-network pattern as every other wellness activity. Pink/magenta for
// energy and fun, distinct from the other activities' cooler, calmer tones.
const SESSION_SECONDS = 30;
const PROMPTS = [
  'Shake your arms like spaghetti!',
  'Wiggle your hips!',
  'Jump up and down 5 times!',
  'Spin around once (carefully)!',
  'Give yourself a big stretchy yawn!',
];
const PROMPT_INTERVAL_SECONDS = SESSION_SECONDS / PROMPTS.length;

export default function DanceBreakScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [completed, setCompleted] = useState(false);

  const bounce = useRef(new Animated.Value(0)).current;
  const bounceLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBounce = useCallback(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    bounceLoopRef.current = loop;
    loop.start();
  }, [bounce]);

  const stopBounce = useCallback(() => {
    bounceLoopRef.current?.stop();
    bounce.stopAnimation();
    bounce.setValue(0);
  }, [bounce]);

  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopBounce();
    setRunning(false);
    setCompleted(true);
  }, [stopBounce]);

  const toggleRunning = () => {
    if (completed) {
      setCompleted(false);
      setSecondsLeft(SESSION_SECONDS);
      setRunning(true);
      startBounce();
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
      startBounce();
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
      stopBounce();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopBounce();
    };
  }, [stopBounce]);

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

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dance_break')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {completed ? (
          <>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>{t('great_moves')}</Text>
            <Text style={styles.intro}>{t('however_that_looked_your_body_thanks_y')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.intro}>30 seconds of silly, energizing movement - no rhythm required.</Text>

            <View style={styles.circleArea}>
              <Animated.View style={[styles.circle, { transform: [{ translateY }] }]}>
                <Music size={40} color="#DB2777" />
              </Animated.View>
              <Text style={styles.timer}>{running ? secondsLeft : SESSION_SECONDS}</Text>
            </View>

            <Text style={styles.prompt}>
              {running ? PROMPTS[promptIndex] : 'Find a little space, then press start.'}
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
  doneEmoji: { fontSize: 48, marginBottom: 12 },
  doneTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#BE185D',
    marginBottom: 8,
  },
  circleArea: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: c.cardSecondary,
    borderWidth: 2,
    borderColor: '#DB2777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    position: 'absolute',
    bottom: 0,
    fontSize: 15,
    fontWeight: '800',
    color: '#BE185D',
  },
  prompt: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    color: c.text,
    textAlign: 'center',
    marginBottom: 32,
    minHeight: 30,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DB2777',
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
