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
    sku?: number;
    name: string;
    form: string;
    price?: number;
    discountPrice?: number;
    images?: string[];
    composition?: string;
    prescriptionRequired?: boolean;
    batchNum?: string[] | string | number;
    expiryDate?: string[] | string;
    manufacturer?: string;
    pharmacy: {
      pharmacyId: string;
      pharmacyName: string;
      rating: number;
      unitsAvailable: number;
      isOpen: boolean;
      storeImageUrl?: string | null;
    };
  };
  onPress: () => void;
};

export default function MedicineResultCard({
  medicine,
  onPress,
}: Props) {
  const { pharmacy } = medicine;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <View style={styles.headerRow}>
          {medicine.prescriptionRequired && (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>Rx</Text>
            </View>
          )}
          <Text style={styles.medicineName} numberOfLines={2}>
            {medicine.name}
          </Text>
        </View>

        <Text style={styles.formText}>{medicine.form}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{medicine.discountPrice || medicine.price}</Text>
          {!!medicine.discountPrice && medicine.price && (
            <Text style={styles.oldPrice}>₹{medicine.price}</Text>
          )}
        </View>

        <View style={styles.pharmacyRow}>
          <Text style={styles.pharmacyName} numberOfLines={1}>
            {pharmacy.pharmacyName}
          </Text>
          <View style={styles.dot} />
          <View style={styles.ratingBox}>
            <AppIcon name="star" size={10} color="#10B981" />
            <Text style={styles.ratingText}>{pharmacy.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rightContent}>
        <View style={styles.imageWrapper}>
          {pharmacy.storeImageUrl ? (
            <Image
              source={{ uri: pharmacy.storeImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <AppIcon name="pill" size={32} color="#CBD5E1" />
            </View>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              executeAction('ADD_MEDICINE_FROM_SEARCH', {
                pharmacyId: pharmacy.pharmacyId,
                pharmacyName: pharmacy.pharmacyName,
                medicine,
              });
            }}
          >
            <Text style={styles.addButtonText}>ADD</Text>
            <View style={styles.plusIcon}>
              <AppIcon name="plus" size={12} color="#10B981" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    justifyContent: 'space-between',
    minHeight: 140,
  },
  leftContent: {
    flex: 1,
    paddingRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  rxBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  rxText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    lineHeight: 22,
  },
  formText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  oldPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pharmacyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    maxWidth: '70%',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  rightContent: {
    width: 120,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 120,
    height: 120,
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 90,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  plusIcon: {
    position: 'absolute',
    right: 6,
    top: 4,
  },
});
