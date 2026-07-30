import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import AppIcon from '../../../../components/icons/AppIcon';
import { dismissActivity } from '../../../../redux/slices/activitySlice';
import { AppDispatch } from '../../../../redux/store';
import { ContinueActivityFeedItem } from '../feed.types';

type Props = {
    data: ContinueActivityFeedItem;
};

function ContinueActivityCard({ data }: Props) {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();

    const handleResume = () => {
        if (data.action && data.action.type === 'NAVIGATE') {
            const { stack, screen, params } = data.action as any;
            navigation.navigate(stack, { screen, params });
        }
    };

    const handleDismiss = () => {
        dispatch(dismissActivity());
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={handleResume}
        >
            <View style={styles.iconBox}>
                <AppIcon name={data.icon as any} size={24} color="#F59E0B" />
            </View>

            <View style={styles.content}>
                <Text style={styles.subtitle}>{data.subtitle}</Text>
                <Text style={styles.title}>{data.title}</Text>

                {data.progress !== undefined && (
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${data.progress * 100}%` }]} />
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleResume} activeOpacity={0.7}>
                    <Text style={styles.actionText}>{data.ctaText}</Text>
                    <AppIcon name="chevron-right" size={14} color="#4F46E5" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.7}>
                    <AppIcon name="x" size={14} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default React.memo(ContinueActivityCard);

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#FED7AA',
        flexShrink: 0,
    },
    content: {
        flex: 1,
    },
    subtitle: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#FDE68A',
        borderRadius: 2,
        width: '80%',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 2,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
    },
    dismissBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
