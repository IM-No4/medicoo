import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '@/src/components/icons/AppIcon';

const SERVICES = [
  {
    id: 'nursing',
    title: 'Home Nursing',
    subtitle: 'Trained nurses at home',
    icon: 'user',
  },
  {
    id: 'physio',
    title: 'Physiotherapy',
    subtitle: 'Post-surgery & mobility care',
    icon: 'activity',
  },
  {
    id: 'elder',
    title: 'Elder Care',
    subtitle: 'Daily assistance & monitoring',
    icon: 'heart',
  },
  {
    id: 'equipment',
    title: 'Medical Equipment',
    subtitle: 'Oxygen, beds, wheelchairs',
    icon: 'box',
  },
];

export default function HomeCareListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home Care</Text>
      </View>

      <FlatList
        data={SERVICES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate('HomeCareDetail', {
                serviceId: item.id,
              })
            }
          >
            <View style={styles.iconWrapper}>
              <AppIcon name={item.icon} size={20} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.subtitle}
              </Text>
            </View>

            <AppIcon
              name="chevron-right"
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
