import { DoctorStackParamList } from '@/src/navigation/DoctorStack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../actions/ActionExecutor';
import AppIcon from '../../components/icons/AppIcon';
import { useTrackActivity } from '../../hooks/useTrackActivity';
import { dismissActivity } from '../../redux/slices/activitySlice';
import { AppDispatch, RootState } from '../../redux/store';
import { API_BASE_URL } from '../../services/api/client';
import { getPublicDoctorProfile, requestAppointment } from '../../services/api/doctor.api';
import { addFavoriteDoctor, getFavoriteDoctors, removeFavoriteDoctor } from '../../services/api/user.api';
import { formatDoctorName } from '../../utils/formatters';
import RequestAppointmentModal from './components/RequestAppointmentModal';

// Define useAppSelector locally since hooks file is missing
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const ACTIVE_APPOINTMENT_LABEL: Record<string, string> = {
  pending: 'You have a pending request with this doctor',
  approved: 'You have an upcoming appointment with this doctor',
};

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
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState(doctor || null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const hasAutoBookedRef = useRef(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Get current user ID to check if viewing own profile
  const { user } = useAppSelector(state => state.auth);
  // Normalize user ID comparison - convert to string to be safe
  const isOwnProfile = user?.id && data?.id && String(user.id) === String(data.id);
  const isActionDisabled = isOwnProfile || preview;
  const isNotAccepting = data?.isAcceptingAppointments === false;

  // Track this as a resumable activity (only when not preview mode)
  const resolvedDoctorId = doctor?.id || doctor?._id || doctorId;
  useTrackActivity({
    id: `doctor-${resolvedDoctorId}`,
    title: `Booking ${formatDoctorName(data?.name) || 'Doctor'}`,
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
      data.isAcceptingAppointments !== false &&
      !hasAutoBookedRef.current
    ) {
      hasAutoBookedRef.current = true;
      setShowRequestModal(true);
    }
  }, [intent, data]);

  const checkFavoriteStatus = async () => {
    const id = doctor?.id || doctor?._id || doctorId;
    if (!id) return;

    try {
      const res = await getFavoriteDoctors();
      const list = Array.isArray(res) ? res : res?.data || res?.doctors || [];
      const ids = list
        .map((item: any) => item.doctorId || item.id || item._id)
        .filter(Boolean);
      setIsFavorite(ids.includes(id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async () => {
    const id = data?.id || doctor?.id || doctor?._id || doctorId;
    if (!id || isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavoriteDoctor(id);
        setIsFavorite(false);
      } else {
        await addFavoriteDoctor(id);
        setIsFavorite(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = `medicoo://doctor/${data.id}`;
      await Share.share({
        message: `Check out ${formatDoctorName(data.name)}, ${data.specialty} at ${data.location}. Book here: ${url}`,
        url: url, // iOS support
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestSubmit = async (requestData: any) => {
    const doctorId = resolvedDoctorId;
    if (!doctorId) {
      throw new Error('Could not determine which doctor to request - please try again.');
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const preferredDate = requestData.date.toISOString().split('T')[0];
    const preferredTime = `${pad(requestData.time.getHours())}:${pad(requestData.time.getMinutes())}`;

    // Throws on failure - RequestAppointmentModal catches it and shows the
    // error itself, keeping the modal open so the user can retry.
    const res = await requestAppointment({
      doctorId,
      preferredDate,
      preferredTime,
      reason: requestData.reason,
      consultationType: requestData.type,
    });

    setShowRequestModal(false);
    // The "Continue where you left off" card on Home tracks this as a
    // resumable in-progress booking - now that the request has actually
    // been submitted, there's nothing left to resume.
    dispatch(dismissActivity());
    navigation.navigate('BookingSuccess', {
      isRequest: true,
      requestId: res?.data?.requestId,
    });
  };

  if (!data) return null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* Hero Image with basic details overlaid on it */}
        <View style={styles.heroContainer}>
          {data.image || data.uniformPhoto ? (
            <Image
              source={{
                uri: (data.image || data.uniformPhoto).startsWith('http')
                  ? (data.image || data.uniformPhoto)
                  : `${API_BASE_URL}/${data.image || data.uniformPhoto}`
              }}
              style={styles.heroImage}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontSize: 72 }}>👨‍⚕️</Text>
            </View>
          )}

          {/* Header icons, overlaid on the image */}
          <View style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.overlayIconButton}>
              <AppIcon name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            {!isActionDisabled && (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={toggleFavorite} disabled={isFavoriteLoading} style={styles.overlayIconButton}>
                  {isFavoriteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <AppIcon name="heart" size={22} color={isFavorite ? "#FF3B30" : "#fff"} fill={isFavorite ? "#FF3B30" : "none"} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={[styles.overlayIconButton, { marginLeft: 8 }]}>
                  <AppIcon name="share" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Scrim so light text stays legible over any photo - kept short and
              graduated so it only darkens the strip right behind the text,
              not the photo as a whole. */}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.35, 1]}
            style={styles.heroScrim}
            pointerEvents="none"
          />

          {/* Basic Details, overlaid at the bottom of the image */}
          <View style={styles.profileSection}>
            <View style={styles.profileHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.specialtyLabel} numberOfLines={1}>
                  {[data.specialty || data.specialization, data.doctorType].filter(Boolean).join(' • ')}
                </Text>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{formatDoctorName(data.name) || 'Doctor'}</Text>
                  <View style={styles.verifiedBadge}>
                    <AppIcon name="check" size={11} color="#fff" />
                  </View>
                </View>
              </View>

              {(data.rating || data.averageRating) ? (
                <View style={styles.ratingPill}>
                  <AppIcon name="star" size={13} color="#FFD166" />
                  <Text style={styles.ratingPillText}>{data.rating || data.averageRating}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.locationRow}>
              <AppIcon name="map-pin" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.locationText} numberOfLines={1}>{data.location || data.hospital}</Text>
            </View>
          </View>
        </View>

        {/* Doctor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor information</Text>
          <View style={styles.infoCardsRow}>
            <View style={[styles.infoCard, { backgroundColor: '#EEF4FF', borderColor: '#DCE8FF' }]}>
              <View style={[styles.infoCardIconBox, { backgroundColor: '#DCE8FF' }]}>
                <AppIcon name="briefcase" size={17} color="#1C6ED5" />
              </View>
              <Text style={styles.infoCardValue}>
                {typeof data.experience === 'number' ? `${data.experience} Years` : (data.experience || '—')}
              </Text>
              <Text style={styles.infoCardLabel}>Experience</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#F0FBF3', borderColor: '#D7F3DF' }]}>
              <View style={[styles.infoCardIconBox, { backgroundColor: '#D7F3DF' }]}>
                <AppIcon name="languages" size={17} color="#0E9448" />
              </View>
              <Text style={styles.infoCardValue} numberOfLines={1}>
                {data.languages?.[0] || 'N/A'}
              </Text>
              <Text style={styles.infoCardLabel}>Language</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: '#FFF6EA', borderColor: '#FDE9C8' }]}>
              <View style={[styles.infoCardIconBox, { backgroundColor: '#FDE9C8' }]}>
                <AppIcon name="clock" size={17} color="#C47A16" />
              </View>
              <Text style={styles.infoCardValue} numberOfLines={1}>
                {[data.nextSlot, data.availability].find(v => typeof v === 'string') || 'Check profile'}
              </Text>
              <Text style={styles.infoCardLabel}>Availability</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <Text style={styles.aboutText}>
            {data.description || `${formatDoctorName(data.name)} is a highly skilled ${data.specialty || data.specialization} with over ${data.experience} experience.`}
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


      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {data.activeAppointment && (
          <TouchableOpacity
            style={styles.activeAppointmentBanner}
            onPress={() => executeAction('OPEN_CONSULTATION_DETAIL', { requestId: data.activeAppointment.requestId })}
          >
            <AppIcon name="calendar-days" size={16} color="#166534" />
            <Text style={styles.activeAppointmentText}>
              {ACTIVE_APPOINTMENT_LABEL[data.activeAppointment.status] || 'You have an active appointment with this doctor'}
            </Text>
            <AppIcon name="chevron-right" size={16} color="#166534" />
          </TouchableOpacity>
        )}
        <View style={styles.bottomBarButtonRow}>
          <TouchableOpacity
            style={[styles.bookButton, (isActionDisabled || isNotAccepting) && styles.disabledButton, { flex: 1 }]}
            onPress={() => {
              if (isActionDisabled || isNotAccepting) return;
              setShowRequestModal(true);
            }}
            disabled={!!(isActionDisabled || isNotAccepting)}
          >
            <Text style={styles.bookButtonText}>
              {isActionDisabled
                ? (preview ? 'Preview Mode' : 'Your Profile')
                : isNotAccepting
                  ? 'Not Available'
                  : 'Request Appointment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Request Modal */}
      {data && (
        <RequestAppointmentModal
          visible={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          doctorName={formatDoctorName(data.name) || 'Doctor'}
          consultationFees={data.consultationFees || {}}
          weeklyAvailability={data.weeklyAvailability}
          urgentSurchargePercent={data.urgentSurchargePercent}
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
    paddingBottom: 60,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  heroContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  overlayIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  profileSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  specialtyLabel: {
    fontSize: 13,
    color: '#D8CCFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    backgroundColor: '#2FA561',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 2,
  },
  ratingPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  locationText: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  infoCardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEEAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#8e8e93',
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
  activeAppointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: '100%',
  },
  activeAppointmentText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 32,
    borderTopColor: '#E5E5EA',
  },
  bottomBarButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: '#2FA561', borderRadius: 24, paddingVertical: 16, alignItems: 'center',
  },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledButton: { backgroundColor: '#A0C4F2' },
});