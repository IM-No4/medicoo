import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { BloodDonationAwarenessFeedItem } from '../feed.types';

import { FeedAction } from '../feed.actions';

interface Props {
    item: BloodDonationAwarenessFeedItem;
    onAction?: (action: FeedAction) => void;
}

export default function BloodDonationAwarenessCard({ item, onAction }: Props) {
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
                    <Text style={styles.secondaryButtonText}>Learn More</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handlePrimary}>
                    <Text style={styles.primaryButtonText}>{item.ctaText}</Text>
                    <AppIcon name="chevron-right" size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 28,
        marginHorizontal: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        // Subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        backgroundColor: '#FEF2F2', // Light red bg
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
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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
        color: '#6B7280',
    },
});
