import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { BloodDonationAwarenessFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    item: BloodDonationAwarenessFeedItem;
    onAction?: (action: FeedAction) => void;
}

export default function BloodDonationAwarenessCard({ item, onAction }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const handlePrimary = () => {
        if (item.action && onAction) {
            onAction(item.action);
        }
    };

    const handleSecondary = () => {
        if (item.learnMoreAction && onAction) {
            onAction(item.learnMoreAction);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconWrapper}>
                    <AppIcon name="droplet" size={24} color="#EF4444" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleSecondary}>
                    <Text style={styles.secondaryButtonText}>{t('learn_more')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handlePrimary}>
                    <Text style={styles.primaryButtonText}>{item.ctaText}</Text>
                    <AppIcon name="chevron-right" size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 30,
        marginHorizontal: 24,
        borderWidth: 1,
        borderColor: c.borderLight, // Subtle premium border
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 0, // Clean, zero elevation to avoid harsh Android shadows
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: c.errorBg, // Light red bg
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: c.textSecondary,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: c.borderLight,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        marginRight: 4,
    },
    secondaryButton: {
        paddingVertical: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: c.textSecondary,
    },
});
