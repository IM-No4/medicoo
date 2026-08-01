import { useFocusEffect, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MoreVertical, Send } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { API_BASE_URL } from '../../services/api/client';
import { ConsultationChatMessage, getConsultationMessages, sendConsultationMessage } from '../../services/api/consultationChat.api';
import { completeAppointmentRequest, ConsultationDetailsInput, getDoctorAppointmentRequestDetail } from '../../services/api/doctor.api';
import { onConsultationChatMessage } from '../../services/socketService';
import ConsultationDetailsModal, { ConsultationDraft } from './components/ConsultationDetailsModal';
import InCallToolsSheet from './components/InCallToolsSheet';
import PatientReportsModal from './components/PatientReportsModal';

const EMPTY_DRAFT: ConsultationDraft = { notes: '', prescribedMedicines: [], prescribedLabTests: [] };

export default function DoctorChatScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { requestId, title, image } = route.params || {};
    const flatListRef = useRef<FlatList>(null);

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ConsultationChatMessage[]>([]);
    const [viewerRole, setViewerRole] = useState<'customer' | 'doctor' | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [sending, setSending] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [showToolsSheet, setShowToolsSheet] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [consultationDraft, setConsultationDraft] = useState<ConsultationDraft>(EMPTY_DRAFT);
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

    const displayName = title || 'Chat';

    // The keyboard already covers the home-indicator safe area, so the extra
    // insets.bottom padding below (needed when the keyboard is closed) would
    // otherwise stack with the keyboard's own space and leave a gap above it.
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const loadMessages = useCallback(async (showSpinner: boolean) => {
        if (!requestId) return;
        if (showSpinner) setLoading(true);
        try {
            const data = await getConsultationMessages(requestId);
            setMessages(data.messages);
            setViewerRole(data.viewerRole);
            setLoadError(false);
        } catch (error) {
            console.warn('Failed to load consultation chat:', error);
            if (showSpinner) setLoadError(true);
        } finally {
            if (showSpinner) setLoading(false);
        }
    }, [requestId]);

    useFocusEffect(
        useCallback(() => {
            loadMessages(true);
        }, [loadMessages])
    );

    // Needed for the in-call "Patient Reports" tool - the chat's own message
    // API doesn't carry the patient's customerId, so fetch it once from the
    // appointment detail, same as the call screen already receives it via
    // navigation params.
    useEffect(() => {
        if (viewerRole !== 'doctor' || !requestId) return;
        getDoctorAppointmentRequestDetail(requestId)
            .then((data) => setCustomerId(data?.data?.customerId || null))
            .catch(() => { });
    }, [viewerRole, requestId]);

    useEffect(() => {
        const unsubscribe = onConsultationChatMessage(({ requestId: incomingRequestId, message: incoming }) => {
            if (incomingRequestId !== requestId) return;
            setMessages(prev => (prev.some(m => m._id === incoming._id) ? prev : [...prev, incoming]));
        });
        return unsubscribe;
    }, [requestId]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        }
    }, [messages.length]);

    const handleCompleteConsultation = async (details: ConsultationDetailsInput) => {
        setShowCompleteModal(false);
        if (!requestId) return;
        try {
            await completeAppointmentRequest(requestId, details);
            showStatus('success', 'Consultation Completed', 'This consultation has been marked as completed.', () => {
                hideStatus();
                executeAction('GO_BACK');
            }, 'Done');
        } catch (error: any) {
            showStatus('error', 'Could Not Complete', error?.response?.data?.message || 'Please try again.');
        }
    };

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || sending || !requestId) return;

        setSending(true);
        setMessage('');
        try {
            const { message: sent } = await sendConsultationMessage(requestId, text);
            setMessages(prev => [...prev, sent]);
        } catch (error) {
            console.warn('Failed to send message:', error);
            setMessage(text);
        } finally {
            setSending(false);
        }
    };

    const renderMessageItem = ({ item }: { item: ConsultationChatMessage }) => {
        const isMine = viewerRole !== null && item.senderRole === viewerRole;
        const time = new Date(item.createdOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
            <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
                <View style={[styles.messageBubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.messageText, isMine ? styles.textRight : styles.textLeft]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, isMine ? styles.timeRight : styles.timeLeft]}>
                        {time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>

                <View style={styles.headerInfo}>
                    {image ? (
                        <Image
                            source={{ uri: image.startsWith('http') ? image : `${API_BASE_URL}/${image}` }}
                            style={styles.avatarHeader}
                        />
                    ) : (
                        <View style={styles.avatarHeader}>
                            <Text style={styles.avatarTextHeader}>{displayName.charAt(0)}</Text>
                        </View>
                    )}
                    <Text style={styles.headerTitle}>{displayName}</Text>
                </View>

                {viewerRole === 'doctor' ? (
                    <TouchableOpacity style={styles.iconButton} onPress={() => setShowToolsSheet(true)}>
                        <MoreVertical size={20} color="#4B5563" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.iconButton} />
                )}
            </View>

            {/* Chat Area + Input. AndroidManifest.xml's windowSoftInputMode=
                "adjustResize" turned out not to reach this screen on its own
                (react-native-screens' native-Fragment-based navigation
                doesn't always propagate window resize the way a plain
                Activity does), so the input needs KeyboardAvoidingView's own
                compensation on both platforms after all - matching the
                'padding'/'height' split every other screen in this app
                already uses for the same reason. */}
            <KeyboardAvoidingView
                style={styles.flexOne}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#2FA561" />
                    </View>
                ) : loadError ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>Couldn't load this conversation.</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        style={styles.flexOne}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.chatContent}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.errorText}>No messages yet. Say hello!</Text>
                            </View>
                        }
                    />
                )}

                <View style={[styles.inputContainer, { paddingBottom: (keyboardVisible ? 0 : insets.bottom) + 12 }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!message.trim() || sending}
                    >
                        <Send size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <ConsultationDetailsModal
                visible={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                onSubmit={handleCompleteConsultation}
                initialData={consultationDraft}
            />

            <InCallToolsSheet
                visible={showToolsSheet}
                onClose={() => setShowToolsSheet(false)}
                onOpenNotes={() => { setShowToolsSheet(false); setShowNotesModal(true); }}
                onOpenReports={() => { setShowToolsSheet(false); setShowReportsModal(true); }}
                onComplete={() => { setShowToolsSheet(false); setShowCompleteModal(true); }}
            />

            <ConsultationDetailsModal
                visible={showNotesModal}
                mode="draft"
                onClose={() => setShowNotesModal(false)}
                onSubmit={async () => { }}
                initialData={consultationDraft}
                onSaveDraft={setConsultationDraft}
            />

            <PatientReportsModal
                visible={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                customerId={customerId || undefined}
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
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    flexOne: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 12
    },
    backButton: { padding: 4 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarHeader: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E7FF',
        alignItems: 'center', justifyContent: 'center'
    },
    avatarTextHeader: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
    headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    iconButton: { padding: 4 },

    chatContent: { padding: 16, paddingBottom: 24, gap: 16, flexGrow: 1 },

    // Messages
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '80%' },
    messageRowLeft: { alignSelf: 'flex-start' },
    messageRowRight: { alignSelf: 'flex-end' },

    messageBubble: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: '100%'
    },
    bubbleLeft: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4
    },
    bubbleRight: {
        backgroundColor: '#2FA561',
        borderBottomRightRadius: 4
    },
    messageText: { fontSize: 15, lineHeight: 22 },
    textLeft: { color: '#1F2937' },
    textRight: { color: '#fff' },

    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    timeLeft: { color: '#9CA3AF' },
    timeRight: { color: 'rgba(255,255,255,0.7)' },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingTop: 10,
        fontSize: 15,
        color: '#1F2937',
        maxHeight: 100
    },
    sendButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#2FA561',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4
    },
    sendButtonDisabled: { backgroundColor: '#D1D5DB' }
});
