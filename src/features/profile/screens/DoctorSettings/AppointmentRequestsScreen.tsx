import { useFocusEffect, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Filter,
  Inbox,
  RefreshCw,
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  patientDetails?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  doctorResponse?: {
    remarks?: string;
    respondedAt?: string;
  };
  createdOn?: string;
  updatedOn?: string;
  actionMeta?: {
    patientName?: string;
  };
};

const TAB_LABELS: Record<TabKey, string> = {
  requests: 'Requests',
  upcoming: 'Upcoming',
  history: 'History',
};

const STATUS_LABELS: Record<AppointmentRequestItem['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const formatDate = (value?: string) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value?: string) => value || 'Time not set';

const getTypeIcon = (urgency?: string) => {
  switch (urgency) {
    case 'urgent':
      return { name: 'alert-triangle', color: '#DC2626', bg: '#FEE2E2' };
    case 'high':
      return { name: 'activity', color: '#D97706', bg: '#FEF3C7' };
    case 'medium':
      return { name: 'calendar', color: '#2563EB', bg: '#DBEAFE' };
    default:
      return { name: 'clock', color: '#2FA561', bg: '#DCFCE7' };
  }
};

const getStatusTone = (status: AppointmentRequestItem['status']) => {
  switch (status) {
    case 'pending':
      return { bg: '#FEF3C7', fg: '#92400E' };
    case 'approved':
      return { bg: '#DCFCE7', fg: '#166534' };
    case 'rejected':
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    case 'cancelled':
      return { bg: '#E5E7EB', fg: '#374151' };
    case 'completed':
      return { bg: '#E0E7FF', fg: '#3730A3' };
    default:
      return { bg: '#E5E7EB', fg: '#374151' };
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
        acc[item.status] += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 },
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const base = requests.filter((item) => {
      const matchesTab = activeTab === 'requests'
        ? item.status === 'pending'
        : activeTab === 'upcoming'
          ? item.status === 'approved'
          : ['rejected', 'cancelled', 'completed'].includes(item.status);

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
    executeAction('OPEN_PATIENT_CONSULTATION_DETAIL', {
      appointment: {
        id: item.requestId,
        patientName: item.patientDetails?.name || item.actionMeta?.patientName || 'Patient',
        date: formatDate(item.preferredDate),
        time: formatTime(item.preferredTime),
        type: 'video',
        status: STATUS_LABELS[item.status],
        image: null,
        reason: item.reason,
        requestId: item.requestId,
        urgencyLevel: item.urgencyLevel,
        doctorResponse: item.doctorResponse,
      },
    });
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

  const renderTab = (tab: TabKey) => {
    const active = activeTab === tab;
    const count = tab === 'requests' ? counts.pending : tab === 'upcoming' ? counts.approved : counts.rejected + counts.cancelled + counts.completed;

    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, active && styles.tabActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {TAB_LABELS[tab]}
        </Text>
        <View style={[styles.countPill, active && styles.countPillActive]}>
          <Text style={[styles.countPillText, active && styles.countPillTextActive]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: AppointmentRequestItem }) => {
    const tone = getStatusTone(item.status);
    const urgencyIcon = getTypeIcon(item.urgencyLevel);
    const patientName = item.patientDetails?.name || item.actionMeta?.patientName || 'Patient';
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openDetails(item)}>
          <View style={styles.cardHeader}>
            <View style={styles.patientRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{patientName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{patientName}</Text>
                <Text style={styles.requestId}>Request #{item.requestId}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
              <Text style={[styles.statusBadgeText, { color: tone.fg }]}>{STATUS_LABELS[item.status]}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={15} color="#6B7280" />
              <Text style={styles.metaText}>{formatDate(item.preferredDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={15} color="#6B7280" />
              <Text style={styles.metaText}>{formatTime(item.preferredTime)}</Text>
            </View>
            <View style={[styles.urgencyPill, { backgroundColor: urgencyIcon.bg }]}>
              <Text style={[styles.urgencyText, { color: urgencyIcon.color }]}>
                {String(item.urgencyLevel || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText} numberOfLines={3}>
            {item.reason || 'No reason provided'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          {isPending ? (
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
          <ActivityIndicator color="#2FA561" />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Inbox size={30} color="#2FA561" />
        </View>
        <Text style={styles.emptyTitle}>No {TAB_LABELS[activeTab].toLowerCase()}</Text>
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
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Appointments</Text>
          <Text style={styles.headerSubtitle}>{counts.pending} pending requests</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
          <RefreshCw size={20} color="#2FA561" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{counts.total}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>{counts.pending}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Approved</Text>
          <Text style={styles.summaryValue}>{counts.approved}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Filter size={16} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, request ID, or reason"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.tabRow}>
        {(['requests', 'upcoming', 'history'] as TabKey[]).map(renderTab)}
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.requestId}
        renderItem={renderItem}
        contentContainerStyle={filteredRequests.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2FA561" />}
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
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
    color: '#065F46',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#1F8E5A',
    borderColor: '#1F8E5A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#fff',
  },
  countPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  countPillActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
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
    backgroundColor: '#D1FAE5',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  requestId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  reasonLabel: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  reasonText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
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
    backgroundColor: '#2FA561',
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
