import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { BloodRequestAlertFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    item: BloodRequestAlertFeedItem;
    onAction?: (action: FeedAction) => void;
}

export default function BloodRequestAlertCard({ item, onAction }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const handleAccept = () => {
        if (item.acceptAction && onAction) {
            onAction(item.acceptAction);
        }
    };

    const handleDecline = () => {
        if (item.declineAction && onAction) {
            onAction(item.declineAction);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.urgentBadge}>
                    <AppIcon name="alert-triangle" size={14} color="#FFFFFF" />
                    <Text style={styles.urgentText}>{t('urgent_request')}</Text>
                </View>
                <Text style={styles.timeText}>{item.timePosted}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.bloodGroupBadge}>
                    <Text style={styles.bloodGroupText}>{item.bloodGroup}</Text>
                </View>

                <View style={styles.detailsContainer}>
                    <Text style={styles.hospitalName}>{item.hospital}</Text>
                    <View style={styles.locationRow}>
                        <AppIcon name="map-pin" size={14} color={theme.textSecondary} />
                        <Text style={styles.locationText}>{item.location} • {item.distance}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
                    <Text style={styles.declineText}>{t('cant_donate')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                    <Text style={styles.acceptText}>{t('can_donate')}</Text>
                    <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        backgroundColor: c.card,
        borderRadius: 16,
        marginBottom: 30,
        marginHorizontal: 24,
        borderWidth: 1,
        borderColor: '#FEE2E2', // Subtle, premium soft red border
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 0, // Clean, zero elevation to avoid harsh Android shadows
        overflow: 'hidden'
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: c.errorBg,
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA'
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        gap: 4
    },
    urgentText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    timeText: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600'
    },
    content: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16
    },
    bloodGroupBadge: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: c.errorBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCA5A5'
    },
    bloodGroupText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#DC2626'
    },
    detailsContainer: {
        flex: 1
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
        marginBottom: 4
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    locationText: {
        fontSize: 13,
        color: c.textSecondary,
        flex: 1
    },
    actions: {
        padding: 16,
        paddingTop: 0,
        flexDirection: 'row',
        gap: 12
    },
    declineButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.cardSecondary,
        borderRadius: 12
    },
    declineText: {
        fontSize: 14,
        fontWeight: '600',
        color: c.textSecondary
    },
    acceptButton: {
        flex: 2, // Bigger target
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        borderRadius: 12,
        gap: 8
    },
    acceptText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF'
    }
});
