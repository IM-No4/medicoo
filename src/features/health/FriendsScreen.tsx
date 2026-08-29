import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import {
    Activity,
    Brain,
    ChevronLeft,
    Check,
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
import React, { useEffect, useState } from 'react';
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
import { getProfileDetails } from '../../services/api/user.api';

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
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();

    const { friends, incomingRequests, goalProgress, loading } = useSelector((s: RootState) => s.friends);

    const [myMedId, setMyMedId] = useState<string | null>(null);
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
        dispatch(loadFriendsData());
        getProfileDetails().then((p: any) => setMyMedId(p?.med_id || null)).catch(() => {});
    }, [dispatch]);

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
            showStatus('error', 'Could not send request', typeof error === 'string' ? error : 'Something went wrong. Please try again.');
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

            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Friends</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(loadFriendsData())} />}
            >
                {myMedId && (
                    <View style={styles.medIdCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.medIdLabel}>YOUR MED ID</Text>
                            <Text style={styles.medIdValue}>{myMedId}</Text>
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                            <Copy size={14} color="#0FBBA1" />
                            <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.sectionLabel}>ADD A FRIEND</Text>
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.addInput}
                        placeholder="Enter their MED ID"
                        placeholderTextColor="#94A3B8"
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
                        {sending ? <ActivityIndicator color="#FFF" size="small" /> : <UserPlus size={18} color="#FFF" />}
                    </TouchableOpacity>
                </View>

                {incomingRequests.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>FRIEND REQUESTS</Text>
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
                            <Users size={28} color="#94A3B8" />
                        </View>
                        <Text style={styles.emptyTitle}>No friends yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Add a friend using their MED ID to start comparing goals.
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

                {goalProgress.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>HOW YOU COMPARE</Text>
                        <View style={styles.list}>
                            {goalProgress.map((group) => {
                                const Icon = getGoalIcon(group.type);
                                return (
                                    <View key={group.key} style={styles.leaderboardCard}>
                                        <View style={styles.leaderboardHeader}>
                                            <Icon size={18} color="#0FBBA1" />
                                            <Text style={styles.leaderboardTitle}>{group.title}</Text>
                                        </View>
                                        {group.entries.map((entry, index) => (
                                            <View key={entry.userId} style={styles.entryRow}>
                                                <Text style={styles.entryRank}>#{index + 1}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <View style={styles.entryHeader}>
                                                        <Text style={[styles.entryName, entry.isSelf && styles.entryNameSelf]}>
                                                            {entry.isSelf ? 'You' : (entry.profile?.name || 'Friend')}
                                                        </Text>
                                                        <Text style={styles.entryPercent}>{entry.progressPercent}%</Text>
                                                    </View>
                                                    <View style={styles.entryBarBg}>
                                                        <View
                                                            style={[
                                                                styles.entryBarFill,
                                                                {
                                                                    width: `${entry.progressPercent}%`,
                                                                    backgroundColor: entry.isSelf ? '#0FBBA1' : '#94A3B8',
                                                                },
                                                            ]}
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })}
                        </View>
                    </>
                )}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
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
        color: '#111827',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    medIdCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
        padding: 16,
        marginBottom: 24,
    },
    medIdLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0FBBA1',
        letterSpacing: 1,
        marginBottom: 4,
    },
    medIdValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    copyBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0FBBA1',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#0FBBA1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    list: {
        gap: 12,
        marginBottom: 24,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 10,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarInitial: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0FBBA1',
    },
    friendName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    friendMedId: {
        fontSize: 12,
        color: '#64748B',
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
        backgroundColor: '#ECFDF5',
    },
    rejectBtn: {
        backgroundColor: '#FEF2F2',
    },
    removeBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 19,
    },
    leaderboardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#0F172A',
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
        color: '#94A3B8',
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
        color: '#475569',
    },
    entryNameSelf: {
        color: '#0FBBA1',
        fontWeight: '800',
    },
    entryPercent: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    entryBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    entryBarFill: {
        height: '100%',
        borderRadius: 3,
    },
});
