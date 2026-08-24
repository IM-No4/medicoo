import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Trash2, Droplets, Footprints, Moon, Activity, Target, Plus, Salad, Brain, Heart, Users, RefreshCw } from 'lucide-react-native';
import { AppDispatch, RootState } from '../../redux/store';
import { deleteGoal, toggleGoalEnabled, toggleGoalShared } from '../../redux/slices/goalsSlice';
import { loadOnDeviceSteps } from '../../redux/slices/deviceSlice';
import AddGoalModal from '../../components/modals/AddGoalModal/AddGoalModal';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { StatusBar } from 'expo-status-bar';
import {
  enableStepsTracking,
  isHealthConnectSupported,
  isStepsTrackingEnabled,
  openHealthConnectInPlayStore,
} from '../../services/health/healthConnectStepsService';

export default function ManageGoalsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const { goals } = useSelector((state: RootState) => state.goals);
  const [addGoalVisible, setAddGoalVisible] = useState(false);
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({ visible: false, type: 'idle', title: '', message: '' });

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  };
  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  // Whether the app's own Health Connect read-tracking opt-in flag is set -
  // this can go stale if the user granted permission from inside the Health
  // Connect app itself (or after dismissing the one-time enable prompt
  // shown right after creating the steps goal) instead of through Medicoo,
  // in which case steps/calories stay stuck with no obvious way to fix it.
  // This is a top-level sync (not scoped to any one goal card) since it
  // covers every Health Connect-sourced datapoint - steps, calories, and
  // whatever else gets added later - not just the steps goal.
  const [healthDataSynced, setHealthDataSynced] = useState(false);
  useEffect(() => {
    isStepsTrackingEnabled().then(setHealthDataSynced);
  }, []);

  const handleSyncHealthData = async () => {
    const result = await enableStepsTracking();
    if (result.success) {
      setHealthDataSynced(true);
      dispatch(loadOnDeviceSteps());
      showStatus('success', 'Health Data Synced', 'Your step count and calorie estimate have been refreshed from Health Connect and will keep updating automatically.');
      return;
    }

    if (result.reason === 'not_installed' || result.reason === 'update_required') {
      showStatus(
        'warning',
        result.reason === 'not_installed' ? 'Health Connect Required' : 'Health Connect Update Required',
        result.reason === 'not_installed'
          ? 'Automatic step tracking needs the Health Connect app, which isn\'t installed on this device yet.'
          : 'Your Health Connect app needs an update before Medicoo can read step data from it.',
        openHealthConnectInPlayStore,
        'Get Health Connect'
      );
      return;
    }

    showStatus('error', 'Could Not Enable Tracking', 'Permission wasn\'t granted in Health Connect. Open Health Connect\'s app settings and allow Medicoo to read Steps, then try again here.');
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'hydration': return Droplets;
      case 'steps': return Footprints;
      case 'sleep': return Moon;
      case 'activity': return Activity;
      case 'nutrition': return Salad;
      case 'meditation': return Brain;
      case 'heartrate': return Heart;
      default: return Target;
    }
  };

  const handleToggle = (id: string) => {
    dispatch(toggleGoalEnabled(id));
  };

  const handleToggleShared = (id: string) => {
    dispatch(toggleGoalShared(id));
  };

  const handleDelete = (id: string, name: string) => {
    showStatus(
      'warning',
      'Delete Goal',
      `Are you sure you want to delete your ${name} goal? This action cannot be undone.`,
      () => { hideStatus(); dispatch(deleteGoal(id)); },
      'Delete'
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />
      
      {/* Header - bare icon buttons (no circle background), matching the
          back/action button convention used across the rest of the app
          (e.g. FamilyMembersScreen, LabTestsHistoryScreen, ManageMedications) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Goals</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setAddGoalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={22} color="#0FBBA1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.friendsCard}
          onPress={() => navigation.navigate('Friends' as never)}
          activeOpacity={0.8}
        >
          <View style={styles.friendsIconBox}>
            <Users size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.friendsCardTitle}>Compare with Friends</Text>
            <Text style={styles.friendsCardSubtitle}>Share goals and see how you stack up</Text>
          </View>
          <ChevronLeft size={18} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          {/* Not scoped to any one goal card - covers every Health
              Connect-sourced datapoint (steps, calories, and whatever
              else gets added later) in one sync. */}
          {isHealthConnectSupported && (
            <TouchableOpacity onPress={handleSyncHealthData} style={styles.syncLink} activeOpacity={0.7}>
              <RefreshCw size={13} color={healthDataSynced ? '#0FBBA1' : '#94A3B8'} />
              <Text style={[styles.syncLinkText, healthDataSynced && styles.syncLinkTextActive]}>Sync</Text>
            </TouchableOpacity>
          )}
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Target size={36} color="#0FBBA1" />
            </View>
            <Text style={styles.emptyTitle}>No Goals Configured</Text>
            <Text style={styles.emptySubtitleText}>
              Set daily goals for step counts, hydration targets, or sleep to start tracking progress.
            </Text>
            <TouchableOpacity 
              style={styles.emptyBtn} 
              onPress={() => setAddGoalVisible(true)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyBtnText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map((goal) => {
              const Icon = getGoalIcon(goal.type);
              return (
                <View key={goal.id} style={[styles.goalCard, !goal.enabled && styles.disabledGoalCard]}>
                  <View style={styles.goalTopRow}>
                    <View style={[styles.goalIconWrapper, { backgroundColor: goal.enabled ? goal.color + '18' : '#F1F5F9' }]}>
                      <Icon size={24} color={goal.enabled ? goal.color : '#94A3B8'} />
                    </View>

                    <View style={styles.goalMeta}>
                      <Text style={[styles.goalTitle, !goal.enabled && styles.disabledText]} numberOfLines={1}>
                        {goal.title}
                      </Text>
                      <Text style={styles.goalTargetText}>
                        Target{' '}
                        <Text style={[styles.goalTargetValue, !goal.enabled && styles.disabledText]}>
                          {goal.target} {goal.unit}
                        </Text>
                        {goal.frequency ? ` · ${goal.frequency}` : ''}
                      </Text>
                    </View>

                    <Switch
                      value={goal.enabled}
                      onValueChange={() => handleToggle(goal.id)}
                      trackColor={{ false: '#E2E8F0', true: goal.color + '55' }}
                      thumbColor={goal.enabled ? goal.color : '#FFFFFF'}
                      ios_backgroundColor="#E2E8F0"
                    />
                  </View>

                  <View style={styles.actionsToolbar}>
                    <TouchableOpacity style={styles.actionCol} onPress={() => handleToggleShared(goal.id)} activeOpacity={0.7}>
                      <Users size={17} color={goal.sharedWithFriends ? '#0FBBA1' : '#94A3B8'} />
                      <Text style={[styles.actionColText, goal.sharedWithFriends && styles.actionColTextActive]}>
                        Share
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity style={styles.actionCol} onPress={() => handleDelete(goal.id, goal.title)} activeOpacity={0.7}>
                      <Trash2 size={17} color="#EF4444" />
                      <Text style={[styles.actionColText, styles.actionColTextDanger]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AddGoalModal
        visible={addGoalVisible}
        onClose={() => setAddGoalVisible(false)}
      />

      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  addHeaderBtn: {
    padding: 8,
    marginRight: -8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  friendsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0FBBA1',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#007C69',
  },
  friendsIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  friendsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  friendsCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  syncLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  syncLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  syncLinkTextActive: {
    color: '#0FBBA1',
  },
  list: {
    gap: 14,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledGoalCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  goalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  goalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalMeta: {
    flex: 1,
    gap: 4,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  disabledText: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  goalTargetText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  goalTargetValue: {
    color: '#334155',
    fontWeight: '800',
  },
  actionsToolbar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFBFC',
  },
  actionCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  actionColText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  actionColTextActive: {
    color: '#0FBBA1',
  },
  actionColTextDanger: {
    color: '#EF4444',
  },
  /* Empty state */
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitleText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0FBBA1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007C69',
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
