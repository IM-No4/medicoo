import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import AuthImage from '../../../components/AuthImage';
import { formatDoctorName } from '../../../utils/formatters';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

const ACTIVE_APPOINTMENT_LABEL: Record<string, string> = {
  pending: 'Request Pending',
  approved: 'Upcoming Appointment',
};

interface Props {
  doctor: any;
  onBook: () => void;
  onPress?: () => void;
  isFavorite?: boolean;
  isFavoriteLoading?: boolean;
  onToggleFavorite?: () => void;
}

export default function DoctorCard({ doctor, onBook, onPress, isFavorite, isFavoriteLoading, onToggleFavorite }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isNotAccepting = doctor.isAcceptingAppointments === false;
  // A pending/approved request already exists with this doctor - no second booking.
  const hasActive = !!doctor.activeAppointment;
  const isAvailableToday = typeof doctor.nextSlot === 'string' && doctor.nextSlot.toLowerCase() === 'today';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      <View style={styles.mainRow}>
        <View style={styles.imageContainer}>
          {/* AuthImage resolves the stored path and, if the photo is missing or fails
              to load, falls back to the avatar below instead of an empty grey box. */}
          <AuthImage
            uri={doctor.image}
            style={styles.doctorImage}
            fallback={
              <View style={styles.avatarFallback}>
                <AppIcon name="stethoscope" size={34} color={theme.primary} />
              </View>
            }
          />
          {!isNotAccepting && (
            <View style={[styles.statusDot, isAvailableToday && styles.statusDotLive]} />
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{formatDoctorName(doctor.name)}</Text>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={onToggleFavorite}
                disabled={isFavoriteLoading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isFavoriteLoading ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <AppIcon name="heart" size={19} color={isFavorite ? "#FF3B30" : "#D1D5DB"} fill={isFavorite ? "#FF3B30" : "none"} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.specialtyRow}>
            <AppIcon name="stethoscope" size={12} color="#1C6ED5" />
            <Text style={styles.specialty} numberOfLines={1}>{doctor.specialty}</Text>
          </View>

          <View style={styles.metaRow}>
            {doctor.rating > 0 && (
              <View style={styles.ratingBadge}>
                <AppIcon name="star" size={11} color="#C47A16" />
                <Text style={styles.ratingText}>{doctor.rating}</Text>
              </View>
            )}
            <Text style={styles.experienceText}>{doctor.experience} exp.</Text>
          </View>

          <View style={styles.locationRow}>
            <AppIcon name="map-pin" size={12} color="#8e8e93" />
            <Text style={styles.locationText} numberOfLines={1}>{doctor.location}</Text>
          </View>
        </View>
      </View>

      {doctor.activeAppointment && (
        <TouchableOpacity
          style={styles.activeAppointmentBanner}
          onPress={() => executeAction('OPEN_CONSULTATION_DETAIL', { requestId: doctor.activeAppointment.requestId })}
        >
          <AppIcon name="calendar-days" size={13} color={theme.success} />
          <Text style={styles.activeAppointmentText}>
            {ACTIVE_APPOINTMENT_LABEL[doctor.activeAppointment.status] || 'Active Appointment'} - View
          </Text>
          <AppIcon name="chevron-right" size={13} color={theme.success} />
        </TouchableOpacity>
      )}

      <View style={styles.footerRow}>
        <View style={styles.slotInfo}>
          <View style={[styles.slotDot, isNotAccepting ? styles.slotDotOff : isAvailableToday ? styles.slotDotLive : styles.slotDotSoon]} />
          <View>
            <Text style={styles.slotLabel}>{t('next_availability')}</Text>
            <Text style={styles.slotTime}>{doctor.nextSlot}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.bookButton, !hasActive && isNotAccepting && styles.bookButtonDisabled]}
          onPress={hasActive
            ? () => executeAction('OPEN_CONSULTATION_DETAIL', { requestId: doctor.activeAppointment.requestId })
            : onBook}
          disabled={!hasActive && isNotAccepting}
        >
          <Text style={[styles.bookButtonText, !hasActive && isNotAccepting && styles.bookButtonTextDisabled]}>
            {hasActive ? 'View Request' : isNotAccepting ? 'Not Available' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    padding: 8,
    paddingBottom: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea81',
  },
  mainRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageContainer: {
    width: 94,
    height: 94,
    borderRadius: 18,
    backgroundColor: c.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    overflow: 'visible',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusDotLive: {
    backgroundColor: '#10B981',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginRight: 8,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specialty: {
    fontSize: 13,
    color: '#1C6ED5',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: c.text,
  },
  experienceText: {
    fontSize: 12.5,
    color: c.textSecondary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    color: c.textSecondary,
    flex: 1,
  },
  activeAppointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.successBg,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  activeAppointmentText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: c.success,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  slotDotLive: {
    backgroundColor: '#10B981',
  },
  slotDotSoon: {
    backgroundColor: '#F59E0B',
  },
  slotDotOff: {
    backgroundColor: '#D1D5DB',
  },
  slotLabel: {
    fontSize: 10.5,
    color: c.textSecondary,
    marginBottom: 1,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: c.text,
  },
  bookButton: {
    backgroundColor: '#1C6ED5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bookButtonDisabled: {
    backgroundColor: c.cardSecondary,
  },
  bookButtonTextDisabled: {
    color: c.textSecondary,
  },
});
