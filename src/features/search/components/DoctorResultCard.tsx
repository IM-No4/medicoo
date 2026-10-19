import AppIcon from '@/src/components/icons/AppIcon';
import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatDoctorName } from '../../../utils/formatters';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  imageUrl?: string | null;
  location?: string;
  distance?: string;
};

type Props = {
  doctor: Doctor;
  onPress: () => void;
};

export default function DoctorResultCard({
  doctor,
  onPress,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      {/* Doctor Image */}
      <View style={styles.imageContainer}>
        {doctor.imageUrl ? (
          <Image
            source={{ uri: doctor.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultImageContainer}>
            <AppIcon
              name="stethoscope"
              size={32}
              color="#2563EB"
            />
          </View>
        )}
      </View>

      {/* Doctor Info */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {formatDoctorName(doctor.name)}
        </Text>

        <Text style={styles.specialty} numberOfLines={1}>
          {doctor.specialty}
        </Text>

        <View style={styles.metaRow}>
          {doctor.rating > 0 && (
            <View style={styles.ratingContainer}>
              <AppIcon name="star" size={14} color="#10B981" />
              <Text style={styles.ratingText}>
                {doctor.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {doctor.experience > 0 && (
            <Text style={styles.experience}>
              {doctor.experience} yrs exp
            </Text>
          )}
        </View>

        {doctor.location && (
          <Text style={styles.location} numberOfLines={1}>
            {doctor.location}
            {doctor.distance && ` • ${doctor.distance}`}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <AppIcon
        name="chevron-right"
        size={20}
        color={theme.textMuted}
      />
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: c.card,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: c.infoBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  defaultImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.infoBg,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  experience: {
    fontSize: 12,
    color: c.textSecondary,
  },
  location: {
    fontSize: 12,
    color: c.textSecondary,
  },
});
