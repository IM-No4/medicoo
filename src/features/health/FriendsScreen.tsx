import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from '../../components/ThemedStatusBar';
import {
    Activity,
    Brain,
    ChevronLeft,
    Check,
    ChevronRight,
    Copy,
    Droplets,
    Footprints,
    Heart,
    Moon,
    Salad,
    Target,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { AppDispatch, RootState } from '../../redux/store';
import {
    acceptFriendRequest,
    loadFriendsData,
    rejectFriendRequest,
    removeFriend,
    sendFriendRequest,
} from '../../redux/slices/friendsSlice';
import { loadOnDeviceSteps, selectTodaySteps } from '../../redux/slices/deviceSlice';
import { updateGoalProgress } from '../../redux/slices/goalsSlice';
import { BadgeInfo, EarnedBadge, fetchBadges } from '../../services/api/goals.api';
import { BadgesStrip } from './components/BadgesStrip';
import { getProfileDetails } from '../../services/api/user.api';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

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

export default function FriendsScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();

    const { friends, incomingRequests, goalProgress, loading } = useSelector((s: RootState) => s.friends);
    const myGoals = useSelector((s: RootState) => s.goals.goals);
    const stepsVal = useSelector(selectTodaySteps);
    const { connectedDevice, onDeviceSteps } = useSelector((s: RootState) => s.device);
    const hasStepsSource = !!connectedDevice || onDeviceSteps !== null;
    const sharedGoals = myGoals.filter((g) => g.sharedWithFriends && g.enabled !== false);
    const stepsGoal = myGoals.find((g) => g.type === 'steps' && g.enabled !== false);

    const [myMedId, setMyMedId] = useState<string | null>(null);
    const [badges, setBadges] = useState<{ earned: EarnedBadge[]; available: BadgeInfo[] }>({ earned: [], available: [] });
    const [copied, setCopied] = useState(false);
    const [medIdInput, setMedIdInput] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    useEffect(() => {
        getProfileDetails().then((p: any) => setMyMedId(p?.med_id || null)).catch(() => {});
    }, []);

    // Every time this screen is opened: read today's steps, then load the board - so what friends see of you (and what you see of them)
    // is today's, not whatever the Health tab last happened to save.
    useFocusEffect(
        useCallback(() => {
            dispatch(loadOnDeviceSteps());
            dispatch(loadFriendsData());
            fetchBadges().then(setBadges).catch(() => {});
        }, [dispatch]),
    );

    // Save today's steps onto the steps goal, then refresh the board with it.
    const stepsGoalId = stepsGoal?.id;
    const storedSteps = stepsGoal?.current;
    useEffect(() => {
        if (stepsGoalId && hasStepsSource && storedSteps !== stepsVal) {
            dispatch(updateGoalProgress({ id: stepsGoalId, current: stepsVal })).then(() => dispatch(loadFriendsData()));
        }
    }, [stepsGoalId, hasStepsSource, storedSteps, stepsVal, dispatch]);

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const handleCopy = async () => {
        if (!myMedId) return;
        await Clipboard.setStringAsync(myMedId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendRequest = async () => {
        if (!medIdInput.trim()) return;
        setSending(true);
        try {
            const result = await dispatch(sendFriendRequest(medIdInput.trim().toUpperCase())).unwrap();
            setMedIdInput('');
            showStatus(
                'success',
                result.autoAccepted ? 'Friend added' : 'Request sent',
                result.autoAccepted
                    ? 'You are now friends.'
                    : 'Friend request sent - they need to accept it before you can compare goals.'
            );
            dispatch(loadFriendsData());
        } catch (error: any) {
            // sendFriendRequest's thunk rejects via rejectWithValue(string) -
            // unwrap() throws that string directly, not an Error object, so
            // error.message is always undefined here even when the backend
            // sent a specific, useful reason (e.g. "No user found with that
            // MED ID"). Same fix already applied in LogVitalsScreen.tsx.
            showStatus('error', t('could_not_send_request'), typeof error === 'string' ? error : 'Something went wrong. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleAccept = (id: string) => dispatch(acceptFriendRequest(id));
    const handleReject = (id: string) => dispatch(rejectFriendRequest(id));
    const handleRemove = (id: string) => dispatch(removeFriend(id));

    const initial = (name?: string) => (name || '?').trim().charAt(0).toUpperCase() || '?';

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('friends')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(loadFriendsData())} />}
            >
                {myMedId && (
                    <View style={styles.medIdCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.medIdLabel}>{t('your_med_id')}</Text>
                            <Text style={styles.medIdValue}>{myMedId}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                            <Copy size={14} color="#10B981" />
                            <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.sectionLabel}>{t('add_a_friend')}</Text>
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.addInput}
                        placeholder={t('enter_med_id')}
                        placeholderTextColor={theme.textMuted}
                        value={medIdInput}
                        onChangeText={setMedIdInput}
                        autoCapitalize="characters"
                        returnKeyType="done"
                        onSubmitEditing={handleSendRequest}
                    />
                    <TouchableOpacity
                        style={[styles.addBtn, (sending || !medIdInput.trim()) && styles.addBtnDisabled]}
                        onPress={handleSendRequest}
                        disabled={sending || !medIdInput.trim()}
                        activeOpacity={0.8}
                    >
                        {sending ? <ActivityIndicator color="#FFF" size="small" /> : <UserPlus size={18} color={medIdInput.trim() ? '#FFFFFF' : theme.textMuted} />}
                    </TouchableOpacity>
                </View>

                {incomingRequests.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>{t('friend_requests')}</Text>
                        <View style={styles.list}>
                            {incomingRequests.map((r) => (
                                <View key={r.id} style={styles.requestCard}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarInitial}>{initial(r.profile?.name)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.friendName}>{r.profile?.name || 'Medicoo User'}</Text>
                                        <Text style={styles.friendMedId}>{r.profile?.medId}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.iconCircle, styles.acceptBtn]}
                                        onPress={() => handleAccept(r.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Check size={18} color="#10B981" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconCircle, styles.rejectBtn]}
                                        onPress={() => handleReject(r.id)}
                                        activeOpacity={0.7}
                                    >
                                        <X size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                <Text style={styles.sectionLabel}>YOUR FRIENDS ({friends.length})</Text>
                {friends.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIconBox}>
                            <Users size={28} color={theme.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>{t('no_friends')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {t('add_a_friend_using_their_med_id_to_sta')}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {friends.map((f) => (
                            <View key={f.id} style={styles.friendCard}>
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarInitial}>{initial(f.profile?.name)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.friendName}>{f.profile?.name || 'Medicoo User'}</Text>
                                    <Text style={styles.friendMedId}>{f.profile?.medId}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => handleRemove(f.id)}
                                    activeOpacity={0.7}
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {friends.length > 0 && goalProgress.length === 0 && (
                    <>
                        <Text style={styles.sectionLabel}>{t('how_you_compare')}</Text>
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconBox}>
                                <Target size={28} color={theme.textMuted} />
                            </View>
                            {sharedGoals.length === 0 ? (
                                <>
                                    <Text style={styles.emptyTitle}>Share a goal to compare</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Goals are private until you share them. Open Manage Goals and tap Share on a goal, then ask your friends to share the same one.
                                    </Text>
                                    <TouchableOpacity style={styles.compareBtn} onPress={() => (navigation as any).navigate('ManageGoals')} activeOpacity={0.85}>
                                        <Text style={styles.compareBtnText}>Manage goals</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.emptyTitle}>No friend shares the same goal yet</Text>
                                    <Text style={styles.emptySubtitle}>
                                        You are sharing {sharedGoals.map((g) => g.title).join(', ')}. A comparison shows up once a friend shares the same kind of goal.
                                    </Text>
                                </>
                            )}
                        </View>
                    </>
                )}

                {goalProgress.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>{t('how_you_compare')}</Text>
                        <View style={styles.list}>
                            {goalProgress.map((group) => {
                                const Icon = getGoalIcon(group.type);
                                const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');
                                const unitText = group.unit ? ` ${group.unit}` : '';
                                const me = group.entries.find((e) => e.isSelf);
                                const leader = group.entries[0];
                                const runnerUp = group.entries.find((e) => !e.isSelf);
                                const nameOf = (e: any) => e?.profile?.name || 'your friend';
                                // How the race stands: ahead, or how far behind the leader
                                let standing = '';
                                let leading = false;
                                if (me && leader) {
                                    if (leader.isSelf && runnerUp) {
                                        leading = true;
                                        standing = me.current > runnerUp.current
                                            ? `You are leading, ${fmt(me.current - runnerUp.current)}${unitText} ahead of ${nameOf(runnerUp)}.`
                                            : `Level with ${nameOf(runnerUp)} for now.`;
                                    } else if (!leader.isSelf) {
                                        standing = leader.current === me.current
                                            ? `Level with ${nameOf(leader)} for now.`
                                            : `You are ${fmt(leader.current - me.current)}${unitText} behind ${nameOf(leader)}.`;
                                    }
                                }
                                return (
                                    <View key={group.key} style={styles.leaderboardCard}>
                                        <View style={styles.leaderboardHeader}>
                                            <Icon size={18} color="#10B981" />
                                            <Text style={styles.leaderboardTitle}>{group.title}</Text>
                                        </View>
                                        {standing ? (
                                            <Text style={[styles.standing, leading && styles.standingLeading]}>{standing}</Text>
                                        ) : null}
                                        {group.entries.map((entry, index) => {
                                            const Row: any = entry.isSelf ? View : TouchableOpacity;
                                            const rowProps = entry.isSelf
                                                ? {}
                                                : {
                                                    activeOpacity: 0.7,
                                                    onPress: () => (navigation as any).navigate('GoalComparison', {
                                                        friendId: entry.userId,
                                                        friendName: entry.profile?.name,
                                                        goalKey: group.key,
                                                    }),
                                                };
                                            return (
                                                <Row key={entry.userId} style={styles.entryRow} {...rowProps}>
                                                    <Text style={[styles.entryRank, index === 0 && styles.entryRankFirst]}>#{index + 1}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={styles.entryHeader}>
                                                            <Text style={[styles.entryName, entry.isSelf && styles.entryNameSelf]}>
                                                                {entry.isSelf ? 'You' : (entry.profile?.name || 'Friend')}
                                                            </Text>
                                                            <Text style={styles.entryPercent}>{entry.progressPercent}%</Text>
                                                        </View>
                                                        <Text style={styles.entryDetail}>
                                                            {`${fmt(entry.current)} / ${fmt(entry.target)}${unitText}`}
                                                            {!entry.isSelf && entry.syncedToday === false ? '  ·  not updated today' : ''}
                                                        </Text>
                                                        <View style={styles.entryBarBg}>
                                                            <View
                                                                style={[
                                                                    styles.entryBarFill,
                                                                    { width: `${entry.progressPercent}%`, backgroundColor: entry.isSelf ? '#10B981' : '#94A3B8' },
                                                                ]}
                                                            />
                                                        </View>
                                                    </View>
                                                    {!entry.isSelf ? <ChevronRight size={16} color={theme.textMuted} /> : null}
                                                </Row>
                                            );
                                        })}
                                        <Text style={styles.tapHint}>Tap a friend to see how you compare day by day.</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
                {friends.length > 0 && (badges.earned.length > 0 || badges.available.length > 0) ? (
                    <>
                        <Text style={styles.sectionLabel}>YOUR BADGES</Text>
                        <View style={styles.badgesCard}>
                            <BadgesStrip earned={badges.earned} available={badges.available} />
                        </View>
                    </>
                ) : null}
            </ScrollView>

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={() => setStatus((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    medIdCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.successBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: c.isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7',
        padding: 16,
        marginBottom: 24,
    },
    medIdLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#10B981',
        letterSpacing: 1,
        marginBottom: 4,
    },
    medIdValue: {
        fontSize: 16,
        fontWeight: '800',
        color: c.text,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: c.card,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: c.isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7',
    },
    copyBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: c.textMuted,
        letterSpacing: 1,
        marginBottom: 12,
    },
    addRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    addInput: {
        flex: 1,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: c.text,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnDisabled: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
    },
    list: {
        gap: 12,
        marginBottom: 24,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.card,
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: c.border,
        gap: 10,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.card,
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: c.border,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: c.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10B981',
    },
    friendName: {
        fontSize: 15,
        fontWeight: '700',
        color: c.text,
    },
    friendMedId: {
        fontSize: 12,
        color: c.textSecondary,
        fontWeight: '500',
        marginTop: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    acceptBtn: {
        backgroundColor: c.successBg,
    },
    rejectBtn: {
        backgroundColor: c.errorBg,
    },
    removeBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: c.errorBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCard: {
        backgroundColor: c.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: c.border,
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: c.text,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: c.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
    },
    leaderboardCard: {
        backgroundColor: c.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: c.border,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    leaderboardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: c.text,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    entryRank: {
        fontSize: 12,
        fontWeight: '700',
        color: c.textMuted,
        width: 22,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    entryName: {
        fontSize: 13,
        fontWeight: '600',
        color: c.textSecondary,
    },
    entryNameSelf: {
        color: '#10B981',
        fontWeight: '800',
    },
    standing: { fontSize: 12.5, fontWeight: '700', color: c.textSecondary, marginBottom: 6 },
    standingLeading: { color: '#10B981' },
    entryRankFirst: { color: '#F59E0B' },
    tapHint: { fontSize: 11, color: c.textMuted, marginTop: 8 },
    badgesCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.borderLight, padding: 14 },
    entryDetail: { fontSize: 11, color: c.textMuted, marginBottom: 4 },
    compareBtn: { marginTop: 16, height: 44, borderRadius: 10, paddingHorizontal: 24, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    compareBtnText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, color: '#fff' },
    entryPercent: {
        fontSize: 12,
        color: c.textSecondary,
        fontWeight: '600',
    },
    entryBarBg: {
        height: 6,
        backgroundColor: c.cardSecondary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    entryBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});
