import AppIcon from '@/src/components/icons/AppIcon';
import { RenderMedicationIcon } from '@/src/components/modals/AddMedicationModal/config/shapes';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FeedAction } from '../feed/feed.actions';

type UpcomingItem = {
  id: string;
  type: 'appointment' | 'medicine';
  title: string;
  subtitle: string;
  time: string;
  color?: string;
  // Medicine specific
  shape?: string;
  leftColor?: string;
  rightColor?: string;
};

type Props = {
  title: string;
  appointments?: any[];
  medicines?: any[];
  onAction?: (action: FeedAction) => void;
  seeAllAction?: FeedAction;
};

function UpcomingSection({ title, appointments = [], medicines = [], onAction, seeAllAction }: Props) {
  const navigation = useNavigation<any>();
  // Combine and transform data
  const items: UpcomingItem[] = [
    ...appointments.map((a) => ({
      id: `appt-${a.id}`,
      type: 'appointment' as const,
      title: a.title, // e.g. "Dr. Sharma"
      subtitle: a.subtitle, // e.g. "Cardiologist"
      time: a.startTime || a.time,
      color: '#0284C7',
    })),
    ...medicines.map((m) => ({
      id: `med-${m.id}`,
      type: 'medicine' as const,
      title: m.title, // e.g. "Paracetamol"
      subtitle: m.subtitle, // e.g. "1 pill"
      time: m.time,
      color: m.color,
      shape: m.shape,
      leftColor: m.leftColor,
      rightColor: m.rightColor,
    })),
  ];

  // Simple sort by time
  items.sort((a, b) => a.time.localeCompare(b.time));

  // Take first 3
  const upcomingItems = items.slice(0, 3);

  const handleSeeAll = () => {
    if (onAction && seeAllAction) {
      onAction(seeAllAction);
    } else {
      navigation.navigate('Calendar');
    }
  };

  if (upcomingItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={handleSeeAll}
        >
          <Text style={styles.seeAll}>See all</Text>
          <AppIcon name={"chevron-right" as any} color="#1c1c1e" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardSection}>
        {upcomingItems.map((item, index) => {
          const isMedicine = item.type === 'medicine';
          // Use medicine color for background if available (like MedicineCard)
          // MedicineCard logic: backgroundColor: isSkipped ? '#FFEBEB' : (color || '#E0F7F4')
          const bgStyle = isMedicine
            ? { backgroundColor: item.color || '#E0F7F4' }
            : styles.iconBoxAppt;

          return (
            <View key={item.id} style={[styles.card, { marginTop: index > 0 ? 12 : 0 }]}>
              {/* Icon / Avatar */}
              <View style={[styles.iconBox, bgStyle]}>
                {isMedicine ? (
                  <RenderMedicationIcon
                    shapeKey={item.shape || 'tablet'}
                    leftColor={item.leftColor}
                    rightColor={item.rightColor}
                    size={0.8}
                  />
                ) : (
                  <Text style={{ fontSize: 20 }}>👨‍⚕️</Text>
                )}
              </View>

              {/* Content */}
              <View style={styles.info}>
                <Text style={styles.primary}>{item.title}</Text>
                <Text style={styles.secondary}>{item.subtitle}</Text>
              </View>

              {/* Time Badge */}
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default React.memo(UpcomingSection);

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  seeAll: {
    fontSize: 14,
    color: '#1c1c1e',
    fontWeight: '600',
  },
  cardSection: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxMed: {
    backgroundColor: '#E0F7F4', // Light teal
  },
  iconBoxAppt: {
    backgroundColor: '#EEF2FF', // Light indigo
  },
  info: {
    flex: 1,
  },
  primary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D21',
  },
  secondary: {
    fontSize: 13,
    color: '#8F9BB3',
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
});