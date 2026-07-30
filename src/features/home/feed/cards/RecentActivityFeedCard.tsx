import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../../components/icons/AppIcon';
import { RecentActivityFeedItem } from '../feed.types';
import { FeedAction } from '../feed.actions';

type Props = {
    data: RecentActivityFeedItem;
    onAction?: (action: FeedAction) => void;
};

function RecentActivityFeedCard({ data, onAction }: Props) {
    const handleViewHistory = () => {
        if (onAction) {
            onAction({
                type: 'NAVIGATE',
                stack: 'HomeStack',
                screen: 'RecentActivity',
                params: { activities: data.activities }
            });
        }
    };

    const handleItemPress = (type: string, id: string) => {
        if (!onAction) return;

        if (type === 'consultation') {
            const consultationId = id === 'act1' ? '1' : (id === 'act4' ? '2' : id);
            onAction({
                type: 'NAVIGATE',
                stack: 'ProfileStack',
                screen: 'ConsultationDetail',
                params: { consultationId },
            });
        } else if (type === 'medicine') {
            const orderId = id === 'act2' ? 'ord1' : (id === 'act5' ? 'ord2' : id);
            onAction({
                type: 'NAVIGATE',
                stack: 'ProfileStack',
                screen: 'MedicineOrderDetail',
                params: { orderId },
            });
        } else if (type === 'lab') {
            const testId = id === 'act3' ? 'lt1' : (id === 'act6' ? 'lt2' : id);
            onAction({
                type: 'NAVIGATE',
                stack: 'ProfileStack',
                screen: 'LabTestDetail',
                params: { testId },
            });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{data.title}</Text>
                <TouchableOpacity onPress={handleViewHistory}>
                    <Text style={styles.viewAll}>View History</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                {data.activities.slice(0, 3).map((activity, index) => (
                    <TouchableOpacity
                        key={activity.id}
                        style={[styles.item, index !== 2 && styles.borderBottom]}
                        onPress={() => handleItemPress(activity.type, activity.id)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: getActivityColor(activity.type).bg }]}>
                            <AppIcon
                                name={getActivityIcon(activity.type)}
                                size={18}
                                color={getActivityColor(activity.type).icon}
                            />
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.itemTitle}>{activity.title}</Text>
                            <Text style={styles.date}>{activity.date}</Text>
                        </View>

                        <View style={styles.statusContainer}>
                            <Text style={[styles.status, { color: activity.statusColor || '#6B7280' }]}>
                                {activity.status}
                            </Text>
                            <AppIcon name="chevron-right" size={14} color="#D1D5DB" />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function getActivityIcon(type: string): any {
    switch (type) {
        case 'consultation': return 'stethoscope';
        case 'medicine': return 'shopping-bag';
        case 'lab': return 'flask';
        default: return 'info';
    }
}

function getActivityColor(type: string) {
    switch (type) {
        case 'consultation': return { bg: '#EFF6FF', icon: '#3B82F6' }; // Blue
        case 'medicine': return { bg: '#ECFDF5', icon: '#10B981' }; // Green
        case 'lab': return { bg: '#F5F3FF', icon: '#8B5CF6' }; // Purple
        default: return { bg: '#F3F4F6', icon: '#6B7280' };
    }
}

export default React.memo(RecentActivityFeedCard);

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 28,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    viewAll: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2563EB',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    content: {
        flex: 1
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF'
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    status: {
        fontSize: 12,
        fontWeight: '500'
    }
});
