import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../../components/icons/AppIcon';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
    appName: string;
    tagline: string;
    // Backend-controlled (HomeFeedFooter.showTrustBadges) - these are real
    // claims (user count, certification), not decoration, so they must not
    // render unless the backend says they're actually true. Defaults to
    // false server-side until there's real data to back them.
    showTrustBadges?: boolean;
}

export default function HomeFeedFooter({ appName, tagline, showTrustBadges }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <AppIcon name={"activity" as any} size={24} color={theme.textMuted} />
            </View>

            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.tagline}>{tagline}</Text>

            {showTrustBadges && (
                <View style={styles.badgesRow}>
                    <View style={styles.badge}>
                        <AppIcon name="shield-check" size={12} color={theme.textSecondary} />
                        <Text style={styles.badgeText}>100% Secure</Text>
                    </View>
                    <View style={styles.dot} />
                    <View style={styles.badge}>
                        <AppIcon name="users" size={12} color={theme.textSecondary} />
                        <Text style={styles.badgeText}>10M+ Users</Text>
                    </View>
                    <View style={styles.dot} />
                    <View style={styles.badge}>
                        <AppIcon name="heart" size={12} color={theme.textSecondary} />
                        <Text style={styles.badgeText}>{t('iso_certified')}</Text>
                    </View>
                </View>
            )}

            <Text style={styles.footerText}>
                Made with ❤️ for a Healthy India
            </Text>
        </View >
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        backgroundColor: c.cardSecondary,
        paddingVertical: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: c.borderLight
    },
    iconContainer: {
        marginBottom: 12,
        opacity: 0.5
    },
    appName: {
        fontSize: 20,
        fontWeight: '800',
        color: c.textMuted, // Very light gray for watermark feel
        marginBottom: 4,
        letterSpacing: 1
    },
    tagline: {
        fontSize: 14,
        fontWeight: '600',
        color: c.textSecondary,
        marginBottom: 24,
        textAlign: 'center'
    },
    badgesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: c.textSecondary
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB'
    },
    footerText: {
        fontSize: 12,
        color: c.textMuted,
        fontWeight: '500'
    }
});
