import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import { RootState } from '../../redux/store';
import AppIcon from '../icons/AppIcon';

type Props = {
  onPress?: () => void;
};

export default function NotificationBell({ onPress }: Props) {
  const unreadCount = useSelector(
    (state: RootState) => state.notifications.unreadCount
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      hitSlop={10}
    >
      <AppIcon name="bell" size={22} color="#ffffff" />

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
