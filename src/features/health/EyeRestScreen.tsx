import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Eye, Pause, Play, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The 20-20-20 rule (every 20 minutes of screen time, look at something 20
// feet away for 20 seconds) - same self-contained, zero-network pattern as
// the other wellness activities, just a plain countdown rather than a
// breathing/stretch/mindfulness exercise. Blue for clarity/vision, distinct
// from the other three activities' cyan/emerald/violet.
const SESSION_SECONDS = 20;

export default function EyeRestScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [running, setRunning] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
    const [completed, setCompleted] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        intervalRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearTimer();
                    setRunning(false);
                    setCompleted(true);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    }, [clearTimer]);

    const toggleRunning = () => {
        if (completed) {
            setCompleted(false);
            setSecondsLeft(SESSION_SECONDS);
            setRunning(true);
            startTimer();
            return;
        }

        const next = !running;
        setRunning(next);
        if (next) {
            startTimer();
        } else {
            clearTimer();
        }
    };

    useEffect(() => () => clearTimer(), [clearTimer]);

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
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Eye Rest</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {completed ? (
                    <>
                        <Text style={styles.doneEmoji}>👁️</Text>
                        <Text style={styles.doneTitle}>Nice work!</Text>
                        <Text style={styles.intro}>Your eyes thank you for the break.</Text>
                    </>
                ) : (
                    <>
                        <Text style={styles.intro}>
                            The 20-20-20 rule: every 20 minutes of screen time, look at something 20 feet away for 20 seconds.
                        </Text>

                        <View style={styles.circleArea}>
                            <View style={styles.circle} />
                            <Text style={styles.timer}>{running ? secondsLeft : SESSION_SECONDS}</Text>
                        </View>

                        <View style={styles.iconRow}>
                            <Eye size={18} color="#1D4ED8" />
                            <Text style={styles.prompt}>
                                {running ? 'Look at something far away...' : 'Find something 20 feet away, then press start.'}
                            </Text>
                        </View>
                    </>
                )}

                <TouchableOpacity style={styles.playButton} activeOpacity={0.85} onPress={toggleRunning}>
                    {completed ? (
                        <>
                            <RotateCcw size={20} color="#FFFFFF" />
                            <Text style={styles.playButtonText}>Do It Again</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    intro: {
        fontSize: 13.5,
        lineHeight: 20,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    doneEmoji: { fontSize: 48, marginBottom: 12 },
    // Blue theme - clarity/vision, distinct from the other 3 activities'
    // cyan/emerald/violet.
    doneTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1D4ED8',
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
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#EFF6FF',
        borderWidth: 2,
        borderColor: '#2563EB',
    },
    timer: {
        fontSize: 40,
        fontWeight: '800',
        color: '#1D4ED8',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
        paddingHorizontal: 12,
    },
    prompt: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: '#374151',
        textAlign: 'center',
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#2563EB',
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
