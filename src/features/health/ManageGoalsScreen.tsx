import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Trash2, Droplets, Footprints, Moon, Activity, Target, Plus, Salad, Brain, Heart, Users, WifiOff } from 'lucide-react-native';
import { AppDispatch, RootState } from '../../redux/store';
import { deleteGoal, setGoalSharing, toggleGoalEnabled } from '../../redux/slices/goalsSlice';
import type { ShareMode } from '../../services/api/goals.api';
import ShareGoalSheet from './components/ShareGoalSheet';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { StatusBar } from '../../components/ThemedStatusBar';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

export default function ManageGoalsScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const { goals } = useSelector((state: RootState) => state.goals);
  // Friends/leaderboard is a live, backend-driven feature (see
  // FriendsScreen.tsx) with no offline cache of its own - unlike the goals
  // list itself, there's nothing useful to show it offline, so the card is
  // dimmed and redirected to a short explainer instead of pushing a screen
  // that would just fail to load anything.
  const isOnline = useSelector((state: RootState) => state.connectivity.isOnline);
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

  const handleCompareWithFriends = () => {
    if (!isOnline) {
      showStatus(
        'warning',
        t('you_re_offline'),
        t('comparing_progress_with_friends_needs')
      );
      return;
    }
    navigation.navigate('Friends' as never);
  };

  // Sharing: choose everyone, some friends, or nobody
  const [sharingGoalId, setSharingGoalId] = useState<string | null>(null);
  const [savingShare, setSavingShare] = useState(false);
  const sharingGoal = goals.find((g) => g.id === sharingGoalId) || null;

  const handleOpenShare = (id: string) => {
    // Sharing needs the backend to actually be reachable, so check up front rather than letting the request fail.
    if (!isOnline) {
      showStatus('warning', t('you_re_offline'), t('sharing_a_goal_with_friends_needs_an_i'));
      return;
    }
    setSharingGoalId(id);
  };

  const handleSaveShare = async (mode: ShareMode, friendIds: string[]) => {
    if (!sharingGoalId) return;
    setSavingShare(true);
    try {
      await dispatch(setGoalSharing({ id: sharingGoalId, mode, friendIds })).unwrap();
      setSharingGoalId(null);
    } catch {
      showStatus('error', t('could_not_update'), t('something_went_wrong_while_updating_th'));
    } finally {
      setSavingShare(false);
    }
  };

  const shareLabel = (goal: { sharedWithFriends: boolean; sharedWith: string[] }) =>
    goal.sharedWithFriends ? 'Shared with all' : goal.sharedWith.length > 0 ? `Shared with ${goal.sharedWith.length}` : t('share');

  const handleDelete = (id: string, name: string) => {
    showStatus(
      'warning',
      t('delete_goal'),
      `Are you sure you want to delete your ${name} goal? This action cannot be undone.`,
      () => { hideStatus(); dispatch(deleteGoal(id)); },
      'Delete'
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      {/* Header - same recipe as the rest of the Profile/Health screens:
          white bar + shadow, plain icon back button, fontSize 20/600. */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('manage_goals')}</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => navigation.navigate('AddGoal' as never)}
          activeOpacity={0.7}
        >
          <Plus size={22} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.friendsCard}
          onPress={handleCompareWithFriends}
          activeOpacity={0.8}
        >
          <View style={styles.friendsIconBox}>
            {isOnline ? <Users size={22} color="#FFFFFF" /> : <WifiOff size={22} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.friendsCardTitle}>{t('compare_friends')}</Text>
            <Text style={styles.friendsCardSubtitle}>
              {isOnline ? 'Share goals and see how you stack up' : 'Needs an internet connection'}
            </Text>
          </View>
          <ChevronLeft size={18} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Target size={36} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>{t('no_goals_configured')}</Text>
            <Text style={styles.emptySubtitleText}>
              {t('set_daily_goals_for_step_counts_hydrat')}
            </Text>
            <TouchableOpacity 
              style={styles.emptyBtn} 
              onPress={() => navigation.navigate('AddGoal' as never)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyBtnText}>{t('create_first_goal')}</Text>
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
                      <Icon size={24} color={goal.enabled ? goal.color : theme.textMuted} />
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
                    <TouchableOpacity style={styles.actionCol} onPress={() => handleOpenShare(goal.id)} activeOpacity={0.7}>
                      <Users size={17} color={goal.sharedWithFriends || goal.sharedWith.length > 0 ? '#10B981' : '#94A3B8'} />
                      <Text style={[styles.actionColText, (goal.sharedWithFriends || goal.sharedWith.length > 0) && styles.actionColTextActive]}>
                        {shareLabel(goal)}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity style={styles.actionCol} onPress={() => handleDelete(goal.id, goal.title)} activeOpacity={0.7}>
                      <Trash2 size={17} color="#EF4444" />
                      <Text style={[styles.actionColText, styles.actionColTextDanger]}>{t('delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ShareGoalSheet
        visible={!!sharingGoal}
        goalTitle={sharingGoal?.title || ''}
        initialMode={sharingGoal?.sharedWithFriends ? 'all' : (sharingGoal?.sharedWith.length ?? 0) > 0 ? 'selected' : 'none'}
        initialFriendIds={sharingGoal?.sharedWith ?? []}
        busy={savingShare}
        onSave={handleSaveShare}
        onClose={() => setSharingGoalId(null)}
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background, // Slate background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  addHeaderBtn: {
    padding: 8,
    marginRight: -8,
    backgroundColor: c.successBg,
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
    backgroundColor: '#10B981',
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
    color: c.textMuted,
  },
  syncLinkTextActive: {
    color: '#10B981',
  },
  list: {
    gap: 14,
  },
  goalCard: {
    backgroundColor: c.card,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
  },
  disabledGoalCard: {
    backgroundColor: c.cardSecondary,
    borderColor: c.border,
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
    color: c.text,
  },
  disabledText: {
    color: c.textMuted,
    textDecorationLine: 'line-through',
  },
  goalTargetText: {
    fontSize: 12,
    color: c.textMuted,
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
    borderTopColor: c.borderLight,
    backgroundColor: c.cardSecondary,
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
    backgroundColor: c.cardSecondary,
  },
  actionColText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textMuted,
  },
  actionColTextActive: {
    color: '#10B981',
  },
  actionColTextDanger: {
    color: '#EF4444',
  },
  /* Empty state */
  emptyContainer: {
    backgroundColor: c.card,
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: c.border,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginBottom: 6,
  },
  emptySubtitleText: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
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
