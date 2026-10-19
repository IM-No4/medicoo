import { CloudOff, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StatusBar } from '../../components/ThemedStatusBar';
import { useLanguage } from '../../i18n/LanguageContext';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

interface Props {
    // Resolves true when the server answered (screen should go away), false
    // when it still can't be reached.
    onRetry: () => Promise<boolean>;
}

// Shown over the app when the device has internet but our own backend can't
// be reached (server down / restarting / blocked). Distinct from
// OfflineGateScreen, which is for "this device has no internet at all".
export default function ServerUnreachableScreen({ onRetry }: Props) {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const insets = useSafeAreaInsets();
    const [retrying, setRetrying] = useState(false);
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    const handleRetry = async () => {
        if (retrying) return;
        setRetrying(true);
        try {
            await onRetry();
        } catch {
            // Still unreachable - the screen simply stays; the button resets below.
        } finally {
            setRetrying(false);
        }
    };

    const ringStyle = {
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            <View style={styles.illustration}>
                <Animated.View style={[styles.pulseRing, ringStyle]} />
                <View style={styles.iconCircle}>
                    <CloudOff size={40} color={theme.primary} />
                </View>
            </View>

            <Text style={styles.title}>{t('server_unreachable_title')}</Text>
            <Text style={styles.message}>{t('server_unreachable_message')}</Text>

            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleRetry} disabled={retrying}>
                {retrying ? (
                    <>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.buttonText}>{t('checking')}</Text>
                    </>
                ) : (
                    <>
                        <RefreshCw size={18} color="#FFFFFF" />
                        <Text style={styles.buttonText}>{t('try_again')}</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
        backgroundColor: c.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    illustration: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    pulseRing: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: c.primaryLight,
    },
    iconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: c.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: c.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        color: c.textSecondary,
        textAlign: 'center',
        marginBottom: 12,
    },
    button: {
        marginTop: 16,
        minWidth: 200,
        height: 50,
        borderRadius: 14,
        backgroundColor: c.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 24,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
