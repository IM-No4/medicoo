import React, { useState } from 'react';
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
import { ArrowLeft, Trash2, Droplets, Footprints, Moon, Activity, Target, Plus, Salad, Brain, Heart } from 'lucide-react-native';
import { RootState } from '../../redux/store';
import { deleteGoal, toggleGoalEnabled } from '../../redux/slices/goalsSlice';
import AddGoalModal from '../../components/modals/AddGoalModal/AddGoalModal';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { StatusBar } from 'expo-status-bar';

export default function ManageGoalsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Goals</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setAddGoalVisible(true)}
          activeOpacity={0.7}
        >
          <Plus size={18} color="#2FA561" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubtitle}>ENABLE, DISABLE OR REMOVE INDIVIDUAL HABITS</Text>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Target size={36} color="#94A3B8" />
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
                  <View style={[styles.goalIconWrapper, { backgroundColor: goal.color + '15' }]}>
                    <Icon size={20} color={goal.enabled ? goal.color : '#94A3B8'} />
                  </View>
                  
                  <View style={styles.goalMeta}>
                    <Text style={[styles.goalTitle, !goal.enabled && styles.disabledText]}>
                      {goal.title}
                    </Text>
                    <Text style={styles.goalTarget}>
                      Target: {goal.target} {goal.unit}
                      {goal.frequency ? ` · ${goal.frequency}` : ''}
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    {/* Switch Toggle */}
                    <Switch
                      value={goal.enabled}
                      onValueChange={() => handleToggle(goal.id)}
                      trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
                      thumbColor={goal.enabled ? '#2FA561' : '#94A3B8'}
                      ios_backgroundColor="#CBD5E1"
                    />

                    {/* Delete Btn */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(goal.id, goal.title)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={18} color="#EF4444" />
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
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  addHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledGoalCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  goalIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalMeta: {
    flex: 1,
    gap: 2,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  disabledText: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  goalTarget: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  /* Empty state */
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    backgroundColor: '#2FA561',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#2FA561',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
