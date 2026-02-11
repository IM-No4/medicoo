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
  labTest: {
    id: string;
    name: string;
    price?: number;
    imageUrl?: string | null;
    labName?: string;
    rating?: number;
  };
  onPress: () => void;
};

export default function LabTestListingCard({
  labTest,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      {/* Lab Test Image */}
      <View style={styles.imageContainer}>
        {labTest.imageUrl ? (
          <Image
            source={{ uri: labTest.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultImageContainer}>
            <AppIcon
              name="flask-conical"
              size={32}
              color="#8B5CF6"
            />
          </View>
        )}
      </View>

      {/* Lab Test Info */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {labTest.name}
        </Text>

        {labTest.labName && (
          <Text style={styles.labName} numberOfLines={1}>
            {labTest.labName}
          </Text>
        )}

        <View style={styles.metaRow}>
          {labTest.rating && labTest.rating > 0 && (
            <View style={styles.ratingContainer}>
              <AppIcon name="star" size={12} color="#10B981" />
              <Text style={styles.ratingText}>
                {labTest.rating.toFixed(1)}
              </Text>
            </View>
          )}
          {labTest.price && (
            <Text style={styles.price}>
              ₹{labTest.price}
            </Text>
          )}
        </View>
      </View>

      {/* Chevron */}
      <AppIcon
        name="chevron-right"
        size={20}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F3E8FF',
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
    backgroundColor: '#F3E8FF',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  labName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});


