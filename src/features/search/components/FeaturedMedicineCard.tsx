import AppIcon from '@/src/components/icons/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
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
      deliveryTime?: string;
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

      {/* Offer Badge */}
      <View style={styles.offerBadge}>
        <Text style={styles.offerText}>GET 30% OFF</Text>
      </View>

      {/* Content Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.overlay}
      >
        <Text style={styles.pharmacyName} numberOfLines={1}>
          {pharmacy.pharmacyName}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingContainer}>
            <AppIcon name="star" size={12} color="#FFFFFF" />
            <Text style={styles.ratingText}>
              {pharmacy.rating > 0 ? pharmacy.rating.toFixed(1) : 'New'}
            </Text>
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.deliveryTime}>
            {pharmacy.deliveryTime || (pharmacy.isOpen ? '20-25 mins' : 'Closed')}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    position: 'relative',
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
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 0,
    backgroundColor: '#EB6E25',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 2,
  },
  offerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 32,
    justifyContent: 'flex-end',
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dot: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  deliveryTime: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

