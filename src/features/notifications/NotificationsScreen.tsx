import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { clearUnread } from '../../redux/slices/notificationSlice';

export default function NotificationsScreen() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear badge when screen opens
    dispatch(clearUnread());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      {/* Later: FlatList of notifications */}
      <Text style={styles.empty}>
        No notifications yet
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  empty: {
    marginTop: 40,
    color: '#999',
    textAlign: 'center',
  },
});
