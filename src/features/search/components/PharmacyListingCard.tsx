import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
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
  sku?: number;
  price?: number;
  discountPrice?: number;
  images?: string[];
  composition?: string;
  prescriptionRequired?: boolean;
  batchNum?: any;
  expiryDate?: any;
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
    distanceKm?: number;
    storeImageUrl?: string | null;
    todayOpenHours?: any;
    storeStatus?: string;
    medicines: MedicineItem[];
  };
  onPress: () => void;
  onMedicinePress: (medicine: MedicineItem) => void;
  isLast?: boolean;
  variant?: 'list' | 'hero';
};

export default function PharmacyListingCard({
  pharmacy,
  onPress,
  onMedicinePress,
  isLast,
  variant = 'list',
}: Props) {
  const getUnavailableText = () => {
    if (pharmacy.todayOpenHours?.openTime && pharmacy.storeStatus === 'offline') {
      try {
        const timeStr = pharmacy.todayOpenHours.openTime;
        const [time, modifier] = timeStr.trim().split(/\s+/);
        let [hours, minutes] = time.split(':');
        let h = parseInt(hours, 10);
        if (modifier?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (modifier?.toUpperCase() === 'AM' && h === 12) h = 0;
        
        const now = new Date();
        const openTime = new Date();
        openTime.setHours(h, parseInt(minutes || '0', 10), 0, 0);
        
        if (now < openTime) {
          return `Opens at ${timeStr}`;
        }
      } catch (e) {
        // Fallback to default return
      }
    }
    return 'Currently Unavailable';
  };

  const renderMedicineCard = ({ item }: { item: MedicineItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
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
            <AppIcon name="pill" size={24} color="#CBD5E1" />
          </View>
        )}
        <TouchableOpacity
          style={styles.smallAddButton}
          onPress={() => {
            executeAction('ADD_MEDICINE_FROM_SEARCH', {
              pharmacyId: item.pharmacy.pharmacyId,
              pharmacyName: item.pharmacy.pharmacyName,
              medicine: item,
            });
          }}
        >
          <AppIcon name="plus" size={14} color="#10B981" />
        </TouchableOpacity>
      </View>
      <View style={styles.medicineInfo}>
        <Text style={styles.medicineName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Pharmacy Header */}
      {variant === 'hero' ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.heroCard}
          onPress={onPress}
        >
          <View style={styles.heroImageContainer}>
            {pharmacy.storeImageUrl ? (
              <Image
                source={{ uri: pharmacy.storeImageUrl }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]}>
                <AppIcon name="store" size={48} color="#CBD5E1" />
              </View>
            )}

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.heroGradient}
            />

            <View style={styles.heroOfferBadge}>
              <Text style={styles.heroOfferText}>GET 30% OFF</Text>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroName}>{pharmacy.name}</Text>
              <View style={styles.heroMeta}>
                <AppIcon name="star" size={14} color="#FFFFFF" />
                <Text style={styles.heroMetaText}>
                  {pharmacy.rating > 0 ? pharmacy.rating.toFixed(1) : 'New'}
                </Text>
                <View style={styles.heroDot} />
                <Text style={styles.heroMetaText}>
                  {pharmacy.deliveryTime || '15-20 mins'}
                </Text>
              </View>
            </View>
          </View>

          {/* Closed Overlay hero variant */}
          {!pharmacy.isOpen && (
            <View style={styles.closedOverlayHero}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>
                  {getUnavailableText()}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.pharmacyHeader}
          onPress={onPress}
        >
          <View style={styles.pharmacyInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.pharmacyName} numberOfLines={1}>
                {pharmacy.name}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.ratingBox}>
                <AppIcon name="star" size={14} color="#10B981" />
                <Text style={styles.ratingText}>
                  {pharmacy.rating > 0 ? pharmacy.rating.toFixed(1) : 'New'}
                </Text>
                <Text style={styles.countText}>(200+)</Text>
              </View>
              <View style={styles.dot} />
              <Text style={styles.timeText}>
                {pharmacy.deliveryTime || '25-30 mins'}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.timeText}>
                {pharmacy.distanceKm !== undefined ? `${pharmacy.distanceKm} km` : (pharmacy.distance || '2.5 km')}
              </Text>
            </View>

            <View style={styles.offersContainer}>
              <View style={styles.offerRow}>
                <View style={styles.offerBadge}>
                  <AppIcon name="tag" size={12} color="#EB6E25" />
                </View>
                <Text style={styles.offerText}>Items at ₹59</Text>
              </View>
              <View style={styles.offerRow}>
                <View style={styles.offerBadge}>
                  <AppIcon name="tag" size={12} color="#EB6E25" />
                </View>
                <Text style={styles.offerText}>Free Delivery</Text>
              </View>
            </View>

            <View style={styles.benefitsRow}>
              <View style={styles.benefitTag}>
                <Text style={styles.benefitText}>one</Text>
              </View>
              <Text style={styles.benefitDetail}>BENEFITS</Text>
            </View>
          </View>

          <View style={styles.pharmacyImageWrapper}>
            {pharmacy.storeImageUrl ? (
              <Image
                source={{ uri: pharmacy.storeImageUrl }}
                style={styles.pharmacyImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.pharmacyDefaultImage}>
                <AppIcon name="store" size={32} color="#CBD5E1" />
              </View>
            )}
            <View style={styles.imageOverlayBadge}>
              <Text style={styles.overlayBadgeText}>30% OFF</Text>
            </View>
          </View>

          {/* Closed Overlay list variant */}
          {!pharmacy.isOpen && (
            <View style={styles.closedOverlayList}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>
                  {getUnavailableText()}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Horizontal Medicine Scroll */}
      {pharmacy.medicines.length > 0 && (
        <View style={styles.medicinesCarousel}>
          <FlatList
            data={pharmacy.medicines}
            renderItem={renderMedicineCard}
            keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `med-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.medicinesList}
          />
        </View>
      )}

      {!isLast && <View style={styles.itemDivider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  pharmacyHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  pharmacyName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starCircle: {
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  offersContainer: {
    gap: 4,
    marginBottom: 8,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerBadge: {
    padding: 2,
  },
  offerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  benefitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  benefitTag: {
    backgroundColor: '#EB6E25',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  benefitText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  benefitDetail: {
    fontSize: 10,
    color: '#EB6E25',
    fontWeight: '800',
    letterSpacing: 1,
  },
  pharmacyImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  imageOverlayBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EB6E25',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
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
    backgroundColor: '#F9FAFB',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginTop: 8,
  },
  medicinesCarousel: {
    marginBottom: 8,
  },
  medicinesList: {
    padding: 16,
    gap: 16,
  },
  medicineCard: {
    width: 130,
  },
  medicineImageContainer: {
    width: 130,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  },
  smallAddButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicineInfo: {
    paddingHorizontal: 2,
  },
  medicineName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 18,
  },
  // Hero Variant Styles
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  heroOfferBadge: {
    position: 'absolute',
    top: 16,
    left: 0,
    backgroundColor: '#EB6E25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  heroOfferText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 2,
  },
  closedOverlayHero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  closedOverlayList: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closedBadgeText: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

