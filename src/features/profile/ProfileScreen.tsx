import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import {
  AlertCircle,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FlaskConical,
  HelpCircle,
  LogOut,
  Pill,
  Stethoscope,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  XCircle
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { executeAction } from '../../actions/ActionExecutor';
import { bootSuccess } from '../../bootstrap/boot.slice';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { logout as logoutRedux } from '../../redux/slices/authSlice';
import { getProfileDetails, logoutApi } from '../../services/api';
import { API_BASE_URL } from '../../services/api/client';
import ProfileHeader from './components/ProfileHeader';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [medId, setMedId] = useState<string | null>(null);
  const [performance, setPerformance] = useState({ rating: 0, reviewCount: 0 });
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [canReapply, setCanReapply] = useState(false);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    type: 'idle',
    title: '',
    message: ''
  });

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  };

  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getProfileDetails();
      // Handle base64 or URL image
      let profileImageUri = null;
      if (profile.profileImage) {
        if (profile.profileImage.startsWith('http') || profile.profileImage.startsWith('data:')) {
          profileImageUri = profile.profileImage;
        } else {
          // It's a relative path from the server
          profileImageUri = `${API_BASE_URL}/${profile.profileImage}`;
        }
      }

      setProfileImage(profileImageUri);
      setName(profile.name);
      setMedId(profile.med_id);
      setIsDoctor(profile?.isDoctor || false);
      setApprovalStatus(profile?.approvalStatus || null);
      setRejectionReason(profile?.rejectionReason || null);
      setCanReapply(profile?.canReapply || false);

      if (profile?.isDoctor) {
        setEarnings(profile.earnings || 0);
        setPerformance({
          rating: profile.rating || 0,
          reviewCount: profile.reviewsCount || 0
        });
        setPendingRequestCount(2); // Mock: TODO replace with API count
      }
    } catch (error) {
      // Error fetching profile details
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchProfile();
      });

      return () => task.cancel();
    }, [fetchProfile])
  );

  const handleLogout = async () => {
    showStatus(
      'warning',
      'Logout?',
      'Are you sure you want to log out of your account? You will need to sign in again to access your records.',
      async () => {
        try {
          hideStatus();
          // 1. Call API
          await logoutApi();
          // 2. Clear Redux Auth State
          dispatch(logoutRedux());
          // 3. Update Boot State (Force RootNavigator switch)
          dispatch(bootSuccess({ isAuthenticated: false }));
        } catch (error) {
          console.error('Logout failed:', error);
          // Fallback: force logout anyway
          dispatch(logoutRedux());
          dispatch(bootSuccess({ isAuthenticated: false }));
        }
      },
      'Logout'
    );
  };

  const handleCopyMedId = async () => {
    if (medId) {
      await Clipboard.setStringAsync(medId);
      showStatus('success', 'Copied!', 'Member ID has been copied to your clipboard.');
    }
  };

  const renderDoctorStatus = () => {
    if (!isDoctor) return null;

    switch (approvalStatus) {
      case 'pending':
        return (
          <View style={[styles.statusCard, styles.pendingCard]}>
            <View style={styles.statusHeaderRow}>
              <Clock size={20} color="#FFA000" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Profile Under Review</Text>
                <Text style={styles.statusDescription}>We'll notify you once approved.</Text>
              </View>
            </View>
          </View>
        );
      case 'suspended':
        return (
          <View style={[styles.statusCard, styles.suspendedCard]}>
            <View style={styles.statusHeaderRow}>
              <AlertCircle size={20} color="#E53935" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Account Suspended</Text>
                <Text style={styles.statusDescription}>Please contact support.</Text>
              </View>
            </View>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusCard, styles.rejectedCard]}>
            <View style={styles.statusHeaderRow}>
              <XCircle size={20} color="#E53935" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Application Rejected</Text>
                <Text style={styles.statusDescription}>
                  {rejectionReason || 'Contact support for info.'}
                </Text>
              </View>
            </View>

            {canReapply && (
              <TouchableOpacity
                style={styles.reapplyButton}
                onPress={() => executeAction('OPEN_DOCTOR_ONBOARDING')}
              >
                <Text style={styles.reapplyButtonText}>Update & Re-apply</Text>
                <ChevronRight size={16} color="#B91C1C" />
              </TouchableOpacity>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (loading && !name) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2FA561" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="#F8F9FE" />

      <View style={{ paddingTop: insets.top + 16, paddingBottom: 8 }}>
        <ProfileHeader
          name={name}
          profileImage={profileImage}
          onEditPress={() => executeAction('OPEN_PROFILE_DETAILS')}
        />
      </View>

      {medId && (
        <View style={styles.medIdSection}>
          <Text style={styles.medIdLabel}>Member ID: </Text>
          <Text style={styles.medIdValue}>{medId}</Text>
          <TouchableOpacity onPress={handleCopyMedId} style={styles.copyButton}>
            <Copy size={16} color="#2FA561" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >


        {/* Doctor Status Messages */}
        <View style={styles.sectionContainer}>
          {renderDoctorStatus()}
        </View>

        {/* Doctor Dashboard (Only if Approved) */}
        {isDoctor && approvalStatus === 'approved' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Doctor Dashboard</Text>
            <View style={styles.doctorStatsRow}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => executeAction('OPEN_DOCTOR_REVIEWS')}
                activeOpacity={0.7}
              >
                <View style={styles.statHeader}>
                  <TrendingUp size={16} color="#4B5563" />
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <Text style={styles.statValue}>{performance.rating.toFixed(1)}</Text>
                <Text style={styles.statSub}>{performance.reviewCount} reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => executeAction('OPEN_DOCTOR_EARNINGS')}
                activeOpacity={0.7}
              >
                <View style={styles.statHeader}>
                  <Wallet size={16} color="#4B5563" />
                  <Text style={styles.statLabel}>Earnings</Text>
                </View>
                <Text style={styles.statValue}>₹{earnings.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => executeAction('OPEN_REDEEM')}>
                  <Text style={styles.redeemText}>Redeem</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Pending Requests Alert */}
            {pendingRequestCount > 0 && (
              <TouchableOpacity
                style={styles.pendingRequestCard}
                onPress={() => executeAction('OPEN_DOCTOR_PENDING_REQUESTS')}
              >
                <View style={styles.pendingIconBox}>
                  <AlertCircle size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>{pendingRequestCount} Pending Appointment Request{pendingRequestCount > 1 ? 's' : ''}</Text>
                  <Text style={styles.pendingDesc}>Review and accept new patient requests.</Text>
                </View>
                <ChevronRight size={20} color="#B45309" />
              </TouchableOpacity>
            )}

            <View style={styles.doctorMenu}>
              <MenuItem
                icon={UserCog}
                label="Doctor Profile Settings"
                onPress={() => executeAction('OPEN_DOCTOR_SETTINGS')}
              />
              <MenuItem
                icon={CalendarCheck}
                label="Manage Appointments"
                onPress={() => executeAction('OPEN_MANAGE_APPOINTMENTS')}
                last
              />
            </View>
          </View>
        )}

        {/* Account Group */}
        <GroupLayout title="Account">
          <MenuItem
            icon={BookOpen}
            label="Address Book"
            onPress={() => executeAction('OPEN_ADDRESS_BOOK')}
          />
          <MenuItem
            icon={Users}
            label="Family Members"
            onPress={() => executeAction('OPEN_FAMILY_MEMBERS')}
            last={!isDoctor && (!approvalStatus || approvalStatus === 'not-applied')}
          />
          {!isDoctor && (!approvalStatus || approvalStatus === 'not-applied') && (
            <MenuItem
              icon={Stethoscope}
              label="Apply as Doctor"
              onPress={() => executeAction('OPEN_DOCTOR_ONBOARDING')}
              last
            />
          )}
        </GroupLayout>

        {/* Activity & History Group */}
        <GroupLayout title="Activity & History">
          <MenuItem
            icon={Stethoscope}
            label="Consultations"
            onPress={() => executeAction('OPEN_CONSULTATIONS')}
          />
          <MenuItem
            icon={Pill}
            label="Medicine Orders"
            onPress={() => executeAction('OPEN_MY_MEDICINE_ORDERS')}
          />
          <MenuItem
            icon={FlaskConical}
            label="Lab Tests"
            onPress={() => executeAction('OPEN_MY_LAB_TESTS')}
            last
          />
        </GroupLayout>

        {/* Support Group */}
        <GroupLayout title="Support">
          <MenuItem
            icon={HelpCircle}
            label="Help & Support"
            onPress={() => executeAction('OPEN_HELP')}
          />
          <MenuItem
            icon={FileText}
            label="Terms & Privacy"
            onPress={() => executeAction('OPEN_TERMS')} // Assuming route
          />
          <MenuItem
            icon={LogOut}
            label="Logout"
            onPress={handleLogout}
            isDestructive
            last
            style={{ marginTop: 8, paddingTop: 16 }}
          />
        </GroupLayout>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Status Modal */}
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
        autoCloseDelay={status.type === 'success' ? 2500 : undefined}
      />
    </View >
  );
}

// ------ Sub Components ------

function GroupLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>
        {children}
      </View>
    </View>
  );
}

function MenuItem({ icon: Icon, label, onPress, last, isDestructive, style }: any) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast, style]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, isDestructive ? styles.destructiveIconBox : styles.normalIconBox]}>
          <Icon size={20} color={isDestructive ? '#EF4444' : '#4B5563'} />
        </View>
        <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
      </View>
      {!isDestructive && <ChevronRight size={18} color="#D1D5DB" />}
    </TouchableOpacity>
  );
}

// ------ Styles ------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  center: { justifyContent: 'center', alignItems: 'center' },

  content: { paddingBottom: 100 },

  // Member ID Section
  medIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  medIdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  medIdValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
    marginRight: 6,
  },
  copyButton: {
    padding: 4,
    backgroundColor: 'transparent',
    borderRadius: 6,
  },

  // Sections
  sectionContainer: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Doctor Status
  statusCard: { padding: 16, borderRadius: 16, marginTop: 16 },
  statusHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingCard: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  suspendedCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  rejectedCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  statusDescription: { fontSize: 13, color: '#4B5563', marginTop: 2, lineHeight: 18 },

  reapplyButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingTop: 12,
  },
  reapplyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B91C1C'
  },

  // Doctor Dashboard
  doctorStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  redeemText: { fontSize: 12, color: '#2FA561', fontWeight: '600', marginTop: 8 },

  // Pending Requests
  pendingRequestCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24
  },
  pendingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  pendingDesc: { fontSize: 12, color: '#B45309', marginTop: 2 },

  doctorMenu: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },

  // Groups
  group: { marginBottom: 24, paddingHorizontal: 20 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
  groupCard: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 4 },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  normalIconBox: { backgroundColor: '#F3F4F6' },
  destructiveIconBox: { backgroundColor: '#FEF2F2' },

  menuLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  destructiveLabel: { color: '#EF4444' },

  footer: { alignItems: 'center', paddingBottom: 40 },
  versionText: { fontSize: 12, color: '#9CA3AF', opacity: 0.6 }
});
