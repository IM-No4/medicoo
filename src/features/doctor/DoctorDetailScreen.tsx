import { DoctorStackParamList } from '@/src/navigation/DoctorStack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import AppIcon from '../../components/icons/AppIcon';
import { RootState } from '../../redux/store';
import { API_BASE_URL } from '../../services/api/client';
import { getPublicDoctorProfile } from '../../services/api/doctor.api';
import RequestAppointmentModal from './components/RequestAppointmentModal';
import { useTrackActivity } from '../../hooks/useTrackActivity';

// Define useAppSelector locally since hooks file is missing
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default function DoctorDetailsScreen() {
  type NavProp = NativeStackNavigationProp<
    DoctorStackParamList,
    'DoctorDetail'
  >;

  const navigation = useNavigation<NavProp>();
  type RouteProps = RouteProp<
    DoctorStackParamList,
    'DoctorDetail'
  >;

  const route = useRoute<RouteProps>();
  const { doctor, doctorId, intent, preview } = (route.params || {}) as any;
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(doctor || null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const hasAutoBookedRef = useRef(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Get current user ID to check if viewing own profile
  const { user } = useAppSelector(state => state.auth);
  // Normalize user ID comparison - convert to string to be safe
  const isOwnProfile = user?.id && data?.id && String(user.id) === String(data.id);
  const isActionDisabled = isOwnProfile || preview;

  // Track this as a resumable activity (only when not preview mode)
  const resolvedDoctorId = doctor?.id || doctor?._id || doctorId;
  useTrackActivity({
    id: `doctor-${resolvedDoctorId}`,
    title: `Booking ${data?.name || 'Doctor'}`,
    subtitle: 'Continue from where you left',
    icon: 'stethoscope',
    stack: 'DoctorStack',
    screen: 'DoctorDetail',
    params: { doctorId: resolvedDoctorId },
    progress: 0.3,
  });

  useEffect(() => {
    checkFavoriteStatus();
    fetchDoctorDetails();
  }, [doctor, doctorId]);

  const fetchDoctorDetails = async () => {
    // try multiple possible ID fields
    const id = doctor?.id || doctor?._id || doctorId;
    if (!id) return;

    try {
      // Don't show loading if we have initial data
      if (!data) setLoading(true);
      const res = await getPublicDoctorProfile(id);
      // Helper to extract fee value
      const getFee = (val: any) => {
        if (typeof val === 'object' && val !== null) return Number(val.fee) || 0;
        return Number(val) || 0;
      };

      setData(prev => ({
        ...prev,
        ...res,
        // Map API response to component state structure
        id: res.doctorId,
        name: res.name,
        image: res.uniformPhoto,
        specialty: res.specialization,
        rating: res.rating,
        reviews: res.reviewsCount,
        location: res.hospital,
        description: res.bio,
        experience: res.experience,
        // Default to chat fee for main display
        consultationFee: getFee(res.consultationFees?.chat),
        totalPatients: res.patientsConsulted,
        doctorType: res.doctorType,
        languages: res.languages,
        consultationFees: res.consultationFees,
        nextSlot: res.availability
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      intent === 'BOOK' &&
      data &&
      !hasAutoBookedRef.current
    ) {
      hasAutoBookedRef.current = true;
      navigation.navigate('BookAppointment', { doctor: data });
    }
  }, [intent, data, navigation]);

  const checkFavoriteStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        const favorites = JSON.parse(stored);
        if (favorites.includes(data.id)) setIsFavorite(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      let favorites = stored ? JSON.parse(stored) : [];

      if (isFavorite) {
        favorites = favorites.filter((id: string) => id !== doctor.id);
      } else {
        favorites.push(doctor.id);
      }

      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    try {
      const url = `medicoo://doctor/${data.id}`;
      await Share.share({
        message: `Check out Dr. ${data.name}, ${data.specialty} at ${data.location}. Book here: ${url}`,
        url: url, // iOS support
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestSubmit = (requestData: any) => {
    // Navigate to booking success or a special success page for requests
    setShowRequestModal(false);
    // For now simulate navigating to Success
    navigation.navigate('BookingSuccess', {
      isRequest: true,
      ...requestData
    });
  };

  if (!data) return null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <AppIcon name="arrow-left" size={24} color="#1c1c1e" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton}>
            <AppIcon name="heart" size={24} color={isFavorite ? "#FF3B30" : "#1c1c1e"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.iconButton, { marginLeft: 8 }]}>
            <AppIcon name="share" size={24} color="#1c1c1e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            {data.image || data.uniformPhoto ? (
              <Image
                source={{
                  uri: (data.image || data.uniformPhoto).startsWith('http')
                    ? (data.image || data.uniformPhoto)
                    : `${API_BASE_URL}/${data.image || data.uniformPhoto}`
                }}
                style={styles.doctorImage}
              />
            ) : (
              <Text style={{ fontSize: 48 }}>👨‍⚕️</Text>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{data.name || 'Doctor'}</Text>
            <View style={styles.verifiedBadge}>
              <AppIcon name="check" size={12} color="#fff" />
            </View>
            {data.doctorType && (
              <View style={styles.doctorTypeBadge}>
                <Text style={styles.doctorTypeText}>{data.doctorType}</Text>
              </View>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.specialty}>{data.specialty || data.specialization}</Text>
            <View style={styles.dot} />
            <View style={styles.hospitalBadge}>
              <AppIcon name="map-pin" size={12} color="#1C6ED5" />
              <Text style={styles.hospitalText}>{data.location || data.hospital}</Text>
            </View>
          </View>


        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#EAF4FF' }]}>
              <AppIcon name="users" size={20} color="#1C6ED5" />
            </View>
            <Text style={styles.statValue}>{data.totalPatients || '0'}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF6EA' }]}>
              <AppIcon name="star" size={20} color="#C47A16" />
            </View>
            <Text style={styles.statValue}>{data.rating || data.averageRating || 0}</Text>
            <Text style={styles.statLabel}>{data.reviews || data.totalReviews} Reviews</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#EAFBF3' }]}>
              <AppIcon name="stethoscope" size={20} color="#0E7439" />
            </View>
            <Text style={styles.statValue}>{typeof data.experience === 'number' ? `${data.experience} yrs` : data.experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            {data.description || `${data.name} is a highly skilled ${data.specialty || data.specialization} with over ${data.experience} experience.`}
          </Text>

          {data.languages && data.languages.length > 0 && (
            <View style={styles.languageContainer}>
              {data.languages.map((lang: string, index: number) => (
                <View key={index} style={styles.languageBadge}>
                  <Text style={styles.languageText}>{lang}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Consultation Fees */}
        {
          data.consultationFees && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consultation Fees</Text>
              <View style={styles.feesContainer}>
                {(() => {
                  const chat = data.consultationFees.chat;
                  const isChatEnabled = typeof chat === 'object' ? chat.isEnabled : (chat !== undefined);
                  const chatFee = typeof chat === 'object' ? chat.fee : chat;

                  if (isChatEnabled) return (
                    <View style={styles.feeItem}>
                      <View style={[styles.feeIcon, { backgroundColor: '#EAF4FF' }]}>
                        <AppIcon name="message-square" size={20} color="#1C6ED5" />
                      </View>
                      <View>
                        <Text style={styles.feeLabel}>Chat</Text>
                        <Text style={styles.feeAmount}>₹{chatFee}</Text>
                      </View>
                    </View>
                  );
                })()}

                {(() => {
                  const voice = data.consultationFees.voice;
                  const isVoiceEnabled = typeof voice === 'object' ? voice.isEnabled : (voice !== undefined);
                  const voiceFee = typeof voice === 'object' ? voice.fee : voice;

                  if (isVoiceEnabled) return (
                    <View style={styles.feeItem}>
                      <View style={[styles.feeIcon, { backgroundColor: '#EAFBF3' }]}>
                        <AppIcon name="phone" size={20} color="#0E7439" />
                      </View>
                      <View>
                        <Text style={styles.feeLabel}>Voice</Text>
                        <Text style={styles.feeAmount}>₹{voiceFee}</Text>
                      </View>
                    </View>
                  );
                })()}

                {(() => {
                  const video = data.consultationFees.video;
                  const isVideoEnabled = typeof video === 'object' ? video.isEnabled : (video !== undefined);
                  const videoFee = typeof video === 'object' ? video.fee : video;

                  if (isVideoEnabled) return (
                    <View style={styles.feeItem}>
                      <View style={[styles.feeIcon, { backgroundColor: '#FFF6EA' }]}>
                        <AppIcon name="video" size={20} color="#C47A16" />
                      </View>
                      <View>
                        <Text style={styles.feeLabel}>Video</Text>
                        <Text style={styles.feeAmount}>₹{videoFee}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          )
        }

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityRow}>
              <AppIcon name="calendar-days" size={20} color="#5B4FDB" />
              <Text style={styles.availabilityText}>Next Available: {data.nextSlot || data.availability || 'Check availability'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.availabilityRow}>
              <AppIcon name="clock" size={20} color="#5B4FDB" />
              <Text style={styles.availabilityText}>10:00 AM - 07:00 PM</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.bookButton, isActionDisabled && styles.disabledButton, { flex: 1 }]}
          onPress={() => {
            if (isActionDisabled) return;
            if (data?.nextSlot === 'Not Available') {
              setShowRequestModal(true);
            } else {
              navigation.navigate('BookAppointment', { doctor: data });
            }
          }}
          disabled={!!isActionDisabled}
        >
          <Text style={styles.bookButtonText}>
            {isActionDisabled ? (preview ? 'Preview Mode' : 'Your Profile') : (data?.nextSlot === 'Not Available' ? 'Request Appointment' : 'Book Appointment')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request Modal */}
      {data && (
        <RequestAppointmentModal
          visible={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          doctorName={data.name || 'Doctor'}
          consultationFees={data.consultationFees || {}}
          onRequest={handleRequestSubmit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 12,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: '50%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  verifiedBadge: {
    backgroundColor: '#2FA561',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  specialty: {
    fontSize: 13,
    color: '#8e8e93',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
  },
  hospitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  hospitalText: {
    fontSize: 12,
    color: '#1C6ED5',
    fontWeight: '600',
  },
  doctorTypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  doctorTypeText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 12,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingTop: 0,
    borderBottomWidth: 8,
    borderBottomColor: '#F2F2F7',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 22,
  },
  availabilityCard: {
    backgroundColor: '#F1EEFF',
    borderRadius: 16,
    padding: 16,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 13,
    color: '#5B4FDB',
    fontWeight: '500',
    marginLeft: 12,
  },
  feesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  feeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  feeLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  divider: {
    height: 1,
    backgroundColor: '#D6D1F5',
    marginVertical: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 32,
    borderTopColor: '#E5E5EA',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  bookButton: {
    backgroundColor: '#2FA561', borderRadius: 24, paddingVertical: 16, alignItems: 'center',
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledButton: { backgroundColor: '#A0C4F2' },
});