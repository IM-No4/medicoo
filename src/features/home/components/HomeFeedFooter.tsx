import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../../components/icons/AppIcon';

interface Props {
    appName: string;
    tagline: string;
}

export default function HomeFeedFooter({ appName, tagline }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <AppIcon name={"activity" as any} size={24} color="#9CA3AF" />
            </View>

            <Text style={styles.appName}>{appName}</Text>
            <Text style={styles.tagline}>{tagline}</Text>

            <View style={styles.badgesRow}>
                <View style={styles.badge}>
                    <AppIcon name="shield-check" size={12} color="#6B7280" />
                    <Text style={styles.badgeText}>100% Secure</Text>
                </View>
                <View style={styles.dot} />
                <View style={styles.badge}>
                    <AppIcon name="users" size={12} color="#6B7280" />
                    <Text style={styles.badgeText}>10M+ Users</Text>
                </View>
                <View style={styles.dot} />
                <View style={styles.badge}>
                    <AppIcon name="heart" size={12} color="#6B7280" />
                    <Text style={styles.badgeText}>ISO Certified</Text>
                </View>
            </View>

            <Text style={styles.footerText}>
                Made with ❤️ for a Healthy India
            </Text>

            <Text style={styles.version}>v2.4.0 • Terms of Service • Privacy Policy</Text>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    iconContainer: {
        marginBottom: 12,
        opacity: 0.5
    },
    appName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#D1D5DB', // Very light gray for watermark feel
        marginBottom: 4,
        letterSpacing: 1
    },
    tagline: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
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
        color: '#4B5563'
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D5DB'
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 8,
        fontWeight: '500'
    },
    version: {
        fontSize: 10,
        color: '#D1D5DB'
    }
});
