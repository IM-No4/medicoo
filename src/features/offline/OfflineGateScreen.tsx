import { RefreshCw, WifiOff } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    onRetry: () => Promise<void>;
    onUseOffline: () => Promise<void>;
};

// Two rings, offset half a cycle apart, both looping scale-up-and-fade -
// reads as a signal/radar pulse radiating out from the icon. Built with
// Animated instead of a Lottie/gif file on purpose: this screen has to
// render with zero network access by definition, so whatever illustration
// it uses must already be guaranteed present - no remote-fetched source
// (LottieView's `source={{ uri }}` pattern used elsewhere in the app, e.g.
// SeasonalEssentialsCard) and no bundling an actual animation file of
// uncertain provenance/licensing just for this.
function usePulse(delay: number) {
    const value = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(value, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [value, delay]);

    return value;
}

// Shown by RootNavigator instead of the normal Auth/Onboarding/Main stacks
// while boot.status === 'offline' - see BootCoordinator.ts's upfront
// checkInternetConnectivity() call. Both actions here just resolve their
// promise; the actual state transition (back to 'loading' then 'ready') is
// handled by whichever boot action they call, not by this screen itself.
export default function OfflineGateScreen({ onRetry, onUseOffline }: Props) {
    const insets = useSafeAreaInsets();
    const [retrying, setRetrying] = useState(false);

    const pulse1 = usePulse(0);
    const pulse2 = usePulse(900);

    const ringStyle = (anim: Animated.Value) => ({
        opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.35, 0.12, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
    });

    // A reachability check that's actually online resolves almost instantly
    // (well under a second) - the spinner would show and vanish so fast it
    // read as a stray blink rather than "this button just did something",
    // even though the retry genuinely ran. Floor it to a duration a person
    // can actually perceive, same idea as BootCoordinator's own
    // MIN_SPLASH_DURATION for the cold-boot spinner.
    const MIN_RETRY_SPINNER_MS = 700;

    const handleRetry = async () => {
        if (retrying) return;
        setRetrying(true);
        const startedAt = Date.now();
        try {
            await onRetry();
        } finally {
            const remaining = MIN_RETRY_SPINNER_MS - (Date.now() - startedAt);
            if (remaining > 0) {
                await new Promise((resolve) => setTimeout(resolve, remaining));
            }
            // If connectivity is still down, runBootSequence dispatches
            // bootOffline() again and this screen just re-renders with the
            // same props - resetting this local spinner state either way.
            setRetrying(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={styles.illustration}>
                <Animated.View style={[styles.pulseRing, ringStyle(pulse1)]} />
                <Animated.View style={[styles.pulseRing, ringStyle(pulse2)]} />
                <View style={styles.iconCircle}>
                    <WifiOff size={40} color="#0FBBA1" />
                </View>
            </View>

            <Text style={styles.title}>No Internet Connection</Text>
            <Text style={styles.message}>
                You're not connected to the internet right now. Check your connection and try again, or continue in offline mode.
            </Text>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleRetry} disabled={retrying}>
                    {retrying ? (
                        <>
                            <ActivityIndicator color="#FFFFFF" size="small" />
                            <Text style={styles.primaryButtonText}>Checking...</Text>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={18} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Try Again</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={onUseOffline} disabled={retrying}>
                    <Text style={styles.secondaryButtonText}>Use in Offline Mode</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    illustration: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    pulseRing: {
        position: 'absolute',
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#0FBBA1',
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 36,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#0FBBA1',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
    },
});
