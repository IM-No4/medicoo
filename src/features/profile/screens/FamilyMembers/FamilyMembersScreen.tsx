import { useMemo } from 'react';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from '@/src/components/ThemedStatusBar';
import { Check, ChevronLeft, ChevronRight, Clock, Plus, User, UserPlus, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { executeAction } from "../../../../actions/ActionExecutor";
import ConfirmModal from "../../../../components/modals/ConfirmModal";
import StatusModal, {
  StatusType,
} from "../../../../components/modals/StatusModal";
import {
  getFamilyMembers,
  getIncomingRequests,
  getMyMemberships,
  removeFamilyMember,
  respondToRequest,
  updateMySharingPermissions,
} from "../../../../services/api";
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { AuthImage } from '../../../../components/AuthImage';
import ConsentSheet from './ConsentSheet';
import {
  FamilyConsent,
  FamilyConsentItem,
  FamilyConsentKey,
  getConsentItems,
  getMyAccessLog,
} from '../../../../services/api/family.api';

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
  /** What this member has allowed me (the family head) to do */
  consentGiven?: FamilyConsent;
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

interface IncomingRequest {
  _id: string;
  requesterUserId: {
    name: string;
    med_id: string;
    profileImage?: string;
  };
  relation: string;
  expiresAt: string;
}

interface Membership {
  _id: string;
  relation: string;
  addedBy: {
    name: string;
    profileImage?: string;
  };
  permissions?: {
    viewMedicalRecords?: boolean;
  };
  /** What I have allowed this person to do */
  consentGiven?: FamilyConsent;
  /** set once I have made my choices; missing = I have never chosen */
  consentUpdatedAt?: string;
}

const ACTIVITY_WORDS: Record<string, string> = {
  viewed_medicines: "looked at your medicines",
  viewed_adherence: "looked at what you took or skipped",
  viewed_vitals: "looked at your vitals",
  viewed_appointments: "looked at your appointments",
  viewed_documents: "looked at your documents",
  viewed_prescriptions: "looked at your prescriptions",
  opened_document: "opened a document",
  uploaded_document: "added a document",
  booked_consultation: "booked a consultation for you",
  joined_call: "joined your consultation call",
  added_medicine: "added a medicine for you",
  changed_medicine: "changed a medicine for you",
  marked_dose_taken: "marked a dose as taken for you",
  marked_dose_skipped: "marked a dose as skipped for you",
};

export default function FamilyMembersScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // The member's own choices (what the family head may see and do): chosen when accepting a request, changed any time later.
  const [consentItems, setConsentItems] = useState<FamilyConsentItem[]>([]);
  const [consentTarget, setConsentTarget] = useState<
    { kind: 'accept'; req: IncomingRequest } | { kind: 'manage'; membership: Membership } | null
  >(null);
  const [consentValues, setConsentValues] = useState<FamilyConsent>({} as FamilyConsent);
  const [savingConsent, setSavingConsent] = useState(false);
  const [activityVisible, setActivityVisible] = useState(false);
  const [activity, setActivity] = useState<{ id: string; action: string; by: string; at: string; detail?: string }[]>([]);

  // Status Modal State
  const [statusVisible, setStatusVisible] = useState(false);
  const [statusMode, setStatusMode] = useState<StatusType>("idle");
  const [statusTitle, setStatusTitle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Confirm Modal State
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const [data, incoming, membershipsRes] = await Promise.all([
        getFamilyMembers(),
        // Someone else's request into this account - previously fetched
        // by nothing at all in the app, so an incoming request was
        // completely invisible short of a push notification landing.
        getIncomingRequests().catch((e) => {
          console.error("Error fetching incoming family requests:", e);
          return [];
        }),
        // Groups the CURRENT user has been linked INTO by someone else -
        // the reverse of `data.members` above (which only lists groups
        // this user themselves owns). This is what surfaces the sharing
        // toggle to the person whose data is actually at stake.
        getMyMemberships().catch((e) => {
          console.error("Error fetching family memberships:", e);
          return { data: [] };
        }),
      ]);
      setMembers(data.members || []);
      if (consentItems.length === 0) {
        getConsentItems().then(setConsentItems).catch(() => {});
      }
      setPendingRequests(data.pendingRequests || []);
      setIncomingRequests(Array.isArray(incoming) ? incoming : []);
      setMemberships(membershipsRes?.data || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const emptyConsent = (): FamilyConsent =>
    consentItems.reduce((acc, item) => ({ ...acc, [item.key]: false }), {} as FamilyConsent);

  const openManageConsent = (membership: Membership) => {
    setConsentValues({ ...emptyConsent(), ...(membership.consentGiven || {}) });
    setConsentTarget({ kind: 'manage', membership });
  };

  const openAcceptConsent = (req: IncomingRequest) => {
    setConsentValues(emptyConsent());
    setConsentTarget({ kind: 'accept', req });
  };

  const saveConsent = async () => {
    if (!consentTarget) return;
    setSavingConsent(true);
    try {
      if (consentTarget.kind === 'accept') {
        await handleRespond(consentTarget.req, 'accept', consentValues);
      } else {
        await updateMySharingPermissions(consentTarget.membership._id, consentValues);
        setMemberships((prev) =>
          prev.map((m) => (m._id === consentTarget.membership._id ? { ...m, consentGiven: consentValues } : m)),
        );
      }
      setConsentTarget(null);
    } catch (error) {
      setStatusMode('error');
      setStatusTitle('Error');
      setStatusMessage('Could not save your choices. Please try again.');
      setStatusVisible(true);
    } finally {
      setSavingConsent(false);
    }
  };

  const openActivity = async () => {
    setActivityVisible(true);
    try {
      setActivity(await getMyAccessLog());
    } catch {
      setActivity([]);
    }
  };

  const handleRespond = async (req: IncomingRequest, action: "accept" | "reject", consent?: FamilyConsent) => {
    setRespondingId(req._id);
    try {
      await respondToRequest(req._id, action, consent);
      setIncomingRequests((prev) => prev.filter((r) => r._id !== req._id));
      if (action === "accept") {
        setStatusMode("success");
        setStatusTitle("Request Accepted");
        setStatusMessage(`You're now linked with ${req.requesterUserId.name}. You can change what they can do any time.`);
        setStatusVisible(true);
        fetchMembers();
      }
    } catch (error: any) {
      setStatusMode("error");
      setStatusTitle("Error");
      setStatusMessage(
        error?.response?.data?.message || "Failed to respond to this request.",
      );
      setStatusVisible(true);
    } finally {
      setRespondingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers]),
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
      setStatusMode("loading");
      setStatusMessage(`Removing ${memberToDelete.name}...`);
      setStatusVisible(true);

      await removeFamilyMember(memberToDelete.id);

      setStatusMode("success");
      setStatusTitle("Member Removed");
      setStatusMessage(
        `${memberToDelete.name} has been removed from your family group.`,
      );

      fetchMembers();
    } catch (error: any) {
      console.error("Error removing member:", error);
      setStatusMode("error");
      setStatusTitle("Error");
      setStatusMessage(
        error?.response?.data?.message || "Failed to remove family member.",
      );
    } finally {
      setMemberToDelete(null);
    }
  };

  const renderMemberCard = (item: FamilyMember) => {
    const isLinked = !!item.linkedUserId;
    const displayName = isLinked ? item.linkedUserId?.name : item.name;
    const displayImage = isLinked ? item.linkedUserId?.profileImage : null;
    const medId = item.linkedUserId?.med_id;

    // Every member has a page: a linked member's shows what they chose to share, an unlinked member (no Medicoo account) is looked
    // after from it entirely.
    const CardWrapper = TouchableOpacity;
    const allowedCount = isLinked && item.consentGiven ? Object.values(item.consentGiven).filter(Boolean).length : null;

    return (
      <CardWrapper
        key={item._id}
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("FamilyMemberHealth", {
            memberId: item._id,
            name: displayName,
            relation: item.relation,
            linked: isLinked,
            consent: item.consentGiven,
          })
        }
      >
        <View style={styles.cardMain}>
          <View style={styles.avatarCircle}>
            {displayImage ? (
              <AuthImage uri={displayImage} style={styles.avatarFull} />
            ) : (
              <User size={24} color="#10B981" />
            )}
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{displayName}</Text>
              <View style={styles.relationBadge}>
                <Text style={styles.relationText}>
                  {item.relation.toUpperCase()}
                </Text>
              </View>
            </View>
            {medId && (
              <View style={styles.medIdBadge}>
                <Text style={styles.medIdText}>{medId}</Text>
              </View>
            )}
            {!isLinked && (
              <Text style={styles.memberSubText}>
                {item.gender
                  ? item.gender.charAt(0).toUpperCase() + item.gender.slice(1)
                  : ""}{" "}
                • {item.age} years
              </Text>
            )}
            {isLinked && (
              <Text style={styles.memberSubText}>
                {allowedCount ? `Allows you ${allowedCount} thing${allowedCount > 1 ? "s" : ""}` : "Has not shared anything with you yet"}
              </Text>
            )}
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </View>

        <View style={styles.cardFooter}>
          {!isLinked && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  executeAction("OPEN_ADD_FAMILY_MEMBER", {
                    member: item,
                    isEditing: true,
                  })
                }
              >
                <Text style={styles.actionText}>{t('edit_details')}</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id, displayName || "Member")}
          >
            <Text style={[styles.actionText, { color: "#EF4444" }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </CardWrapper>
    );
  };

  const renderMembership = (membership: Membership) => {
    const allowed = Object.values(membership.consentGiven || {}).filter(Boolean).length;
    return (
      <View key={membership._id} style={styles.card}>
        <View style={styles.cardMain}>
          <View style={styles.avatarCircle}>
            {membership.addedBy?.profileImage ? (
              <AuthImage uri={membership.addedBy.profileImage} style={styles.avatarFull} />
            ) : (
              <User size={24} color="#10B981" />
            )}
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{membership.addedBy?.name || "Family Member"}</Text>
            <Text style={styles.statusText}>Added you as their {membership.relation}</Text>
            <Text style={styles.memberSubText}>
              {!membership.consentUpdatedAt
                ? "You have not chosen what they can do yet"
                : allowed ? `You allow them ${allowed} thing${allowed > 1 ? "s" : ""}` : "You have not allowed them anything"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openManageConsent(membership)}>
            <Text style={styles.actionText}>What they can do</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionButton} onPress={openActivity}>
            <Text style={styles.actionText}>Their activity</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderIncomingRequest = (req: IncomingRequest) => {
    const isResponding = respondingId === req._id;
    return (
      <View key={req._id} style={[styles.card, styles.incomingCard]}>
        <View style={styles.cardMain}>
          <View style={styles.avatarCircle}>
            {req.requesterUserId.profileImage ? (
              <AuthImage uri={req.requesterUserId.profileImage} style={styles.avatarFull} />
            ) : (
              <User size={24} color="#10B981" />
            )}
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{req.requesterUserId.name}</Text>
              <View style={styles.relationBadge}>
                <Text style={styles.relationText}>{req.relation.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.medIdText}>{req.requesterUserId.med_id}</Text>
            <Text style={styles.statusText}>
              Wants to add you as their {req.relation}
            </Text>
          </View>
        </View>

        <View style={styles.incomingActions}>
          <TouchableOpacity
            style={[styles.respondButton, styles.declineButton]}
            onPress={() => handleRespond(req, "reject")}
            disabled={isResponding}
          >
            <X size={16} color="#EF4444" />
            <Text style={[styles.respondButtonText, { color: "#EF4444" }]}>{t('decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.respondButton, styles.acceptButton]}
            onPress={() => openAcceptConsent(req)}
            disabled={isResponding}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={16} color="#fff" />
                <Text style={[styles.respondButtonText, { color: "#fff" }]}>{t('accept')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPendingRequest = (req: PendingRequest) => (
    <View key={req._id} style={[styles.card, styles.pendingCard]}>
      <View style={styles.cardMain}>
        <View style={[styles.avatarCircle, styles.pendingAvatar]}>
          <Clock size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{req.targetUserId.name}</Text>
            <View style={[styles.relationBadge, styles.pendingBadge]}>
              <Text style={styles.relationText}>
                {req.relation.toUpperCase()}
              </Text>
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
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('family_members')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10B981"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>{t('fetching_members')}</Text>
          </View>
        ) : members.length === 0 && pendingRequests.length === 0 && incomingRequests.length === 0 && memberships.length === 0 ? (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Manage your family group. Add manual members or link with
                existing Medicoo users using their MED ID.
              </Text>
            </View>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <UserPlus size={40} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t('no_family_members')}</Text>
              <Text style={styles.emptyText}>
                {t('add_your_loved_ones_to_manage_their_he')}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.list}>
            {incomingRequests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Requests For You ({incomingRequests.length})
                </Text>
                {incomingRequests.map(renderIncomingRequest)}
              </>
            )}

            {members.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, incomingRequests.length > 0 && { marginTop: 24 }]}>
                  Members ({members.length})
                </Text>
                {members.map(renderMemberCard)}
              </>
            )}

            {pendingRequests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                  Pending Requests ({pendingRequests.length})
                </Text>
                {pendingRequests.map(renderPendingRequest)}
              </>
            )}

            {memberships.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    (members.length > 0 || pendingRequests.length > 0) && { marginTop: 24 },
                  ]}
                >
                  Family Groups You Belong To ({memberships.length})
                </Text>
                {memberships.map(renderMembership)}
              </>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => executeAction("OPEN_ADD_FAMILY_MEMBER")}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>{t('add_family_member')}</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title={t('remove_family_member')}
        message={`Are you sure you want to remove ${memberToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmVisible(false);
          setMemberToDelete(null);
        }}
      />

      <ConsentSheet
        visible={!!consentTarget}
        title={
          consentTarget?.kind === 'accept'
            ? `What can ${consentTarget.req.requesterUserId.name} do for you?`
            : `What can ${consentTarget?.kind === 'manage' ? consentTarget.membership.addedBy?.name || 'they' : 'they'} do for you?`
        }
        subtitle="You decide. Nothing is shared until you turn it on, and you can change this any time."
        items={consentItems}
        values={consentValues}
        confirmText={consentTarget?.kind === 'accept' ? 'Accept and save' : 'Save'}
        busy={savingConsent}
        onChange={(key: FamilyConsentKey, value: boolean) => setConsentValues((prev) => ({ ...prev, [key]: value }))}
        onSetAll={(value: boolean) => setConsentValues(consentItems.reduce((acc, i) => ({ ...acc, [i.key]: value }), {} as FamilyConsent))}
        onConfirm={saveConsent}
        onClose={() => setConsentTarget(null)}
      />

      <Modal visible={activityVisible} transparent animationType="slide" onRequestClose={() => setActivityVisible(false)}>
        <View style={styles.activityOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setActivityVisible(false)} />
          <View style={[styles.activitySheet, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.activityTitle}>What they did in your records</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {activity.length === 0 ? (
                <Text style={styles.activityEmpty}>Nothing yet.</Text>
              ) : (
                activity.map((row) => (
                  <View key={row.id} style={styles.activityRow}>
                    <Text style={styles.activityText}>
                      {row.by} {ACTIVITY_WORDS[row.action] || row.action.replace(/_/g, " ")}
                      {row.detail ? ` · ${row.detail}` : ""}
                    </Text>
                    <Text style={styles.activityTime}>{new Date(row.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Same header recipe as the Add Family Member screen (and the
  // Calendar/Records/Health screens) - white bar + shadow, 40px shadowed
  // back button, fontSize 20/600/#111827 title.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: c.text,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: c.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: c.successBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: c.isDark ? "rgba(16,185,129,0.25)" : "#DCFCE7",
  },
  infoText: {
    fontSize: 12.5,
    color: c.success,
    lineHeight: 18,
  },
  list: {
    gap: 0,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  pendingCard: {
    backgroundColor: c.cardSecondary,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: c.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  incomingCard: {
    borderWidth: 1,
    borderColor: "#E6FBF7",
  },
  incomingActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    padding: 12,
    gap: 10,
  },
  respondButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  declineButton: {
    backgroundColor: c.errorBg,
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  respondButtonText: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  activityOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  activitySheet: { backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  activityTitle: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 10 },
  activityEmpty: { fontSize: 13, color: c.textSecondary, paddingVertical: 20, textAlign: "center" },
  activityRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  activityText: { fontSize: 13, color: c.text, lineHeight: 18 },
  activityTime: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  membershipFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  shareLabel: {
    flex: 1,
    fontSize: 11.5,
    color: c.textSecondary,
    fontWeight: "600",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarFull: {
    width: "100%",
    height: "100%",
  },
  pendingAvatar: {
    backgroundColor: c.cardSecondary,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: "700",
    color: c.text,
  },
  relationBadge: {
    backgroundColor: c.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: c.cardSecondary,
  },
  relationText: {
    fontSize: 9,
    fontWeight: "800",
    color: c.textSecondary,
  },
  medIdBadge: {
    marginBottom: 4,
  },
  medIdText: {
    fontSize: 11.5,
    color: "#10B981",
    fontWeight: "600",
  },
  memberSubText: {
    fontSize: 12,
    lineHeight: 17,
    color: c.textSecondary,
  },
  statusText: {
    fontSize: 11.5,
    color: c.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingVertical: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: c.textSecondary,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: c.cardSecondary,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: c.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    height: 48,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: "500",
  },
});
