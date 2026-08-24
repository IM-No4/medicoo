import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import AppIcon from '@/src/components/icons/AppIcon';
import { clearUnread, setUnreadCount } from '../../redux/slices/notificationSlice';
import {
  CustomerNotification,
  getCustomerNotifications,
  markAllCustomerNotificationsAsRead,
} from '../../services/api/notification.api';
import NotificationsSkeleton from './NotificationsSkeleton';

type NotificationItem = {
  id: string;
  type: CustomerNotification['type'];
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
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

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await getCustomerNotifications({ limit: 50 });
      const items = (response?.data?.notifications || []).map((item: CustomerNotification) => ({
        id: item._id,
        type: item.type,
        title: item.title,
        subtitle: item.message,
        time: formatRelativeTime(item.createdOn),
        read: item.isRead,
        action: item.actionText && item.actionUrl ? {
          label: item.actionText,
          onPress: () => Linking.openURL(item.actionUrl!).catch(e => console.warn(e)),
        } : undefined,
      }));

      setNotifications(items);
      dispatch(setUnreadCount(response?.data?.unreadCount || 0));

      if (items.length > 0) {
        await markAllCustomerNotificationsAsRead();
        dispatch(clearUnread());
        setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadNotifications();
  }, [loadNotifications]);

  const getNotificationIcon = useCallback((type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return { name: 'shopping-bag', color: '#089643', bgColor: '#E8F5E9' };
      case 'appointment':
      case 'consultation':
        return { name: 'calendar', color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'promotion':
        return { name: 'tag', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'health_reminder':
      case 'reminder':
        return { name: 'heart', color: '#EC4899', bgColor: '#FCE7F3' };
      case 'review':
        return { name: 'star', color: '#10B981', bgColor: '#D1FAE5' };
      case 'blood_request':
        return { name: 'droplet', color: '#EF4444', bgColor: '#FEF2F2' };
      default:
        return { name: 'bell', color: '#64748B', bgColor: '#F1F5F9' };
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: NotificationItem }) => {
    const { name, color, bgColor } = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={item.action?.onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <AppIcon name={name as any} size={18} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
          <Text style={styles.timeTag}>{item.time}</Text>

          {item.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={item.action.onPress}
            >
              <Text style={styles.actionButtonText}>{item.action.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  }, [getNotificationIcon]);

  const emptyState = useMemo(() => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <AppIcon name="bell" size={28} color="#0FBBA1" />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>We’ll show appointment updates, reminders, and important account alerts here.</Text>
    </View>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#F9FAFB" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AppIcon name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <NotificationsSkeleton />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyListContent : styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0FBBA1"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  listContent: {
    padding: 0,
    paddingBottom: 84,
    gap: 0,
    backgroundColor: '#FFFFFF',
  },
  emptyListContent: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    marginHorizontal: 16,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9', // Subtle, premium light border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0, // Clean, zero elevation to avoid harsh Android shadows
    alignItems: 'flex-start',
    gap: 14,
  },
  unreadCard: {
    backgroundColor: '#F0FDF4', // Premium light green background for unread notifications
    borderWidth: 1,
    borderColor: '#DCFCE7', // Soft matching border
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  unreadTitle: {
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  timeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  actionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0FBBA1',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0FBBA1',
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
