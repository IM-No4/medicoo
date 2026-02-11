import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  medicine: {
    id: string;
    name: string;
    manufacturer?: string;
    pharmacy: {
      pharmacyName: string;
      rating: number;
      isOpen: boolean;
      storeImageUrl?: string | null;
    };
  };
  onPress: () => void;
};

export default function FeaturedMedicineCard({
  medicine,
  onPress,
}: Props) {
  const { pharmacy } = medicine;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={onPress}
    >
      {/* Medicine Image */}
      <View style={styles.imageContainer}>
        {pharmacy.storeImageUrl ? (
          <Image
            source={{ uri: pharmacy.storeImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultImageContainer}>
            <AppIcon
              name="pill"
              size={48}
              color="#CBD5E1"
            />
          </View>
        )}
      </View>

      {/* Content Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.medicineName} numberOfLines={2}>
          {medicine.name}
        </Text>
        <View style={styles.metaRow}>
          {pharmacy.rating > 0 && (
            <View style={styles.ratingContainer}>
              <AppIcon name="star" size={12} color="#000000" />
              <Text style={styles.ratingText}>
                {pharmacy.rating.toFixed(1)}
              </Text>
            </View>
          )}
          <Text style={styles.deliveryTime}>
            {pharmacy.isOpen ? 'Available' : 'Closed'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#F0F4F8',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

