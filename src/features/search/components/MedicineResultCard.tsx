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
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      {/* Pharmacy Image */}
      <View style={styles.imageContainer}>
        {pharmacy.storeImageUrl ? (
          <Image
            source={{ uri: pharmacy.storeImageUrl }}
            style={styles.storeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.defaultImageContainer}>
            <AppIcon
              name="shopping-bag"
              size={32}
              color="#9CA3AF"
            />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Medicine Info */}
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName} numberOfLines={1}>
            {medicine.name}
          </Text>
          {!!medicine.manufacturer && (
            <Text style={styles.manufacturer} numberOfLines={1}>
              {medicine.manufacturer}
            </Text>
          )}
        </View>

        {/* Pharmacy Info */}
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName} numberOfLines={1}>
            {pharmacy.pharmacyName}
          </Text>

          <View style={styles.pharmacyMetaRow}>
            {/* Rating */}
            {pharmacy.rating > 0 && (
              <View style={styles.ratingContainer}>
                <AppIcon
                  name="star"
                  size={12}
                  color="#F59E0B"
                />
                <Text style={[styles.ratingText, { marginLeft: 3 }]}>
                  {pharmacy.rating.toFixed(1)}
                </Text>
              </View>
            )}

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                pharmacy.isOpen
                  ? styles.statusOpen
                  : styles.statusClosed,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  pharmacy.isOpen
                    ? styles.statusDotOpen
                    : styles.statusDotClosed,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { marginLeft: 4 },
                  pharmacy.isOpen
                    ? styles.statusTextOpen
                    : styles.statusTextClosed,
                ]}
              >
                {pharmacy.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>

            {/* Units Available */}
            <Text style={styles.unitsText}>
              {pharmacy.unitsAvailable} units
            </Text>
          </View>
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
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  defaultImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  medicineInfo: {
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  manufacturer: {
    fontSize: 12,
    color: '#6B7280',
  },
  pharmacyInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pharmacyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  pharmacyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOpen: {
    backgroundColor: '#10B981',
  },
  statusDotClosed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#065F46',
  },
  statusTextClosed: {
    color: '#991B1B',
  },
  unitsText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

});
