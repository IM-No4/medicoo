import { Activity, Clock, Droplet, Heart, Info, Pill, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HealthNotification {
    id: string;
    title: string;
    message: string;
    description: string;
    time: string;
    type: 'hydration' | 'activity' | 'vitals' | 'medicine' | 'info';
    isRead: boolean;
}

const MOCK_NOTIFICATIONS: HealthNotification[] = [
    {
        id: '1',
        title: 'Hydration Target',
        message: 'low water intake',
        description: 'Drink 3 more glasses to stay on track',
        time: '10 Minutes ago',
        type: 'hydration',
        isRead: false,
    },
    {
        id: '2',
        title: 'Steps Milestone',
        message: '8,000 steps reached',
        description: 'Only 2,000 left for your daily goal',
        time: '1 Hour ago',
        type: 'activity',
        isRead: false,
    },
    {
        id: '3',
        title: 'Vitals Logged',
        message: 'morning pulse',
        description: '72 BPM recorded successfully',
        time: '3 Hours ago',
        type: 'vitals',
        isRead: true,
    },
    {
        id: '4',
        title: 'Medicine Reminder',
        message: 'Multivitamin alert',
        description: 'Remember to take it with water',
        time: '5 Hours ago',
        type: 'medicine',
        isRead: true,
    },
];

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function HealthNotificationsModal({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    const getIcon = (type: HealthNotification['type']) => {
        switch (type) {
            case 'hydration': return <Droplet size={14} color="#3B82F6" />;
            case 'activity': return <Activity size={14} color="#2FA561" />;
            case 'vitals': return <Heart size={14} color="#EF4444" />;
            case 'medicine': return <Pill size={14} color="#8B5CF6" />;
            default: return <Info size={14} color="#6B7280" />;
        }
    };

    const getIconBg = (type: HealthNotification['type']) => {
        switch (type) {
            case 'hydration': return '#EFF6FF';
            case 'activity': return '#F0FDF4';
            case 'vitals': return '#FEF2F2';
            case 'medicine': return '#F5F3FF';
            default: return '#F9FAFB';
        }
    };

    const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View
                style={styles.overlay}
            >
                <Animated.View
                    style={[
                        styles.popupContainer,
                        {
                            top: insets.top + 60,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.boldTitle}>Notification</Text>
                            <Text style={styles.unreadSub}>You have {unreadCount} unread alerts</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            onPress={onClose}
                        >
                            <X size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.newLabelContainer}>
                        <Text style={styles.newLabel}>New</Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {MOCK_NOTIFICATIONS.map((item) => (
                            <View key={item.id} style={styles.notifItem}>
                                <View style={[styles.iconCircle, { backgroundColor: getIconBg(item.type) }]}>
                                    {getIcon(item.type)}
                                </View>
                                <View style={styles.textContent}>
                                    <Text style={styles.itemTitle}>
                                        <Text style={styles.boldText}>{item.title}</Text>
                                        <Text style={styles.greyText}> {item.message}</Text>
                                    </Text>
                                    <Text style={styles.descriptionText}>{item.description}</Text>
                                    <View style={styles.timeRow}>
                                        <Clock size={12} color="#94A3B8" />
                                        <Text style={styles.timeText}>{item.time}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    popupContainer: {
        position: 'absolute',
        right: 20,
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 320,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingTop: 16,
        paddingBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    boldTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    unreadSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    closeBtn: {
        padding: 4,
    },
    newLabelContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4,
    },
    newLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    notifItem: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    textContent: {
        flex: 1,
        marginLeft: 12,
    },
    itemTitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    boldText: {
        fontWeight: '700',
        color: '#334155',
    },
    greyText: {
        color: '#64748B',
    },
    descriptionText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    timeText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    }
});
