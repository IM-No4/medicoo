import { useFocusEffect, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Video,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import {
  getDoctorAppointmentRequests,
  respondToAppointmentRequest,
} from '../../../../services/api/doctor.api';

type TabKey = 'requests' | 'upcoming' | 'history';

type AppointmentRequestItem = {
  requestId: string;
  preferredDate?: string;
  preferredTime?: string;
  urgencyLevel?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'no_show';
  expiryReason?: 'doctor_no_response' | 'patient_no_payment';
  noShowReason?: 'doctor_no_show' | 'patient_no_show' | 'mutual_no_show';
  patientDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  doctorResponse?: {
    remarks?: string;
    respondedAt?: string;
  };
  consultationType?: 'chat' | 'voice' | 'video';
  consultationFee?: number;
  isUrgentSurcharge?: boolean;
  paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  createdOn?: string;
  updatedOn?: string;
  actionMeta?: {
    patientName?: string;
  };
  // A pending reschedule request never changes the appointment's own
  // status (it stays 'no_show') - this is the only signal that this item
  // needs the doctor's attention rather than being settled history.
  rescheduleRequest?: {
    status: 'pending' | 'accepted' | 'rejected';
    proposedDate?: string;
    proposedTime?: string;
  } | null;
};

const isAwaitingReschedule = (item: AppointmentRequestItem) => item.rescheduleRequest?.status === 'pending';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history', label: 'History' },
];

const STATUS_LABELS: Record<AppointmentRequestItem['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
  expired: 'Expired',
  no_show: 'Missed',
};

const CONSULTATION_TYPE_META: Record<'chat' | 'voice' | 'video', { label: string; color: string; bg: string; Icon: typeof MessageCircle }> = {
  chat: { label: 'Chat', color: '#1C6ED5', bg: '#EAF4FF', Icon: MessageCircle },
  voice: { label: 'Voice', color: '#007C69', bg: '#EAFBF3', Icon: Phone },
  video: { label: 'Video', color: '#C47A16', bg: '#FFF6EA', Icon: Video },
};

const formatDate = (value?: string) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value?: string) => value || 'Time not set';

const getUrgencyTone = (urgency?: string) => {
  switch (urgency) {
    case 'urgent':
      return { color: '#DC2626', bg: '#FEE2E2' };
    case 'high':
      return { color: '#D97706', bg: '#FEF3C7' };
    case 'medium':
      return { color: '#2563EB', bg: '#DBEAFE' };
    default:
      return { color: '#0FBBA1', bg: '#DCFCE7' };
  }
};

const getStatusTone = (status: AppointmentRequestItem['status']) => {
  switch (status) {
    case 'pending':
      return { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' };
    case 'approved':
      return { bg: '#DCFCE7', fg: '#166534', dot: '#0FBBA1' };
    case 'rejected':
      return { bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' };
    case 'cancelled':
      return { bg: '#E5E7EB', fg: '#374151', dot: '#9CA3AF' };
    case 'completed':
      return { bg: '#E0E7FF', fg: '#3730A3', dot: '#6366F1' };
    case 'expired':
      return { bg: '#F3F4F6', fg: '#6B7280', dot: '#9CA3AF' };
    case 'no_show':
      return { bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' };
    default:
      return { bg: '#E5E7EB', fg: '#374151', dot: '#9CA3AF' };
  }
};

export default function AppointmentRequestsScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const initialTab = (route.params?.initialTab as TabKey) || 'requests';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [requests, setRequests] = useState<AppointmentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
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
    message: '',
  });

  const showStatus = useCallback((
    type: StatusType,
    title: string,
    message: string,
    primaryAction?: () => void,
    primaryActionText?: string,
  ) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  }, []);

  const hideStatus = useCallback(() => {
    setStatus((prev) => ({ ...prev, visible: false }));
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const response = await getDoctorAppointmentRequests({ status: 'all', limit: 200 });
      setRequests(response?.data?.requests || []);
    } catch {
      setRequests([]);
      showStatus('error', 'Unable to load requests', 'We could not fetch appointment requests right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showStatus]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadRequests();
    }, [loadRequests])
  );

  const counts = useMemo(() => {
    return requests.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === 'pending' || isAwaitingReschedule(item)) {
          // A no_show appointment with a pending reschedule request still
          // needs the doctor's response, same as a brand new request - it
          // belongs in the "Requests" bucket, not buried in history under
          // its stale 'no_show' status.
          acc.pending += 1;
        } else {
          acc[item.status] += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0, expired: 0, no_show: 0 },
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const base = requests.filter((item) => {
      const awaitingReschedule = isAwaitingReschedule(item);
      const matchesTab = activeTab === 'requests'
        ? (item.status === 'pending' || awaitingReschedule)
        : activeTab === 'upcoming'
          ? item.status === 'approved'
          : (['rejected', 'cancelled', 'completed', 'expired', 'no_show'].includes(item.status) && !awaitingReschedule);

      if (!matchesTab) return false;
      if (!query) return true;

      const patientName = item.patientDetails?.name || item.actionMeta?.patientName || '';
      return [
        patientName,
        item.requestId,
        item.reason,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });

    return base.sort((a, b) => String(b.createdOn || '').localeCompare(String(a.createdOn || '')));
  }, [activeTab, requests, searchText]);

  const openDetails = useCallback((item: AppointmentRequestItem) => {
    executeAction('OPEN_PATIENT_CONSULTATION_DETAIL', { appointment: item });
  }, []);

  const handleRespond = useCallback((item: AppointmentRequestItem, nextStatus: 'approved' | 'rejected') => {
    showStatus(
      nextStatus === 'approved' ? 'info' : 'warning',
      nextStatus === 'approved' ? 'Approve request?' : 'Reject request?',
      nextStatus === 'approved'
        ? `Approve ${item.patientDetails?.name || item.actionMeta?.patientName || 'this patient'} for ${formatDate(item.preferredDate)} at ${formatTime(item.preferredTime)}?`
        : `Reject ${item.patientDetails?.name || item.actionMeta?.patientName || 'this patient'}'s request?`,
      async () => {
        try {
          setBusyId(item.requestId);
          await respondToAppointmentRequest({
            requestId: item.requestId,
            status: nextStatus,
          });
          await loadRequests();
          showStatus(
            'success',
            nextStatus === 'approved' ? 'Request approved' : 'Request rejected',
            nextStatus === 'approved'
              ? 'The patient has been notified and the request moved to upcoming.'
              : 'The patient has been notified and the request moved to history.',
          );
        } catch {
          showStatus('error', 'Action failed', 'We could not update this request. Please try again.');
        } finally {
          setBusyId(null);
        }
      },
      nextStatus === 'approved' ? 'Approve' : 'Reject',
    );
  }, [loadRequests, showStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadRequests();
  }, [loadRequests]);

  const renderItem = ({ item }: { item: AppointmentRequestItem }) => {
    const awaitingReschedule = isAwaitingReschedule(item);
    // Override the generic 'no_show'/"Missed" badge - that status is stale
    // once a reschedule request is pending; the doctor needs to see this
    // as something to respond to, not a closed-out missed appointment.
    const tone = awaitingReschedule ? { bg: '#DBEAFE', fg: '#1D4ED8', dot: '#2563EB' } : getStatusTone(item.status);
    const statusLabel = awaitingReschedule ? 'Reschedule Requested' : STATUS_LABELS[item.status];
    const urgency = getUrgencyTone(item.urgencyLevel);
    const patientName = item.patientDetails?.name || item.actionMeta?.patientName || 'Patient';
    const isPending = item.status === 'pending';
    const typeMeta = CONSULTATION_TYPE_META[item.consultationType || 'video'];
    const TypeIcon = typeMeta.Icon;

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openDetails(item)}>
          <View style={styles.cardHeader}>
            <View style={styles.patientRow}>
              <View style={[styles.avatar, { borderColor: urgency.bg }]}>
                <Text style={styles.avatarText}>{patientName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName} numberOfLines={1}>{patientName}</Text>
                <Text style={styles.requestId}>#{item.requestId}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
              <Text style={[styles.statusBadgeText, { color: tone.fg }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: typeMeta.bg }]}>
              <TypeIcon size={13} color={typeMeta.color} />
              <Text style={[styles.chipText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
            </View>
            {typeof item.consultationFee === 'number' && (
              <View style={[styles.chip, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.chipText, { color: '#374151' }]}>₹{item.consultationFee}</Text>
              </View>
            )}
            {item.isUrgentSurcharge && (
              <View style={[styles.chip, { backgroundColor: '#FFFBEB' }]}>
                <AlertTriangle size={12} color="#B45309" />
                <Text style={[styles.chipText, { color: '#B45309' }]}>Urgent</Text>
              </View>
            )}
            <View style={[styles.chip, { backgroundColor: urgency.bg, marginLeft: 'auto' }]}>
              <Text style={[styles.chipText, { color: urgency.color }]}>
                {String(item.urgencyLevel || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatDate(item.preferredDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{formatTime(item.preferredTime)}</Text>
            </View>
          </View>

          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason || 'No reason provided'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          {awaitingReschedule ? (
            // Accepting/declining a reschedule needs the proposed date and
            // remarks field, which only exists on the detail screen - this
            // just gets them there instead of duplicating that UI here.
            <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => openDetails(item)}>
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.approveButtonText}>Respond to Reschedule</Text>
            </TouchableOpacity>
          ) : isPending ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRespond(item, 'rejected')}
                disabled={busyId === item.requestId}
              >
                {busyId === item.requestId ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <X size={16} color="#DC2626" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleRespond(item, 'approved')}
                disabled={busyId === item.requestId}
              >
                {busyId === item.requestId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => openDetails(item)}>
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const emptyState = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color="#0FBBA1" />
        </View>
      );
    }

    const activeLabel = TABS.find((t) => t.key === activeTab)?.label || '';

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Inbox size={30} color="#0FBBA1" />
        </View>
        <Text style={styles.emptyTitle}>No {activeLabel.toLowerCase()}</Text>
        <Text style={styles.emptyText}>
          {activeTab === 'requests'
            ? 'New appointment requests will show up here as soon as patients submit them.'
            : activeTab === 'upcoming'
              ? 'Approved requests will appear here as upcoming appointments.'
              : 'Completed, cancelled, and rejected requests will appear here.'}
        </Text>
      </View>
    );
  }, [activeTab, loading]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => executeAction('GO_BACK')}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Appointments</Text>
          <Text style={styles.headerSubtitle}>
            {counts.pending > 0 ? `${counts.pending} awaiting your response` : 'All caught up'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
          <RefreshCw size={18} color="#0FBBA1" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { marginTop: 16 }]}>
        <Search size={17} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, request ID, or reason"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tabRow}>
        {TABS.map(({ key, label }) => {
          const active = activeTab === key;
          const count = key === 'requests' ? counts.pending : key === 'upcoming' ? counts.approved : counts.rejected + counts.cancelled + counts.completed + counts.expired + counts.no_show;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={[styles.countPill, active && styles.countPillActive]}>
                  <Text style={[styles.countPillText, active && styles.countPillTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.requestId}
        renderItem={renderItem}
        contentContainerStyle={filteredRequests.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0FBBA1" />}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={false}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EEF0F3',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#F0F1F3',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  countPill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  countPillActive: {
    backgroundColor: '#0FBBA1',
  },
  countPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4B5563',
  },
  countPillTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  patientRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  patientName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
  },
  requestId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 14,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  reasonText: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  approveButton: {
    backgroundColor: '#0FBBA1',
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
});
