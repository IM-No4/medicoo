import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Calendar, HeartPulse, Target, WifiOff, Wind } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

// Rendered instead of HomeHeader while offline (see HomeScreen.tsx) - no
// location selector, search bar, cart, or notification bell, since none of
// them can do anything useful without a connection. Just a greeting and the
// quick-jump row below it (moved down from OfflineHomeContent.tsx, which
// had it floating as a disconnected horizontal-scroll pill row above the
// hero card - anchoring it to the header instead gives it a fixed, evenly
// spaced home instead of a scrollable strip with no clear alignment).
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

const QUICK_LINKS: { key: string; icon: any; label: string; screen: string }[] = [
    { key: 'vitals', icon: HeartPulse, label: 'Vitals', screen: 'LogVitals' },
    { key: 'medications', icon: Calendar, label: 'Meds', screen: 'ManageMedications' },
    { key: 'goals', icon: Target, label: 'Goals', screen: 'ManageGoals' },
    { key: 'activity', icon: Activity, label: 'Activity', screen: 'ActivityHistory' },
    { key: 'relax', icon: Wind, label: 'Relax', screen: 'BreathingExercise' },
];

export default function OfflineHomeHeader() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    // Cached on-device the last time the profile was reachable (see
    // profileSlice.ts) - not a live fetch, so this still has a name to show
    // right now, offline, as long as the app has ever been online once.
    const name = useSelector((state: RootState) => state.profile.name);

    return (
        <LinearGradient
            colors={['#10B981', '#007C69']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, { paddingTop: insets.top + 20 }]}
        >
            <Text style={styles.greeting}>
                {getGreeting()}{name ? `, ${name}` : ''}
            </Text>
            <View style={styles.offlinePill}>
                <WifiOff size={12} color="#FFFFFF" />
                <Text style={styles.offlineText}>{t('more_online')}</Text>
            </View>

            <View style={styles.quickLinks}>
                {QUICK_LINKS.map(({ key, icon: Icon, label, screen }) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.quickLink}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate(screen)}
                    >
                        <View style={styles.quickLinkIcon}>
                            <Icon size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.quickLinkLabel}>{t(label)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </LinearGradient>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 22,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    offlinePill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    offlineText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    quickLinks: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickLink: {
        alignItems: 'center',
        gap: 6,
        width: 56,
    },
    quickLinkIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickLinkLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
});
