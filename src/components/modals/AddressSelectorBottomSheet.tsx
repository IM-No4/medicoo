import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import { clearSelectedAddress, setSelectedAddress } from '@/src/redux/slices/addressSlice';
import { RootState } from '@/src/redux/store';
import { getUserAddresses } from '@/src/services/api/address.api';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

interface Address {
  id: string;
  type: string; // 'Home', 'Work', 'Other'
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  _id?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Removed MOCK_ADDRESSES

export default function AddressSelectorBottomSheet({ visible, onClose }: Props) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
  const currentLocation = useSelector((state: RootState) => state.location.currentLocation);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAddresses();
    }
  }, [visible]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data);
    } catch (e) {
      console.warn("Failed to fetch user addresses", e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Home': return 'home';
      case 'Work': return 'briefcase';
      default: return 'map-pin';
    }
  };

  const handleSelectAddress = (item: any) => {
    dispatch(
      setSelectedAddress({
        id: item._id || item.id,
        label: item.label,
        fullAddress: item.fullAddress,
        latitude: item.location?.coordinates?.[1] || item.latitude,
        longitude: item.location?.coordinates?.[0] || item.longitude,
        // Was dropped entirely here before, wiping out any receiver info
        // the address actually had whenever it was selected from this
        // sheet instead of the Address Book screen.
        receiverName: item.receiverName,
        receiverNumber: item.receiverNumber || item.receiverPhone,
      })
    );
    onClose();
  };

  const handleSelectCurrentLocation = () => {
    if (currentLocation) {
      dispatch(clearSelectedAddress());
    }
    onClose();
  };

  const handleAddNew = () => {
    onClose();
    // Use the action executor to navigate to add address
    executeAction('OPEN_ADD_ADDRESS');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <Text style={styles.title}>Select a delivery address</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Saved Addresses List */}
            {loading ? (
              <ActivityIndicator size="small" color="#2FA561" style={{ marginVertical: 20 }} />
            ) : addresses.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#6B7280', marginVertical: 20 }}>No saved addresses found.</Text>
            ) : (
              addresses.map((item) => {
                const itemId = item._id || item.id;
                const isActive = selectedAddress?.id === itemId;
                
                let distanceText = '';
                const addrLat = item.location?.coordinates?.[1] || item.latitude;
                const addrLng = item.location?.coordinates?.[0] || item.longitude;
                if (currentLocation && currentLocation.latitude && currentLocation.longitude && addrLat && addrLng) {
                  const distMeters = getDistance(currentLocation.latitude, currentLocation.longitude, addrLat, addrLng);
                  distanceText = `${(distMeters / 1000).toFixed(1)} km`;
                }

                return (
                  <TouchableOpacity
                    key={itemId}
                    style={[styles.card, isActive && styles.activeCard]}
                    onPress={() => handleSelectAddress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <AppIcon name={getIcon(item.label || item.type)} size={20} color={isActive ? "#2FA561" : "#6B7280"} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>{item.label}</Text>
                        {distanceText ? (
                          <View style={styles.distanceBadge}>
                            <AppIcon name="navigation" size={10} color="#6B7280" />
                            <Text style={styles.distanceText}>{distanceText}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.cardSubtitle} numberOfLines={2}>
                        {item.fullAddress}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.checkCircle}>
                        <AppIcon name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddNew}
              activeOpacity={0.7}
            >
              <AppIcon name="plus" size={18} color="#2FA561" />
              <Text style={styles.addButtonText}>
                Add New Address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#2FA561',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: Platform.OS === 'ios' ? 1 : 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2FA561',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2FA561',
    width: '100%',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2FA561',
  },
});
