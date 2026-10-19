import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from '../../components/ThemedStatusBar';
import {
  AlertCircle,
  ArrowUpCircle,
  Bell,
  BookOpen,
  ChevronRight,
  Copy,
  Droplet,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Sun,
  Pill,
  Stethoscope,
  Users
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  InteractionManager,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../actions/ActionExecutor';
import { ActionKey } from '../../actions/action.types';
import { bootSuccess } from '../../bootstrap/boot.slice';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { RootState } from '../../redux/store';
import { logout as logoutRedux } from '../../redux/slices/authSlice';
import { clearActiveOrder } from '../../redux/slices/orderSlice';
import { getProfileDetails, logoutApi } from '../../services/api';
import { APP_VERSION } from '../../utils/appVersion';
import { API_BASE_URL } from '../../services/api/client';
import { unregisterDeviceToken } from '../../services/api/pushNotification.api';
import { clearToken } from '../../utils/tokenManagement';
import { getFCMToken } from '../../utils/deviceUtils';
import ProfileHeader from './components/ProfileHeader';
import ProfileSkeleton from './ProfileSkeleton';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeMode } from '../../theme/colors';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const enabledServices = useSelector((state: RootState) => state.appConfig.enabledServices);
  const update = useSelector((state: RootState) => state.appConfig.update);
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [medId, setMedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
    secondaryActionText?: string;
  }>({
    visible: false,
    type: 'idle',
    title: '',
    message: ''
  });

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string, secondaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText, secondaryActionText });
  };

  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getProfileDetails();
      // Handle base64 or URL image
      // Raw stored value (path / URL / data URI) - AuthImage resolves it and
      // adds the auth header the protected profile-pictures folder requires.
      setProfileImage(profile.profileImage || null);
      setName(profile.name);
      setMedId(profile.med_id);
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

  const handleLogout = () => {
    showStatus('warning', t('logout'), t('logout_confirm'), async () => {
      hideStatus();
      try {
        // 1. Call API
        await logoutApi();
        // Best-effort: stop this device from receiving push notifications
        // for the account that just logged out.
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await unregisterDeviceToken(fcmToken).catch(() => {});
        }
      } catch (error) {
        console.error('Logout failed:', error);
        // Fall through - still clear local state so the user isn't stuck logged in.
      } finally {
        // 2. Clear stored token
        await clearToken('access_token');
        // 3. Clear Active Order Tracking
        dispatch(clearActiveOrder());
        // 4. Clear Redux Auth State
        dispatch(logoutRedux());
        // 5. Update Boot State (Force RootNavigator switch)
        dispatch(bootSuccess({ isAuthenticated: false }));
      }
    }, t('logout'));
  };

  const handleCopyMedId = async () => {
    if (medId) {
      await Clipboard.setStringAsync(medId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Launch state: pharmacy is the only live service, so "Orders" sits as a
  // single Account-level link instead of a whole Activity & History
  // section for just one item. Mirrors the backend's own definition of
  // "pharmacy only" (appConfigController.js's deriveHomeLayoutMode) so this
  // never disagrees with what the Home feed is doing.
  const isOrdersOnlyMode = enabledServices.pharmacy
    && !enabledServices.consultations
    && !enabledServices.labTests
    && !enabledServices.homeCare
    && !enabledServices.hospitals
    && !enabledServices.bloodDonation
    && !enabledServices.ambulance;

  const accountItems: { icon: any; label: string; action: ActionKey }[] = [
    { icon: BookOpen, label: t('address_book'), action: 'OPEN_ADDRESS_BOOK' },
    { icon: Users, label: t('family_members'), action: 'OPEN_FAMILY_MEMBERS' },
    // Not tied to pharmacy/consultation/lab services, so unlike the items
    // below it, this stays visible in every mode including orders-only -
    // same reasoning as why Orders itself moves here in that mode.
    { icon: HeartPulse, label: t('health_assessments'), action: 'OPEN_HEALTH_ASSESSMENTS' },
    { icon: Bell, label: t('notification_settings'), action: 'OPEN_NOTIFICATION_SETTINGS' },
  ];
  if (isOrdersOnlyMode) {
    accountItems.push({ icon: Pill, label: t('orders'), action: 'OPEN_MY_MEDICINE_ORDERS' });
  }

  const activityItems: { icon: any; label: string; action: ActionKey }[] = isOrdersOnlyMode ? [] : [
    ...(enabledServices.consultations ? [{ icon: Stethoscope, label: t('consultations'), action: 'OPEN_CONSULTATIONS' as ActionKey }] : []),
    ...(enabledServices.pharmacy ? [{ icon: Pill, label: t('medicine_orders'), action: 'OPEN_MY_MEDICINE_ORDERS' as ActionKey }] : []),
    ...(enabledServices.labTests ? [{ icon: FlaskConical, label: t('lab_tests'), action: 'OPEN_MY_LAB_TESTS' as ActionKey }] : []),
    ...(enabledServices.bloodDonation ? [{ icon: Droplet, label: t('blood_donation'), action: 'OPEN_BLOOD_DONATION' as ActionKey }] : []),
  ];

  if (loading && !name) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent />
        <ProfileSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      <View style={{ paddingTop: insets.top + 16, paddingBottom: 8 }}>
        <ProfileHeader
          name={name}
          profileImage={profileImage}
          onEditPress={() => executeAction('OPEN_PROFILE_DETAILS')}
        />
      </View>

      {medId && (
      <View style={styles.medIdSection}>
          <Text style={[styles.medIdLabel, { color: theme.textMuted }]}>{t('member_id')}: </Text>
          <Text style={[styles.medIdValue, { color: theme.textSecondary }]}>{medId}</Text>
          <TouchableOpacity onPress={handleCopyMedId} style={styles.copyButton}>
            <Copy size={16} color="#10B981" />
          </TouchableOpacity>
          {copiedId && <Text style={styles.copiedText}>{t('copied')}</Text>}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Account Group */}
        <GroupLayout title={t('account')}>
          {accountItems.map((item, i) => (
            <MenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => executeAction(item.action)}
              last={i === accountItems.length - 1}
            />
          ))}
        </GroupLayout>

        {/* Activity & History Group - hidden entirely in single-service
            (pharmacy-only) mode, where Orders lives under Account instead. */}
        {activityItems.length > 0 && (
          <GroupLayout title={t('activity_history')}>
            {activityItems.map((item, i) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                label={item.label}
                onPress={() => executeAction(item.action)}
                last={i === activityItems.length - 1}
              />
            ))}
          </GroupLayout>
        )}

        {/* Appearance - one-line theme switcher: light / dark / system */}
        <GroupLayout title={t('appearance')}>
          <View style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.cardSecondary }]}>
                <Moon size={20} color={theme.textSecondary} />
              </View>
              <Text style={[styles.menuLabel, { color: theme.text }]}>{t('theme')}</Text>
            </View>
            <View style={styles.themeRow}>
              {([['light', Sun, 'theme_light'], ['dark', Moon, 'theme_dark'], ['system', Settings, 'theme_system']] as [ThemeMode, any, string][]).map(([mode, Icon, key]) => {
                const selected = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    activeOpacity={0.8}
                    onPress={() => setThemeMode(mode)}
                    accessibilityRole="button"
                    accessibilityLabel={t(key)}
                    accessibilityState={{ selected }}
                    style={[
                      styles.themeChip,
                      { backgroundColor: selected ? theme.primary : theme.cardSecondary, borderColor: selected ? theme.primary : theme.border },
                    ]}
                  >
                    <Icon size={18} color={selected ? '#FFFFFF' : theme.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GroupLayout>

        {/* Support Group */}
        <GroupLayout title={t('support')}>
          <MenuItem
            icon={HelpCircle}
            label={t('help_support')}
            onPress={() => executeAction('OPEN_HELP')}
          />
          <MenuItem
            icon={FileText}
            label={t('terms_of_service')}
            onPress={() => executeAction('OPEN_TERMS_OF_SERVICE')}
          />
          <MenuItem
            icon={Eye}
            label={t('privacy_policy')}
            onPress={() => executeAction('OPEN_PRIVACY_POLICY')}
          />
          <MenuItem
            icon={AlertCircle}
            label={t('medical_disclaimer')}
            onPress={() => executeAction('OPEN_MEDICAL_DISCLAIMER')}
          />
          <MenuItem
            icon={LogOut}
            label={t('logout')}
            onPress={handleLogout}
            isDestructive
            last
            style={{ marginTop: 8, paddingTop: 16 }}
          />
        </GroupLayout>

        {/* Always visible whenever a newer version exists, independent of
            whether the optional-update popup was dismissed - see
            UpdateAvailableModal for that separate, version-keyed prompt. */}
        {update?.updateAvailable && (
          <TouchableOpacity
            style={styles.updateCard}
            activeOpacity={0.8}
            onPress={() => {
              if (update.storeUrl) Linking.openURL(update.storeUrl).catch(() => {});
            }}
          >
            <ArrowUpCircle size={22} color="#10B981" />
            <View style={styles.updateCardTextWrap}>
              <Text style={styles.updateCardTitle}>{t('update_available')}</Text>
              <Text style={styles.updateCardSubtitle}>
                {t('update_available_msg')}{update.latestVersion ? ` (${update.latestVersion})` : ''}.
              </Text>
            </View>
            <ChevronRight size={18} color="#10B981" />
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>{t('version')} {APP_VERSION}</Text>
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
        secondaryActionText={status.secondaryActionText}
        autoCloseDelay={status.type === 'success' ? 2500 : undefined}
      />
    </View >
  );
}

// ------ Sub Components ------

function GroupLayout({ title, children }: { title: string, children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
        {children}
      </View>
    </View>
  );
}

function MenuItem({ icon: Icon, label, value, onPress, last, isDestructive, style }: any) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.borderLight }, last && styles.menuItemLast, style]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDestructive ? theme.errorBg : theme.cardSecondary }]}>
          <Icon size={20} color={isDestructive ? theme.error : theme.textSecondary} />
        </View>
        <Text style={[styles.menuLabel, { color: isDestructive ? theme.error : theme.text }]}>
          {label}
        </Text>
      </View>
      {value ? <Text style={[styles.menuValue, { color: theme.textMuted }]}>{value}</Text> : null}
      {!isDestructive && !value && <ChevronRight size={18} color={theme.textMuted} />}
    </TouchableOpacity>
  );
}

// ------ Styles ------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },

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
  copiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 4,
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
  redeemText: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 8 },

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

  menuValue: { fontSize: 13, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeChip: { width: 40, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  menuLabel: { fontSize: 15, fontWeight: '500', color: '#374151' },
  destructiveLabel: { color: '#EF4444' },

  footer: { alignItems: 'center', paddingBottom: 40 },
  versionText: { fontSize: 12, color: '#9CA3AF', opacity: 0.6 },

  updateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ECFDF9',
    borderWidth: 1,
    borderColor: '#CBF5EB',
  },
  updateCardTextWrap: { flex: 1 },
  updateCardTitle: { fontSize: 14, fontWeight: '700', color: '#0C8E78' },
  updateCardSubtitle: { fontSize: 12, color: '#4B9A8C', marginTop: 2 },
});
