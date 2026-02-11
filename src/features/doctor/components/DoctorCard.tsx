import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../../components/icons/AppIcon';

interface Props {
  doctor: any;
  onBook: () => void;
  onPress?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function DoctorCard({ doctor, onBook, onPress, isFavorite, onToggleFavorite }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.mainRow}>
        <View style={styles.imageContainer}>
          {doctor.image ? (
            <Image
              source={{ uri: doctor.image.startsWith('http') ? doctor.image : `http://localhost:5000/${doctor.image}` }}
              style={styles.doctorImage}
            />
          ) : (
            <Text style={{ fontSize: 32 }}>👨‍⚕️</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
            </View>
            <View style={styles.actionsRow}>
              {doctor.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <AppIcon name="star" size={10} color="#fff" />
                  <Text style={styles.ratingText}>{doctor.rating}</Text>
                </View>
              )}
              {onToggleFavorite && (
                <TouchableOpacity onPress={onToggleFavorite} style={styles.favButton}>
                  <AppIcon
                    name="heart"
                    size={20}
                    color={isFavorite ? "#FF3B30" : "#C7C7CC"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.specialty}>{doctor.specialty} • {doctor.experience}</Text>

          <View style={styles.locationRow}>
            <AppIcon name="map-pin" size={12} color="#8e8e93" />
            <Text style={styles.locationText}>{doctor.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.slotInfo}>
          <Text style={styles.slotLabel}>Next Availability</Text>
          <Text style={styles.slotTime}>{doctor.nextSlot}</Text>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={onBook}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favButton: {
    marginLeft: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2FA561',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  specialty: {
    fontSize: 13,
    color: '#3A3A3C',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#8e8e93',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotInfo: {
    flex: 1,
  },
  slotLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 2,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  bookButton: {
    backgroundColor: '#EAF4FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bookButtonText: {
    color: '#1C6ED5',
    fontSize: 13,
    fontWeight: '600',
  },
});