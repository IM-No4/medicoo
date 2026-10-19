import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft, Pause, Play } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// A simple guided "box breathing" exercise (4s in - 4s hold - 4s out - 4s
// hold, repeating) - purely a client-side animation loop, no data, no
// account, no network call anywhere in it. Built as a real, permanent
// screen (not an offline-only stub) specifically so it's exactly as useful
// with a connection as without one - reachable from OfflineHomeContent.tsx
// while offline and from HealthScreen.tsx's RelaxCard the rest of the time.
type Phase = 'Breathe In' | 'Hold' | 'Breathe Out' | 'Hold';

const PHASES: { label: Phase; duration: number; toValue: number }[] = [
    { label: 'Breathe In', duration: 4000, toValue: 1 },
    { label: 'Hold', duration: 4000, toValue: 1 },
    { label: 'Breathe Out', duration: 4000, toValue: 0.55 },
    { label: 'Hold', duration: 4000, toValue: 0.55 },
];

const CIRCLE_MAX = 260;

export default function BreathingExerciseScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [running, setRunning] = useState(false);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [cycles, setCycles] = useState(0);

    const scale = useRef(new Animated.Value(0.55)).current;
    const runningRef = useRef(false);

    const runLoop = useCallback(async () => {
        let index = 0;
        while (runningRef.current) {
            const phase = PHASES[index];
            setPhaseIndex(index);

            await new Promise<void>((resolve) => {
                Animated.timing(scale, {
                    toValue: phase.toValue,
                    duration: phase.duration,
                    useNativeDriver: true,
                }).start(() => resolve());
            });

            if (!runningRef.current) break;

            index = (index + 1) % PHASES.length;
            if (index === 0) {
                setCycles((c) => c + 1);
            }
        }
    }, [scale]);

    const toggleRunning = () => {
        const next = !running;
        setRunning(next);
        runningRef.current = next;
        if (next) {
            runLoop();
        } else {
            scale.stopAnimation();
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

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('breathing_exercise')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.intro}>
                    {t('a_minute_of_box_breathing_4_seconds_in')}
                </Text>

                <View style={styles.circleArea}>
                    {/* Fixed-size circle, scaled via transform rather than
                        animating width/height directly - "toValue" here
                        (0.55-1) doubles as the transform scale factor, and
                        native-driven animations (useNativeDriver: true,
                        needed for this to run smoothly off the JS thread)
                        can only ever touch transform/opacity, never
                        width/height. */}
                    <Animated.View
                        style={[
                            styles.circle,
                            { transform: [{ scale }] },
                        ]}
                    />
                    <Text style={styles.phaseLabel}>{running ? t(PHASES[phaseIndex].label) : t('Ready?')}</Text>
                </View>

                <Text style={styles.cycleCount}>{cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed</Text>

                <TouchableOpacity style={styles.playButton} activeOpacity={0.85} onPress={toggleRunning}>
                    {running ? <Pause size={22} color="#FFFFFF" /> : <Play size={22} color="#FFFFFF" />}
                    <Text style={styles.playButtonText}>{running ? 'Pause' : 'Start'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
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
    circleArea: {
        width: CIRCLE_MAX,
        height: CIRCLE_MAX,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    // Cyan theme - air/breath, matching this activity's own card in
    // WellnessActivitiesScreen.tsx (chosen for what the activity actually
    // is, not just to look distinct from the other two).
    circle: {
        position: 'absolute',
        width: CIRCLE_MAX,
        height: CIRCLE_MAX,
        borderRadius: CIRCLE_MAX / 2,
        backgroundColor: c.successBg,
        borderWidth: 2,
        borderColor: '#0891B2',
    },
    phaseLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0E7490',
    },
    cycleCount: {
        fontSize: 13,
        color: c.textMuted,
        marginBottom: 32,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#0891B2',
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
