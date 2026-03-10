import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import AppIcon from '@/src/components/icons/AppIcon';
import { executeAction } from '@/src/actions/ActionExecutor';
import { clearUnread } from '../../redux/slices/notificationSlice';

type NotificationItem = {
  id: string;
  type: 'order' | 'promotion' | 'health_reminder' | 'appointment';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Confirmed! 🎉',
    subtitle: 'Your payment for Order #MED-84920 has been processed successfully. We will notify you when it is out for delivery.',
    time: '2 mins ago',
    read: false,
    action: {
      label: 'Track Order',
      onPress: () => executeAction('OPEN_MEDICINE_ORDER_DETAIL', { orderId: 'MED-84920' }),
    },
  },
  {
    id: '5',
    type: 'appointment',
    title: 'Dr. Appointment Booked',
    subtitle: 'Your consultation with Dr. Sarah Smith is confirmed for tomorrow at 10:00 AM.',
    time: '15 mins ago',
    read: false,
    action: {
      label: 'View Appointment',
      onPress: () => executeAction('OPEN_CONSULTATION_DETAIL', { appointmentId: 'APT-102' }),
    },
  },
  {
    id: '2',
    type: 'health_reminder',
    title: 'Time for your Vitamin C',
    subtitle: 'Don\'t forget to take your daily dose of 1x Vitamin C (500mg). Stay healthy!',
    time: '1 hr ago',
    read: false,
  },
  {
    id: '3',
    type: 'promotion',
    title: 'Flat 30% OFF on all Skincare ✨',
    subtitle: 'Self-care weekend is here! Dive into our curated skincare collection and grab exclusive deals before they vanish.',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '4',
    type: 'order',
    title: 'Order Delivered 📦',
    subtitle: 'Your recent order of Dolo 650mg has been handed over safely. Rate your delivery experience!',
    time: 'Yesterday',
    read: true,
  },
];

export default function NotificationsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  useEffect(() => {
    // Clear badge when screen opens
    dispatch(clearUnread());
  }, [dispatch]);

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return { name: 'package', color: '#3B82F6', bgColor: '#DBEAFE' };
      case 'appointment':
        return { name: 'calendar', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'promotion':
        return { name: 'tag', color: '#EB6E25', bgColor: '#FFEDD5' };
      case 'health_reminder':
        return { name: 'heart', color: '#EC4899', bgColor: '#FCE7F3' };
      default:
        return { name: 'bell', color: '#2FA561', bgColor: '#F0FDF4' };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const { name, color, bgColor } = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, !item.read && styles.unreadCard]}
      >
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <AppIcon name={name} size={18} color={color} />
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
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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

      {/* List */}
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2FA561"
          />
        }
      />
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
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
    gap: 14,
  },
  unreadCard: {
    backgroundColor: '#F4FBF7',
    borderWidth: 1,
    borderColor: '#E8F5EE',
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
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  timeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  actionButtonText: {
    color: '#2FA561',
    fontWeight: '700',
    fontSize: 12,
  },
});
