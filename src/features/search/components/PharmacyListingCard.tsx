import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MedicineItem = {
  id: string;
  name: string;
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

type Props = {
  pharmacy: {
    id: string;
    name: string;
    rating: number;
    isOpen: boolean;
    deliveryTime?: string;
    location?: string;
    distance?: string;
    storeImageUrl?: string | null;
    medicines: MedicineItem[];
  };
  onPress: () => void;
  onMedicinePress: (medicine: MedicineItem) => void;
};

export default function PharmacyListingCard({
  pharmacy,
  onPress,
  onMedicinePress,
}: Props) {
  const renderMedicineCard = ({ item }: { item: MedicineItem }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.medicineCard}
      onPress={() => onMedicinePress(item)}
    >
      <View style={styles.medicineImageContainer}>
        {item.pharmacy.storeImageUrl ? (
          <Image
            source={{ uri: item.pharmacy.storeImageUrl }}
            style={styles.medicineImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.medicineDefaultImage}>
            <AppIcon name="pill" size={32} color="#CBD5E1" />
          </View>
        )}
      </View>
      <Text style={styles.medicineName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.pharmacy.rating > 0 && (
        <View style={styles.medicineRating}>
          <AppIcon name="star" size={10} color="#10B981" />
          <Text style={styles.medicineRatingText}>
            {item.pharmacy.rating.toFixed(1)}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          executeAction('ADD_MEDICINE_FROM_SEARCH', {
            pharmacyId: item.pharmacy.pharmacyId,
            pharmacyName: item.pharmacy.pharmacyName,
            medicine: item,
          });
        }}
      >
        <Text style={styles.addButtonText}>ADD</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Pharmacy Header */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.pharmacyHeader}
        onPress={onPress}
      >
        {/* Pharmacy Image */}
        <View style={styles.pharmacyImageContainer}>
          {pharmacy.storeImageUrl ? (
            <Image
              source={{ uri: pharmacy.storeImageUrl }}
              style={styles.pharmacyImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.pharmacyDefaultImage}>
              <AppIcon name="shopping-bag" size={40} color="#CBD5E1" />
            </View>
          )}
        </View>

        {/* Pharmacy Info */}
        <View style={styles.pharmacyInfo}>
          {pharmacy.isOpen && (
            <View style={styles.fastDeliveryBadge}>
              <AppIcon name="clock" size={12} color="#EF4444" />
              <Text style={styles.fastDeliveryText}>
                {pharmacy.deliveryTime || 'Fast Delivery'}
              </Text>
            </View>
          )}

          <Text style={styles.pharmacyName} numberOfLines={1}>
            {pharmacy.name}
          </Text>

          <View style={styles.pharmacyMetaRow}>
            {pharmacy.rating > 0 && (
              <>
                <AppIcon name="star" size={14} color="#10B981" />
                <Text style={styles.ratingText}>
                  {pharmacy.rating.toFixed(1)}
                </Text>
              </>
            )}
            {pharmacy.deliveryTime && (
              <Text style={styles.deliveryTime}>
                {pharmacy.deliveryTime}
              </Text>
            )}
          </View>

          {pharmacy.location && (
            <Text style={styles.location} numberOfLines={1}>
              {pharmacy.location}
              {pharmacy.distance && ` • ${pharmacy.distance}`}
            </Text>
          )}

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Free Delivery</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <AppIcon
          name="chevron-right"
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {/* Horizontal Medicine Scroll */}
      {pharmacy.medicines.length > 0 && (
        <FlatList
          data={pharmacy.medicines}
          renderItem={renderMedicineCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.medicinesList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 16,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  pharmacyImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pharmacyImage: {
    width: '100%',
    height: '100%',
  },
  pharmacyDefaultImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  pharmacyInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  fastDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
    gap: 4,
  },
  fastDeliveryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  pharmacyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  pharmacyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  deliveryTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  medicinesList: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
  },
  medicineCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  medicineImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8F9FA',
  },
  medicineImage: {
    width: '100%',
    height: '100%',
  },
  medicineDefaultImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  medicineName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    padding: 8,
    paddingBottom: 4,
  },
  medicineRating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 3,
  },
  medicineRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  addButton: {
    margin: 8,
    marginTop: 4,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

