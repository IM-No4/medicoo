import { Calendar, Clock, ShoppingBag, Star, Tag, Heart, Bell, X, Droplet } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
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
import { useDispatch } from 'react-redux';

import { clearUnread, setUnreadCount } from '../../../redux/slices/notificationSlice';
import {
    CustomerNotification,
    getCustomerNotifications,
    markAllCustomerNotificationsAsRead,
} from '../../../services/api/notification.api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NotificationItem = {
    id: string;
    type: CustomerNotification['type'];
    title: string;
    message: string;
    time: string;
    isRead: boolean;
};

const formatRelativeTime = (dateValue?: string) => {
    if (!dateValue) return 'Just now';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function HealthNotificationsModal({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCustomerNotifications({ limit: 10 });
            const items: NotificationItem[] = (response?.data?.notifications || []).map((item: CustomerNotification) => ({
                id: item._id,
                type: item.type,
                title: item.title,
                message: item.message,
                time: formatRelativeTime(item.createdOn),
                isRead: item.isRead,
            }));

            setNotifications(items);
            dispatch(setUnreadCount(response?.data?.unreadCount || 0));

            if (items.some(item => !item.isRead)) {
                await markAllCustomerNotificationsAsRead();
                dispatch(clearUnread());
                setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
            }
        } catch {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        if (visible) {
            void loadNotifications();
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
    }, [visible, fadeAnim, scaleAnim, loadNotifications]);

    // Matches NotificationsScreen.tsx's type->icon mapping, so a notification
    // reads the same way whether seen from Home or from this Health popup.
    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'order': return <ShoppingBag size={14} color="#089643" />;
            case 'appointment':
            case 'consultation': return <Calendar size={14} color="#3B82F6" />;
            case 'promotion': return <Tag size={14} color="#F59E0B" />;
            case 'health_reminder':
            case 'reminder':
            case 'medicine': return <Heart size={14} color="#EC4899" />;
            case 'review': return <Star size={14} color="#10B981" />;
            case 'blood_request': return <Droplet size={14} color="#EF4444" />;
            default: return <Bell size={14} color="#64748B" />;
        }
    };

    const getIconBg = (type: NotificationItem['type']) => {
        switch (type) {
            case 'order': return '#E8F5E9';
            case 'appointment':
            case 'consultation': return '#EFF6FF';
            case 'promotion': return '#FEF3C7';
            case 'health_reminder':
            case 'reminder':
            case 'medicine': return '#FCE7F3';
            case 'review': return '#D1FAE5';
            case 'blood_request': return '#FEF2F2';
            default: return '#F1F5F9';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                            <Text style={styles.unreadSub}>
                                {loading ? 'Loading...' : `You have ${unreadCount} unread alerts`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            activeOpacity={0.7}
                            onPress={onClose}
                        >
                            <X size={16} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.centerState}>
                            <ActivityIndicator color="#2FA561" />
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={styles.centerState}>
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {notifications.map((item) => (
                                <View key={item.id} style={styles.notifItem}>
                                    <View style={[styles.iconCircle, { backgroundColor: getIconBg(item.type) }]}>
                                        {getIcon(item.type)}
                                    </View>
                                    <View style={styles.textContent}>
                                        <Text style={styles.boldText} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.descriptionText} numberOfLines={2}>{item.message}</Text>
                                        <View style={styles.timeRow}>
                                            <Clock size={12} color="#94A3B8" />
                                            <Text style={styles.timeText}>{item.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
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
        maxHeight: 420,
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    centerState: {
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: '#94A3B8',
    },
    notifItem: {
        flexDirection: 'row',
        marginBottom: 16,
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
    boldText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    descriptionText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
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
