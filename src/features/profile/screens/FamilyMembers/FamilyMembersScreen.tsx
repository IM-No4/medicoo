import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeft, Clock, Plus, User, UserPlus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { getFamilyMembers, removeFamilyMember } from '../../../../services/api';

interface FamilyMember {
    _id: string;
    name: string;
    relation: string;
    status: string;
    age?: number;
    gender?: string;
    linkedUserId?: {
        name: string;
        profileImage: string;
        med_id: string;
        phone: string;
    };
}

interface PendingRequest {
    _id: string;
    targetUserId: {
        name: string;
        med_id: string;
    };
    relation: string;
    status: string;
    expiresAt: string;
}

export default function FamilyMembersScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusMode, setStatusMode] = useState<StatusType>('idle');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // Confirm Modal State
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ id: string, name: string } | null>(null);

    const fetchMembers = useCallback(async () => {
        try {
            const data = await getFamilyMembers();
            setMembers(data.members || []);
            setPendingRequests(data.pendingRequests || []);
        } catch (error) {
            console.error('Error fetching family members:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchMembers();
        }, [fetchMembers])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMembers();
    }, [fetchMembers]);

    const handleDelete = (id: string, name: string) => {
        setMemberToDelete({ id, name });
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (!memberToDelete) return;

        setConfirmVisible(false);
        try {
            setStatusMode('loading');
            setStatusMessage(`Removing ${memberToDelete.name}...`);
            setStatusVisible(true);

            await removeFamilyMember(memberToDelete.id);

            setStatusMode('success');
            setStatusTitle('Member Removed');
            setStatusMessage(`${memberToDelete.name} has been removed from your family group.`);

            fetchMembers();
        } catch (error: any) {
            console.error('Error removing member:', error);
            setStatusMode('error');
            setStatusTitle('Error');
            setStatusMessage(error?.response?.data?.message || 'Failed to remove family member.');
        } finally {
            setMemberToDelete(null);
        }
    };

    const renderMemberCard = (item: FamilyMember) => {
        const isLinked = !!item.linkedUserId;
        const displayName = isLinked ? item.linkedUserId?.name : item.name;
        const displayImage = isLinked ? item.linkedUserId?.profileImage : null;
        const medId = item.linkedUserId?.med_id;

        return (
            <View key={item._id} style={styles.card}>
                <View style={styles.cardMain}>
                    <View style={styles.avatarCircle}>
                        {displayImage ? (
                            <Image source={{ uri: displayImage }} style={styles.avatarFull} />
                        ) : (
                            <User size={24} color="#2FA561" />
                        )}
                    </View>
                    <View style={styles.memberInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.memberName}>{displayName}</Text>
                            <View style={styles.relationBadge}>
                                <Text style={styles.relationText}>{item.relation.toUpperCase()}</Text>
                            </View>
                        </View>
                        {medId && (
                            <View style={styles.medIdBadge}>
                                <Text style={styles.medIdText}>{medId}</Text>
                            </View>
                        )}
                        {!isLinked && (
                            <Text style={styles.memberSubText}>
                                {item.gender ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1) : ''} • {item.age} years
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    {!isLinked && (
                        <>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => executeAction('OPEN_ADD_FAMILY_MEMBER', { member: item, isEditing: true })}
                            >
                                <Text style={styles.actionText}>Edit Details</Text>
                            </TouchableOpacity>
                            <View style={styles.divider} />
                        </>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item._id, displayName || 'Member')}
                    >
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderPendingRequest = (req: PendingRequest) => (
        <View key={req._id} style={[styles.card, styles.pendingCard]}>
            <View style={styles.cardMain}>
                <View style={[styles.avatarCircle, styles.pendingAvatar]}>
                    <Clock size={20} color="#6B7280" />
                </View>
                <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.memberName}>{req.targetUserId.name}</Text>
                        <View style={[styles.relationBadge, styles.pendingBadge]}>
                            <Text style={styles.relationText}>{req.relation.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.medIdText}>{req.targetUserId.med_id}</Text>
                    <Text style={styles.statusText}>Request Sent • Pending Approval</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Family Members</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2FA561']} />
                }
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2FA561" />
                        <Text style={styles.loadingText}>Fetching members...</Text>
                    </View>
                ) : members.length === 0 && pendingRequests.length === 0 ? (
                    <>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Manage your family group. Add manual members or link with existing Medicoo users using their MED ID.
                            </Text>
                        </View>
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconCircle}>
                                <UserPlus size={40} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyTitle}>No Family Members</Text>
                            <Text style={styles.emptyText}>Add your loved ones to manage their healthcare.</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.list}>
                        {members.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Members ({members.length})</Text>
                                {members.map(renderMemberCard)}
                            </>
                        )}

                        {pendingRequests.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Pending Requests ({pendingRequests.length})</Text>
                                {pendingRequests.map(renderPendingRequest)}
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => executeAction('OPEN_ADD_FAMILY_MEMBER')}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Family Member</Text>
                </TouchableOpacity>
            </View>

            <ConfirmModal
                visible={confirmVisible}
                title="Remove Family Member"
                message={`Are you sure you want to remove ${memberToDelete?.name}? This action cannot be undone.`}
                confirmText="Remove"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setConfirmVisible(false);
                    setMemberToDelete(null);
                }}
            />

            <StatusModal
                visible={statusVisible}
                status={statusMode}
                title={statusTitle}
                message={statusMessage}
                onClose={() => setStatusVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingBottom: 120,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
    },
    infoBox: {
        backgroundColor: '#F0FDF4',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    infoText: {
        fontSize: 14,
        color: '#166534',
        lineHeight: 20,
    },
    list: {
        gap: 0,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
        marginBottom: 16,
    },
    pendingCard: {
        backgroundColor: '#F9FAFB',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarFull: {
        width: '100%',
        height: '100%',
    },
    pendingAvatar: {
        backgroundColor: '#E5E7EB',
    },
    memberInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    relationBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pendingBadge: {
        backgroundColor: '#E5E7EB',
    },
    relationText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4B5563',
    },
    medIdBadge: {
        marginBottom: 4,
    },
    medIdText: {
        fontSize: 12,
        color: '#2FA561',
        fontWeight: '600',
    },
    memberSubText: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingVertical: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
});
